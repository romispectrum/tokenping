import { afterEach, describe, expect, it, vi } from "vitest";
import { TIMED_OUT, readWithinBudget } from "~~/services/notifications/readWithinBudget";

const PASS_MS = 5 * 60_000;

afterEach(() => {
  vi.useRealTimers();
});

describe("readWithinBudget", () => {
  it("answers in the order of the items, whatever order they were read in", async () => {
    vi.useFakeTimers({ now: PASS_MS * 7, toFake: ["Date"] });
    const items = [1, 2, 3, 4, 5, 6];
    expect(
      await readWithinBudget(
        items,
        () => 1,
        async item => item * 10,
        Date.now() + 1000,
      ),
    ).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it("gives a failed read null", async () => {
    const read = async (item: number) => {
      if (item === 2) throw new Error("rpc");
      return item;
    };
    expect(await readWithinBudget([1, 2], () => 1, read, Date.now() + 1000)).toEqual([1, null]);
  });

  it("keeps a hanging chain from holding up the others", async () => {
    vi.useFakeTimers({ now: 0 });
    const read = (chain: number) => (chain === 1 ? new Promise<number>(() => undefined) : Promise.resolve(chain));

    const run = readWithinBudget([1, 2, 3], chain => chain, read, 1000);
    await vi.advanceTimersByTimeAsync(1000);

    expect(await run).toEqual([TIMED_OUT, 2, 3]);
  });

  it("starts each pass somewhere else, so a slow chain does not always skip the same items", async () => {
    const firstStarted = async (now: number) => {
      vi.useFakeTimers({ now, toFake: ["Date"] });
      const started: number[] = [];
      await readWithinBudget(
        [1, 2, 3, 4, 5, 6],
        () => 1,
        async item => started.push(item),
        now + 1000,
      );
      vi.useRealTimers();
      return started[0];
    };

    expect(await firstStarted(0)).toBe(1);
    expect(await firstStarted(PASS_MS)).toBe(2);
    expect(await firstStarted(PASS_MS * 7)).toBe(2);
  });
});
