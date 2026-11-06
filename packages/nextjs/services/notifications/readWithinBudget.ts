/** How many reads run at once on one chain. */
const READ_CONCURRENCY = 4;

/** A cron pass every 5 minutes: the start of each chain's queue moves on by one per pass. */
const ROTATION_MS = 5 * 60_000;

/** An item not read before the deadline: the next run reads it. */
export const TIMED_OUT = "timeout";

const beforeDeadline = <T>(promise: Promise<T>, deadline: number) =>
  new Promise<T | typeof TIMED_OUT | null>(resolve => {
    const timer = setTimeout(() => resolve(TIMED_OUT), Math.max(0, deadline - Date.now()));
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });

/**
 * Reads every item until `deadline` (epoch ms): chains in parallel, READ_CONCURRENCY at a time on each, so a chain whose
 * RPCs hang costs only its own items. The results keep the order of `items`: a reading, null when the read failed, or
 * TIMED_OUT. Each chain's queue starts somewhere else on every pass, so a chain too slow to finish does not leave the
 * same items unread run after run.
 */
export async function readWithinBudget<Item, Reading>(
  items: readonly Item[],
  chainOf: (item: Item) => number,
  read: (item: Item) => Promise<Reading>,
  deadline: number,
) {
  const results: (Reading | null | typeof TIMED_OUT)[] = items.map(() => TIMED_OUT);
  const byChain = new Map<number, number[]>();
  items.forEach((item, index) => byChain.set(chainOf(item), [...(byChain.get(chainOf(item)) ?? []), index]));
  const pass = Math.floor(Date.now() / ROTATION_MS);

  await Promise.all(
    [...byChain.values()].map(indexes => {
      const start = pass % indexes.length;
      const queue = [...indexes.slice(start), ...indexes.slice(0, start)];
      let next = 0;
      const worker = async () => {
        while (next < queue.length) {
          const index = queue[next++];
          if (Date.now() >= deadline) continue;
          results[index] = await beforeDeadline(read(items[index]), deadline);
        }
      };
      return Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, queue.length) }, worker));
    }),
  );
  return results;
}
