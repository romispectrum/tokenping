import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_SEND_COOLDOWN_MINUTES } from "~~/constants/notifications";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { claimTestSend, getTestSendRetryTimes, releaseTestSend } from "~~/services/notifications/testSends";

// The fake query builder plus the one rpc these helpers call: claim_notification_test_send(...).single().
const rpc = vi.hoisted(() => ({
  calls: [] as { fn: string; args: unknown; terminal?: string }[],
  result: { data: null as unknown, error: null as { message: string } | null },
}));

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  const client = {
    from: (table: string) => fakeSupabase.client.from(table),
    rpc: (fn: string, args: unknown) => {
      const call: (typeof rpc.calls)[number] = { fn, args };
      rpc.calls.push(call);
      return {
        single: () => {
          call.terminal = "single";
          return Promise.resolve(rpc.result);
        },
      };
    },
  };
  return { getSupabaseServerClient: () => client };
});

const NOW = "2026-10-14T09:05:07.000Z";
const MIXED = `0x${"AB".repeat(20)}`;
const LOWER = `0x${"ab".repeat(20)}`;

/** An ISO time `minutes` from NOW. */
const at = (minutes: number) => new Date(Date.parse(NOW) + minutes * 60_000).toISOString();

const readQuery = (uid: string) => `notification_test_sends.select("channel, sent_at").eq("user_id","${uid}")`;
const releaseQuery = (uid: string, channel: string, sentAt: string) =>
  `notification_test_sends.delete().eq("user_id","${uid}").eq("channel","${channel}").eq("sent_at","${sentAt}")`;

beforeEach(() => {
  fakeSupabase.reset();
  rpc.calls = [];
  rpc.result = { data: null, error: null };
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("claimTestSend", () => {
  it("claims in one rpc with the trimmed, lowercased wallet, the channel and the cooldown in seconds", async () => {
    rpc.result = { data: { claimed: true, sent_at: NOW, retry_at: at(15) }, error: null };

    await expect(claimTestSend(`  ${MIXED} `, "telegram")).resolves.toEqual({
      claimed: true,
      sentAt: NOW,
      retryAt: at(15),
    });
    expect(TEST_SEND_COOLDOWN_MINUTES).toBe(15);
    expect(rpc.calls).toEqual([
      {
        fn: "claim_notification_test_send",
        args: { p_user_id: LOWER, p_channel: "telegram", p_cooldown_seconds: 900 },
        terminal: "single",
      },
    ]);
    // Nothing else is read or written: the database function does it all.
    expect(fakeSupabase.queries).toEqual([]);
  });

  it("reports a refused claim with the blocking send's times, as the database returned them", async () => {
    rpc.result = {
      data: { claimed: false, sent_at: "2026-10-14 09:00:00+00", retry_at: "2026-10-14 09:15:00+00" },
      error: null,
    };

    await expect(claimTestSend(LOWER, "email")).resolves.toEqual({
      claimed: false,
      sentAt: "2026-10-14 09:00:00+00",
      retryAt: "2026-10-14 09:15:00+00",
    });
  });

  it("throws with the Supabase message when the rpc fails", async () => {
    rpc.result = { data: null, error: { message: "function claim_notification_test_send does not exist" } };

    await expect(claimTestSend(LOWER, "signal")).rejects.toThrow(
      new Error("Failed to check the test message limit: function claim_notification_test_send does not exist"),
    );
  });

  it("throws when the rpc returns no row", async () => {
    await expect(claimTestSend(LOWER, "signal")).rejects.toThrow(
      new Error("Failed to check the test message limit: no result"),
    );
  });
});

describe("releaseTestSend", () => {
  it("deletes only the row this claim wrote, matched by its sent_at, under the lowercased wallet", async () => {
    await expect(releaseTestSend(` ${MIXED}`, "email", NOW)).resolves.toBeNull();
    expect(fakeSupabase.log()).toEqual([releaseQuery(LOWER, "email", NOW)]);
  });

  it("returns the Supabase error instead of throwing", async () => {
    fakeSupabase.respondByQuery({ [releaseQuery(LOWER, "telegram", NOW)]: { error: { message: "timeout" } } });
    await expect(releaseTestSend(LOWER, "telegram", NOW)).resolves.toEqual({ message: "timeout" });
  });
});

describe("getTestSendRetryTimes", () => {
  it("is null for every channel when the wallet never sent a test", async () => {
    await expect(getTestSendRetryTimes(MIXED)).resolves.toEqual({ email: null, signal: null, telegram: null });
    expect(fakeSupabase.log()).toEqual([readQuery(LOWER)]);
  });

  it("gives each channel still cooling down its ISO retry time, 15 minutes after its send", async () => {
    fakeSupabase.respondByQuery({
      [readQuery(LOWER)]: {
        data: [
          // Postgres' own timestamp format, as PostgREST may return it.
          { channel: "email", sent_at: "2026-10-14T09:00:00+00:00" },
          { channel: "telegram", sent_at: "2026-10-14T09:05:07.000Z" },
        ],
      },
    });

    await expect(getTestSendRetryTimes(LOWER)).resolves.toEqual({
      email: "2026-10-14T09:15:00.000Z",
      signal: null,
      telegram: "2026-10-14T09:20:07.000Z",
    });
  });

  it("is null for a channel whose cooldown has ended, also at the exact retry time", async () => {
    fakeSupabase.respondByQuery({
      [readQuery(LOWER)]: {
        data: [
          { channel: "email", sent_at: at(-15) },
          { channel: "signal", sent_at: at(-60) },
          { channel: "telegram", sent_at: at(-14.99) },
        ],
      },
    });

    await expect(getTestSendRetryTimes(LOWER)).resolves.toEqual({
      email: null,
      signal: null,
      telegram: new Date(Date.parse(at(-14.99)) + 15 * 60_000).toISOString(),
    });
  });

  it("measures against the given time instead of the clock", async () => {
    fakeSupabase.respondByQuery({ [readQuery(LOWER)]: { data: [{ channel: "signal", sent_at: NOW }] } });

    await expect(getTestSendRetryTimes(LOWER, new Date(at(14)))).resolves.toMatchObject({ signal: at(15) });
    await expect(getTestSendRetryTimes(LOWER, new Date(at(15)))).resolves.toMatchObject({ signal: null });
  });

  it("ignores a row for a channel it does not know, and an unparseable time", async () => {
    fakeSupabase.respondByQuery({
      [readQuery(LOWER)]: {
        data: [
          { channel: "sms", sent_at: NOW },
          { channel: "email", sent_at: "not a time" },
        ],
      },
    });

    const times = await getTestSendRetryTimes(LOWER);
    expect(times).toEqual({ email: null, signal: null, telegram: null });
    expect(Object.keys(times)).toEqual(["email", "signal", "telegram"]);
  });

  it("throws with the Supabase message when the read fails", async () => {
    fakeSupabase.respondByQuery({ [readQuery(LOWER)]: { error: { message: "relation does not exist" } } });
    await expect(getTestSendRetryTimes(LOWER)).rejects.toThrow(
      new Error("Failed to read the test message limit: relation does not exist"),
    );
  });
});
