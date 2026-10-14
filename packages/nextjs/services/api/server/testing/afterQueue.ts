type AfterTask = Promise<unknown> | (() => unknown);

/**
 * Test double for `after` from next/server, which throws outside a request scope. Tasks are queued and run only on
 * `flush()`, so a test can tell work deferred until after the response from work done before it.
 */
export const createAfterQueue = () => {
  const tasks: AfterTask[] = [];
  return {
    after: (task: AfterTask) => {
      tasks.push(task);
    },
    pending: () => tasks.length,
    flush: async () => {
      const queued = tasks.splice(0);
      await Promise.all(queued.map(task => (typeof task === "function" ? task() : task)));
    },
    reset: () => {
      tasks.length = 0;
    },
  };
};

/** Shared instance for `vi.mock("next/server", ...)` factories, which cannot close over test locals. */
export const afterQueue = createAfterQueue();
