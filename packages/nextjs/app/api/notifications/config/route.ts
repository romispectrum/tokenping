import { NextResponse } from "next/server";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { isAccessActive } from "~~/services/payments/checkAccess";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

const CONFIG_CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const notificationConfigCache = new Map<string, CacheEntry>();

/** Normalize wallet address for consistent DB lookups (PostgreSQL text comparison is case-sensitive). */
function normalizeUserId(userId: string): string {
  return userId.trim().toLowerCase();
}

function getCacheKey(userId: string, chainId?: number) {
  return `${userId}:${chainId ?? "all"}`;
}

function getCachedConfig(cacheKey: string) {
  const cached = notificationConfigCache.get(cacheKey);
  if (!cached) return { hit: false as const, data: null };
  if (Date.now() > cached.expiresAt) {
    notificationConfigCache.delete(cacheKey);
    return { hit: false as const, data: null };
  }

  return { hit: true as const, data: cached.data };
}

function setCachedConfig(cacheKey: string, data: unknown) {
  notificationConfigCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
  });
}

function invalidateUserConfigCache(userId: string) {
  for (const key of notificationConfigCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      notificationConfigCache.delete(key);
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const chainIdParam = searchParams.get("chainId");

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }

    const uid = normalizeUserId(userId);
    const trimmed = userId.trim();

    const chainId = chainIdParam != null && chainIdParam !== "" ? parseInt(chainIdParam, 10) : undefined;
    if (chainIdParam != null && chainIdParam !== "" && Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }

    const cacheKey = getCacheKey(uid, chainId);
    const cached = getCachedConfig(cacheKey);
    if (cached.hit) {
      return NextResponse.json(cached.data);
    }

    // Read config without access check so existing config is visible after refresh.
    // PUT/DELETE still require active paid access.
    const supabase = getSupabaseServerClient();

    if (chainIdParam != null && chainIdParam !== "") {
      let query = supabase.from("notification_configs").select("*").eq("user_id", uid);
      if (chainId !== undefined) query = query.eq("chain_id", chainId);
      let result = await query.single();

      if ((result.error || !result.data) && trimmed !== uid && chainId !== undefined) {
        result = await supabase
          .from("notification_configs")
          .select("*")
          .eq("user_id", trimmed)
          .eq("chain_id", chainId)
          .single();
      } else if ((result.error || !result.data) && trimmed !== uid) {
        result = await supabase.from("notification_configs").select("*").eq("user_id", trimmed).single();
      }

      const data = result.data;
      if (result.error || !data) {
        setCachedConfig(cacheKey, null);
        return NextResponse.json(null);
      }

      const response = {
        chainId: data.chain_id,
        enabled: data.enabled,
        services: data.services ?? [],
        healthFactorThreshold: parseFloat(String(data.health_factor_threshold)),
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
      };

      setCachedConfig(cacheKey, response);
      return NextResponse.json(response);
    }

    let result = await supabase.from("notification_configs").select("*").eq("user_id", uid);
    if ((result.error || !result.data?.length) && trimmed !== uid) {
      const fallback = await supabase.from("notification_configs").select("*").eq("user_id", trimmed);
      if (fallback.data?.length) result = fallback;
    }

    const data = result.data;
    if (result.error || !data) {
      setCachedConfig(cacheKey, {});
      return NextResponse.json({});
    }

    const configs = data.reduce(
      (acc, row) => {
        acc[row.chain_id] = {
          chainId: row.chain_id,
          enabled: row.enabled,
          services: row.services ?? [],
          healthFactorThreshold: parseFloat(String(row.health_factor_threshold)),
          email: row.email ?? undefined,
          phone: row.phone ?? undefined,
        };
        return acc;
      },
      {} as Record<
        number,
        {
          chainId: number;
          enabled: boolean;
          services: string[];
          healthFactorThreshold: number;
          email?: string;
          phone?: string;
        }
      >,
    );

    setCachedConfig(cacheKey, configs);
    return NextResponse.json(configs);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, chainId, enabled, services, healthFactorThreshold, email, phone } = body as {
      userId?: string;
      chainId?: number;
      enabled?: boolean;
      services?: string[];
      healthFactorThreshold?: number;
      email?: string | null;
      phone?: string | null;
    };

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }
    // chainId = the Aave network this config is for (position chain), NOT the wallet's connected chain
    if (chainId == null || typeof chainId !== "number" || Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Missing or invalid chainId" }, { status: 400 });
    }

    const trimmed = userId.trim();
    const uid = normalizeUserId(userId);

    const active = await isAccessActive(trimmed);
    if (!active) {
      return NextResponse.json({ error: "Active paid access required to update notification config" }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    const row = {
      user_id: uid,
      chain_id: chainId,
      enabled: enabled ?? true,
      services: Array.isArray(services) ? services : [],
      health_factor_threshold: healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD,
      email: email === undefined || email === null ? null : String(email).trim() || null,
      phone: phone === undefined || phone === null ? null : String(phone).trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Find existing row by either user_id form so we update in place instead of creating a duplicate
    const { data: existingByUid } = await supabase
      .from("notification_configs")
      .select("id")
      .eq("user_id", uid)
      .eq("chain_id", chainId)
      .maybeSingle();
    const { data: existingByTrimmed } =
      trimmed !== uid
        ? await supabase
            .from("notification_configs")
            .select("id")
            .eq("user_id", trimmed)
            .eq("chain_id", chainId)
            .maybeSingle()
        : { data: null };

    const existingId = existingByUid?.id ?? existingByTrimmed?.id;

    if (existingId) {
      const { error } = await supabase.from("notification_configs").update(row).eq("id", existingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    } else {
      const { error } = await supabase.from("notification_configs").insert(row);
      if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    }

    invalidateUserConfigCache(uid);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, chainId } = body as { userId?: string; chainId?: number };

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }
    if (chainId == null || typeof chainId !== "number" || Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Missing or invalid chainId" }, { status: 400 });
    }

    const trimmed = userId.trim();
    const uid = normalizeUserId(userId);

    const active = await isAccessActive(trimmed);
    if (!active) {
      return NextResponse.json({ error: "Active paid access required to delete notification config" }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    // Delete by both forms so we remove the row whether it was stored checksummed or lowercase
    const { error: err1 } = await supabase
      .from("notification_configs")
      .delete()
      .eq("user_id", uid)
      .eq("chain_id", chainId);
    if (err1) return NextResponse.json({ error: err1.message }, { status: 502 });
    if (trimmed !== uid) {
      const { error: err2 } = await supabase
        .from("notification_configs")
        .delete()
        .eq("user_id", trimmed)
        .eq("chain_id", chainId);
      if (err2) return NextResponse.json({ error: err2.message }, { status: 502 });
    }

    invalidateUserConfigCache(uid);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
