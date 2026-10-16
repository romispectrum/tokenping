// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceSelector } from "~~/components/custom/notifications/ServiceSelector";
import { LocaleProvider } from "~~/i18n/LocaleProvider";

type Props = Parameters<typeof ServiceSelector>[0];

const renderSelector = ({ services = [], onToggle = () => undefined, error }: Partial<Props> = {}) =>
  render(<ServiceSelector services={services} onToggle={onToggle} error={error} />);

const checkboxNames = () =>
  screen.getAllByRole<HTMLInputElement>("checkbox").map(checkbox => checkbox.labels?.[0]?.textContent);

describe("ServiceSelector", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("hides Telegram while the bot is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    renderSelector();
    expect(checkboxNames()).toEqual(["Email", "Signal"]);
  });

  it("offers Telegram once the bot is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "TokenpingBot");
    renderSelector();
    expect(checkboxNames()).toEqual(["Email", "Signal", "Telegram"]);
  });

  it("keeps an already selected Telegram visible so it can be turned off", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    renderSelector({ services: ["telegram"] });
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Telegram" }).checked).toBe(true);
  });

  it("is a group of checkboxes named by its legend, and the whole tile toggles its service", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "TokenpingBot");
    const onToggle = vi.fn();
    renderSelector({ services: ["signal"], onToggle });
    const group = screen.getByRole("group", { name: "Notification services" });
    const description = document.getElementById(group.getAttribute("aria-describedby") ?? "");
    expect(description?.textContent).toBe("Choose where alerts go. You can pick more than one.");
    expect(screen.getAllByRole<HTMLInputElement>("checkbox").map(checkbox => checkbox.checked)).toEqual([
      false,
      true,
      false,
    ]);

    fireEvent.click(screen.getByText("Email"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Signal" }));
    expect(onToggle.mock.calls).toEqual([["email"], ["signal"]]);
  });

  it("shows an error under the group, describes the group with it and marks every checkbox invalid", () => {
    renderSelector({ error: "Select at least one notification service." });
    const group = screen.getByRole("group", { name: "Notification services" });
    const ids = (group.getAttribute("aria-describedby") ?? "").split(" ");
    expect(ids.map(id => document.getElementById(id)?.textContent)).toEqual([
      "Choose where alerts go. You can pick more than one.",
      "Select at least one notification service.",
    ]);
    expect(screen.getByRole("alert").textContent).toBe("Select at least one notification service.");
    expect(screen.getAllByRole("checkbox").every(checkbox => checkbox.getAttribute("aria-invalid") === "true")).toBe(
      true,
    );
  });

  it("selects with the violet accent, never pink, and draws icons instead of emoji", () => {
    const { container } = renderSelector({ services: ["email"] });
    const tiles = [...container.querySelectorAll("label")];
    expect(tiles.every(tile => tile.className.includes("has-checked:border-link"))).toBe(true);
    expect(container.innerHTML).not.toMatch(/primary|pink/);
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    expect([...container.querySelectorAll("svg")].every(icon => icon.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
  });

  it("names the channels and the group in Czech", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "TokenpingBot");
    render(
      <LocaleProvider locale="cs">
        <ServiceSelector services={[]} onToggle={() => undefined} error="Vyberte alespoň jeden kanál upozornění." />
      </LocaleProvider>,
    );
    expect(checkboxNames()).toEqual(["E-mail", "Signal", "Telegram"]);
    const group = screen.getByRole("group", { name: "Kanály upozornění" });
    expect(group.textContent).toContain("Vyberte, kam upozornění posílat. Můžete zvolit i více kanálů.");
  });
});
