// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TestSendButton } from "~~/components/custom/notifications/TestSendButton";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import type { Locale } from "~~/i18n/locales";

type Props = Parameters<typeof TestSendButton>[0];

const MINUTE = 60_000;

const renderButton = (props: Partial<Props> = {}, locale: Locale = "en") => {
  const onSend = props.onSend ?? vi.fn();
  const view = render(
    <LocaleProvider locale={locale}>
      <TestSendButton channelName="Email" waitMs={0} isSending={false} isBusy={false} {...props} onSend={onSend} />
    </LocaleProvider>,
  );
  return { ...view, onSend };
};

const theButton = () => screen.getByRole<HTMLButtonElement>("button");

describe("TestSendButton", () => {
  it("reads Send test, names its channel for assistive technology and sends on click", () => {
    const { onSend } = renderButton();
    // The space before "(Email)" sits outside the hidden text, so the name keeps it.
    expect(screen.getByRole("button", { name: "Send test (Email)" })).toBe(theButton());
    expect(theButton().querySelector(".sr-only")?.textContent).toBe("(Email)");
    expect(theButton().getAttribute("type")).toBe("button");
    expect(theButton().disabled).toBe(false);
    expect(theButton().getAttribute("aria-busy")).toBeNull();
    fireEvent.click(theButton());
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("is a small outline button with a hidden Send icon, never the view's pink", () => {
    renderButton({ channelName: "Signal" });
    expect(theButton().className).toBe(buttonClasses({ variant: "outline", size: "sm", className: "shrink-0" }));
    expect(theButton().className.split(/\s+/)).not.toContain("btn-primary");
    const icons = [...theButton().querySelectorAll("svg")];
    expect(icons.map(icon => [icon.getAttribute("class"), icon.getAttribute("aria-hidden")])).toEqual([
      ["lucide lucide-send", "true"],
    ]);
  });

  it.each([
    [1, "1"],
    [MINUTE, "1"],
    [MINUTE + 1, "2"],
    [12 * MINUTE, "12"],
    [15 * MINUTE, "15"],
  ])("reads Again in N min, rounded up, and is off while %d ms remain", (waitMs, minutes) => {
    const { onSend } = renderButton({ waitMs, channelName: "Telegram" });
    expect(screen.getByRole("button", { name: `Again in ${minutes} min (Telegram)` })).toBe(theButton());
    expect(theButton().disabled).toBe(true);
    fireEvent.click(theButton());
    expect(onSend).not.toHaveBeenCalled();
  });

  it("is off while another channel's test is on its way, and while its channel cannot be reached", () => {
    const busy = renderButton({ isBusy: true });
    expect(theButton().textContent).toBe("Send test (Email)");
    expect(theButton().disabled).toBe(true);
    fireEvent.click(theButton());
    expect(busy.onSend).not.toHaveBeenCalled();
    busy.unmount();

    const unavailable = renderButton({ channelName: "Telegram", isUnavailable: true });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Send test (Telegram)" }).disabled).toBe(true);
    fireEvent.click(theButton());
    expect(unavailable.onSend).not.toHaveBeenCalled();
  });

  it("shows Sending with a spinner while its own test is on its way, stays focusable and ignores presses", () => {
    const { onSend } = renderButton({ isSending: true });
    expect(screen.getByRole("button", { name: "Sending" })).toBe(theButton());
    expect(theButton().getAttribute("aria-busy")).toBe("true");
    expect(theButton().getAttribute("aria-disabled")).toBe("true");
    // Loading, not disabled: it keeps focus.
    expect(theButton().disabled).toBe(false);
    expect(theButton().querySelector(".animate-spin")?.getAttribute("aria-hidden")).toBe("true");
    // The label stays laid out under the loading label, so the width does not jump.
    expect(theButton().querySelector("[aria-hidden='true'].invisible")?.textContent).toBe("Send test (Email)");
    fireEvent.click(theButton());
    expect(onSend).not.toHaveBeenCalled();
  });

  it("writes every state in Czech", () => {
    const ready = renderButton({ channelName: "E-mail" }, "cs");
    expect(screen.getByRole("button", { name: "Poslat test (E-mail)" })).toBe(theButton());
    ready.unmount();

    const waiting = renderButton({ channelName: "Signal", waitMs: 4 * MINUTE + 30_000 }, "cs");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Znovu za 5 min (Signal)" }).disabled).toBe(true);
    waiting.unmount();

    renderButton({ channelName: "Telegram", isSending: true }, "cs");
    expect(screen.getByRole("button", { name: "Odesíláme" })).toBe(theButton());
  });
});
