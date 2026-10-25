import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { claimMaturityReminder, releaseMaturityReminder } from "~~/services/notifications/maturityReminders";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const MATURITY = 1_793_372_400;
const CLAIM =
  'notification_maturity_reminders.upsert({"config_id":"cfg-1","kind":"7d","maturity":"2026-10-30T15:00:00.000Z"},' +
  '{"onConflict":"config_id,kind,maturity","ignoreDuplicates":true}).select("sent_at")';

beforeEach(() => fakeSupabase.reset());

describe("claimMaturityReminder", () => {
  it("returns the new row's sent_at when the reminder was free", async () => {
    fakeSupabase.respondByQuery({ [CLAIM]: { data: [{ sent_at: "2026-10-27T15:00:00.1+00:00" }] } });
    expect(await claimMaturityReminder("cfg-1", "7d", MATURITY)).toBe("2026-10-27T15:00:00.1+00:00");
    expect(fakeSupabase.log()).toEqual([CLAIM]);
  });

  // ignoreDuplicates writes nothing and returns no row when another run took it.
  it("returns null when another run already took it", async () => {
    fakeSupabase.respondByQuery({ [CLAIM]: { data: [] } });
    expect(await claimMaturityReminder("cfg-1", "7d", MATURITY)).toBeNull();
  });

  it("throws when the database fails, so nothing is sent unclaimed", async () => {
    fakeSupabase.respondByQuery({ [CLAIM]: { error: { message: "timeout" } } });
    await expect(claimMaturityReminder("cfg-1", "7d", MATURITY)).rejects.toThrow(
      "Failed to claim the maturity reminder: timeout",
    );
  });
});

describe("releaseMaturityReminder", () => {
  it("deletes only the row this claim wrote", async () => {
    expect(await releaseMaturityReminder("cfg-1", "1d", MATURITY, "s")).toBeNull();
    expect(fakeSupabase.log()).toEqual([
      'notification_maturity_reminders.delete().eq("config_id","cfg-1").eq("kind","1d").eq("maturity","2026-10-30T15:00:00.000Z").eq("sent_at","s")',
    ]);
  });

  it("returns the database error", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    expect(await releaseMaturityReminder("cfg-1", "1d", MATURITY, "s")).toEqual({ message: "boom" });
  });
});
