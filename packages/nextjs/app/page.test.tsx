import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "~~/app/page";
import { renderMarkup } from "~~/utils/testing/render";

const account = vi.hoisted(() => ({ isConnected: false }));

vi.mock("wagmi", () => ({ useAccount: () => account }));

const renderHome = () => renderMarkup(<Home />);

const CONNECT_HINT = "Connect your wallet (top right) to see your positions on the Aave page.";

describe("Home page", () => {
  beforeEach(() => {
    account.isConnected = false;
  });

  it("renders the landing page with the connect hint while disconnected", () => {
    const html = renderHome();

    expect(html).toContain(CONNECT_HINT);
    expect(html).toMatchSnapshot();
  });

  it("renders the landing page without the connect hint once connected", () => {
    account.isConnected = true;
    const html = renderHome();

    expect(html).not.toContain(CONNECT_HINT);
    expect(html).toMatchSnapshot();
  });

  it("links the call to action to the Aave dashboard, named by its visible text", () => {
    const [, attributes] = renderHome().match(/<a ([^>]*)>Open Aave dashboard</) ?? [];

    expect(attributes).toContain('href="/aave"');
    expect(attributes).not.toContain("aria-label");
  });

  it("states the cron check interval in the steps copy as a single text node", () => {
    expect(renderHome()).toContain(">2. We check every 5 minutes</p>");
  });
});
