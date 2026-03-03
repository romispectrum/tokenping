import { NextResponse } from "next/server";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const chainIdParam = searchParams.get("chainId");

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (chainIdParam != null && chainIdParam !== "") {
      const chainId = parseInt(chainIdParam, 10);
      if (Number.isNaN(chainId)) {
        return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("notification_configs")
        .select("*")
        .eq("user_id", userId.trim())
        .eq("chain_id", chainId)
        .single();

      if (error || !data) {
        return NextResponse.json(null);
      }

      return NextResponse.json({
        chainId: data.chain_id,
        enabled: data.enabled,
        services: data.services ?? [],
        healthFactorThreshold: parseFloat(String(data.health_factor_threshold)),
        email: data.email ?? undefined,
      });
    }

    const { data, error } = await supabase.from("notification_configs").select("*").eq("user_id", userId.trim());

    if (error || !data) {
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
        };
        return acc;
      },
      {} as Record<
        number,
        { chainId: number; enabled: boolean; services: string[]; healthFactorThreshold: number; email?: string }
      >,
    );

    return NextResponse.json(configs);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, chainId, enabled, services, healthFactorThreshold, email } = body as {
      userId?: string;
      chainId?: number;
      enabled?: boolean;
      services?: string[];
      healthFactorThreshold?: number;
      email?: string | null;
    };

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }
    if (chainId == null || typeof chainId !== "number" || Number.isNaN(chainId)) {
      return NextResponse.json({ error: "Missing or invalid chainId" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const row = {
      user_id: userId.trim(),
      chain_id: chainId,
      enabled: enabled ?? true,
      services: Array.isArray(services) ? services : [],
      health_factor_threshold: healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD,
      email: email === undefined || email === null ? null : String(email).trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("notification_configs").upsert(row, {
      onConflict: "user_id,chain_id",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

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

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("notification_configs")
      .delete()
      .eq("user_id", userId.trim())
      .eq("chain_id", chainId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
