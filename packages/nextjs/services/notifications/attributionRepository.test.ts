import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import * as repository from "~~/services/notifications/attributionRepository";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const MIXED = `0x${"AB".repeat(20)}`;
const LOWER = MIXED.toLowerCase();

beforeEach(() => {
  fakeSupabase.reset();
});

describe("saveAttributionAnswer", () => {
  it("inserts one row for the lowercased wallet, ignoring the insert when the wallet already has an answer", async () => {
    expect(await repository.saveAttributionAnswer(`  ${MIXED} `, "A friend")).toBeNull();
    expect(fakeSupabase.log()).toEqual([
      `user_attribution.upsert({"user_id":"${LOWER}","answer":"A friend"},{"onConflict":"user_id","ignoreDuplicates":true})`,
    ]);
  });

  it("returns the Supabase error", async () => {
    fakeSupabase.respond(() => ({ error: { message: "permission denied for table user_attribution" } }));
    expect(await repository.saveAttributionAnswer(LOWER, "X")).toEqual({
      message: "permission denied for table user_attribution",
    });
  });

  it("offers no way to read answers back", () => {
    expect(Object.keys(repository)).toEqual(["saveAttributionAnswer"]);
  });
});
