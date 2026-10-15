// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceSelector } from "~~/components/custom/notifications/ServiceSelector";

const renderSelector = (services: Parameters<typeof ServiceSelector>[0]["services"] = []) =>
  render(<ServiceSelector services={services} onToggle={() => undefined} />);

const buttonNames = () => screen.getAllByRole("button").map(button => button.textContent?.trim());

describe("ServiceSelector", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("hides Telegram while the bot is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    renderSelector();
    expect(buttonNames()).toEqual(["📧Email", "🔒Signal"]);
  });

  it("offers Telegram once the bot is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "TokenpingBot");
    renderSelector();
    expect(buttonNames()).toEqual(["📧Email", "🔒Signal", "✈️Telegram"]);
  });

  it("keeps an already selected Telegram visible so it can be turned off", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    renderSelector(["telegram"]);
    expect(screen.getByRole("button", { name: /Telegram/ })).toHaveProperty("ariaPressed", "true");
  });
});
