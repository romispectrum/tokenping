import { afterAll, afterEach, beforeAll } from "vitest";

// Testing Library only auto-registers its cleanup and React act environment when `afterEach` / `beforeAll` are
// globals, and vitest runs without globals, so this mirrors that auto-setup. Without the act flag React silences
// "not wrapped in act(...)" warnings and rejects `act` imported from "react".
// Only jsdom files load it, so node-environment tests never pull in react-dom.
if (typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);

  const actGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  let previousIsReactActEnvironment: boolean | undefined;
  beforeAll(() => {
    previousIsReactActEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT;
    actGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterAll(() => {
    actGlobal.IS_REACT_ACT_ENVIRONMENT = previousIsReactActEnvironment;
  });
}
