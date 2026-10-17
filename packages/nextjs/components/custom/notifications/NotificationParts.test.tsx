// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { NotificationEmptyState } from "~~/components/custom/notifications/NotificationEmptyState";
import { NotificationErrorSummary } from "~~/components/custom/notifications/NotificationErrorSummary";
import { NotificationFormActions } from "~~/components/custom/notifications/NotificationFormActions";
import { NotificationLoadError } from "~~/components/custom/notifications/NotificationLoadError";
import { NotificationSummary } from "~~/components/custom/notifications/NotificationSummary";
import { TelegramUsernameField } from "~~/components/custom/notifications/TelegramUsernameField";
import { ThresholdField } from "~~/components/custom/notifications/ThresholdField";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { jsonResponse } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

/*
 * The markup of the settings card's parts in the design system: flat card, token colours, lucide icons, one pink
 * primary. Behaviour is covered in NotificationConfig.test.tsx; these pin the structure a restyle would change.
 */

const noop = () => undefined;

const ID_ATTRIBUTES = ["id", "for", "href", "aria-describedby", "aria-labelledby"];

/**
 * React's useId values count every id made before them in the process, so a snapshot holding them would only match
 * when the whole file runs in this order. They are numbered per snapshot instead, in order of first use, which keeps
 * the wiring (the same id twice is the same token) without the global count.
 */
const withStableIds = (root: ChildNode | null) => {
  const tokens = new Map<string, string>();
  const stable = (value: string) =>
    value.replace(/_r_[0-9a-z]+_/g, id => {
      if (!tokens.has(id)) tokens.set(id, `id${tokens.size + 1}`);
      return tokens.get(id) as string;
    });
  if (root instanceof Element) {
    for (const element of [root, ...root.querySelectorAll("*")]) {
      for (const name of ID_ATTRIBUTES) {
        const value = element.getAttribute(name);
        if (value !== null) element.setAttribute(name, stable(value));
      }
    }
  }
  return root;
};

const BOT = "tokenping_bot";
/** The Telegram usernames that have pressed Start in the bot, as the status API answers. */
const LINKED_USERNAMES = ["alice_eth"];

/**
 * Renders with a query client and waits until the status API has answered for `username`, so the Telegram status
 * shown is the settled one rather than "Checking".
 */
const renderAnswered = async (ui: ReactNode, username: string) => {
  const view = renderWithProviders(ui);
  await waitFor(() =>
    expect(view.queryClient.getQueryState(["telegramUsernameStatus", username])?.status).toBe("success"),
  );
  return view;
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", BOT);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      jsonResponse({
        linked: LINKED_USERNAMES.includes(new URL(url, "http://test").searchParams.get("username") ?? ""),
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** The summary's Send test buttons: Email cooling down for 12 minutes, Signal's test on its way. */
const TEST_SENDS = {
  waitFor: (channel: string) => (channel === "email" ? 12 * 60_000 : 0),
  sendingChannel: "signal" as const,
  onSend: noop,
};

const ACTIONS = {
  chainName: "Arbitrum",
  canDelete: true,
  isSaving: false,
  isDeleting: false,
  isConfirmingDelete: false,
  onCancel: noop,
  onRequestDelete: noop,
  onKeep: noop,
  onConfirmDelete: noop,
};

describe("notification settings markup", () => {
  it("renders the first-use empty state with the one pink action", () => {
    const { container } = render(<NotificationEmptyState chainName="Arbitrum" onCreate={noop} />);
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the saved summary in the card, with the Active badge and the below-threshold warning", async () => {
    const { container } = await renderAnswered(
      <NotificationCard isActive>
        <NotificationSummary
          services={["email", "signal", "telegram"]}
          email="me@example.com"
          signalRecipient="alice.42"
          telegramUsername="alice_eth"
          threshold={1.8}
          currentHealthFactor="1.20"
          showBelowThresholdWarning
        />
      </NotificationCard>,
      "alice_eth",
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the summary's warning, with the link to the bot, while the saved Telegram username has not pressed Start", async () => {
    const { container } = await renderAnswered(
      <NotificationSummary
        services={["telegram"]}
        email=""
        signalRecipient=""
        telegramUsername="carol"
        threshold={1.5}
        currentHealthFactor="2.00"
        showBelowThresholdWarning={false}
      />,
      "carol",
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the summary's Send test buttons: one cooling down, one sending, Telegram's off while not linked, and the limit note", async () => {
    const { container } = await renderAnswered(
      <NotificationSummary
        services={["email", "signal", "telegram"]}
        email="me@example.com"
        signalRecipient="alice.42"
        telegramUsername="carol"
        threshold={1.5}
        currentHealthFactor="2.00"
        showBelowThresholdWarning={false}
        testSends={TEST_SENDS}
      />,
      "carol",
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the load error with Try again", () => {
    const { container } = render(<NotificationLoadError isRetrying={false} onRetry={noop} />);
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the Telegram username field with an error and no status", () => {
    const { container } = renderWithProviders(
      <TelegramUsernameField
        id="form-telegram"
        value="rom"
        error="Enter a Telegram username like alice_eth: 4 to 32 letters, digits or underscores, starting with a letter and not ending with _."
        onChange={noop}
      />,
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the Telegram username field not linked yet, with the link to the bot", async () => {
    const { container } = await renderAnswered(
      <TelegramUsernameField id="form-telegram" value="carol" onChange={noop} />,
      "carol",
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the linked Telegram username field", async () => {
    const { container } = await renderAnswered(
      <TelegramUsernameField id="form-telegram" value="alice_eth" onChange={noop} />,
      "alice_eth",
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the threshold field: slider without fill, exact value input named by the visible label", () => {
    const { container } = render(
      <ThresholdField
        threshold={1.8}
        thresholdText="1.80"
        chainName="Arbitrum"
        onThresholdChange={noop}
        onThresholdTextChange={noop}
      />,
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the error summary with a link to each field", () => {
    const { container } = render(
      <NotificationErrorSummary
        items={[
          { field: "email", message: "Enter your email address.", targetId: "form-email" },
          { field: "telegram", message: "Enter your Telegram username.", targetId: "form-telegram" },
        ]}
        onSelect={noop}
      />,
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the form actions and the delete confirmation", () => {
    const actions = render(<NotificationFormActions {...ACTIONS} />);
    expect(withStableIds(actions.container.firstChild)).toMatchSnapshot();
    actions.unmount();
    const confirm = render(<NotificationFormActions {...ACTIONS} isConfirmingDelete />);
    expect(withStableIds(confirm.container.firstChild)).toMatchSnapshot();
  });
});

describe("notification settings parts in Czech", () => {
  const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  const renderCs = (ui: ReactNode) => render(<LocaleProvider locale="cs">{ui}</LocaleProvider>);
  const text = (container: HTMLElement) => {
    const content = container.textContent ?? "";
    expect(content).not.toMatch(DASHES);
    return content;
  };

  it("writes the empty state, the summary and the load error in Czech, numbers with a decimal comma", async () => {
    const empty = renderCs(<NotificationEmptyState chainName="Arbitrum" onCreate={noop} />);
    expect(text(empty.container)).toBe(
      "Na síti Arbitrum zatím nemáte žádné upozorněníDostanete zprávu, když váš health factor klesne pod práh, který si zvolíte.Vytvořit upozornění",
    );
    empty.unmount();

    const summary = await renderAnswered(
      <LocaleProvider locale="cs">
        <NotificationCard isActive>
          <NotificationSummary
            services={["email", "signal", "telegram"]}
            email="me@example.com"
            signalRecipient="alice.42"
            telegramUsername="carol"
            threshold={1.8}
            currentHealthFactor="1.20"
            showBelowThresholdWarning
          />
        </NotificationCard>
      </LocaleProvider>,
      "carol",
    );
    expect(text(summary.container)).toBe(
      "Nastavení upozorněníAktivní" +
        "KanályE-mailSignalTelegramE-mailme@example.comSignal@alice.42Telegram@carolPráh1,8" +
        `Zatím nepropojeno: jednou stiskněte Start v @${BOT}.Otevřít @${BOT} (otevře se v nové kartě)` +
        "Pod prahem vašeho upozorněníVáš aktuální health factor (1,20) je pod vaším prahem 1,8.",
    );
    summary.unmount();

    const failed = renderCs(<NotificationLoadError isRetrying={false} onRetry={noop} />);
    expect(text(failed.container)).toContain("Nastavení upozornění se nenačetlo");
    expect(screen.getByRole("button", { name: "Zkusit znovu" })).toBeDefined();
  });

  it("writes the summary's Send test buttons and the limit note in Czech", async () => {
    const summary = await renderAnswered(
      <LocaleProvider locale="cs">
        <NotificationSummary
          services={["email", "signal", "telegram"]}
          email="me@example.com"
          signalRecipient="alice.42"
          telegramUsername="alice_eth"
          threshold={1.5}
          currentHealthFactor="2.00"
          showBelowThresholdWarning={false}
          testSends={{ ...TEST_SENDS, sendingChannel: undefined }}
        />
      </LocaleProvider>,
      "alice_eth",
    );
    expect(text(summary.container)).toBe(
      "KanályE-mailSignalTelegram" +
        "E-mailme@example.comZnovu za 12 min (E-mail)" +
        "Signal@alice.42Poslat test (Signal)" +
        "Telegram@alice_ethPoslat test (Telegram)" +
        "Práh1,5" +
        "Test pošle toto upozornění a vaši pozici tak, jak jsou teď. Jeden na kanál za 15 minut.",
    );
  });

  it("writes the Telegram username field in Czech", async () => {
    const linked = await renderAnswered(
      <LocaleProvider locale="cs">
        <TelegramUsernameField value="alice_eth" onChange={noop} />
      </LocaleProvider>,
      "alice_eth",
    );
    expect(text(linked.container)).toBe(
      "Uživatelské jméno na Telegramu" +
        "Upozornění půjdou na tento účet na Telegramu. Uživatelské jméno najdete v Telegramu v Nastavení, v části Uživatelské jméno." +
        "Propojeno: @alice_eth. Upozornění budou chodit do vašeho chatu na Telegramu.",
    );
  });

  it("shows the threshold with a decimal comma in Czech", () => {
    const { container } = renderCs(
      <ThresholdField
        threshold={1.8}
        thresholdText="1.80"
        chainName="Arbitrum"
        onThresholdChange={noop}
        onThresholdTextChange={noop}
      />,
    );
    expect(text(container)).toBe(
      "Prahová hodnota health factoru(přesná hodnota)1,1Kritický2,0Bezpečný3,0Velmi bezpečný" +
        "Upozorníme vás, když váš health factor na síti Arbitrum klesne pod 1,8.",
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Prahová hodnota health factoru (přesná hodnota)",
    });
    expect(input.value).toBe("1,80");
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("1,8");
  });

  it("counts the fields to fix with Czech plurals", () => {
    const item = { field: "email", message: "Zadejte svou e-mailovou adresu.", targetId: "form-email" } as const;
    const titles = [1, 2, 5].map(count => {
      const view = renderCs(<NotificationErrorSummary items={Array(count).fill(item)} onSelect={noop} />);
      const title = text(view.container).replace(/Zadejte.*$/, "");
      view.unmount();
      return title;
    });
    expect(titles).toEqual([
      "Před uložením opravte 1 pole",
      "Před uložením opravte 2 pole",
      "Před uložením opravte 5 polí",
    ]);
  });

  it("writes the form actions and the delete confirmation in Czech", () => {
    const actions = renderCs(<NotificationFormActions {...ACTIONS} />);
    expect(text(actions.container)).toBe("Smazat upozorněníZrušitUložit upozornění");
    actions.unmount();
    const confirm = renderCs(<NotificationFormActions {...ACTIONS} isConfirmingDelete />);
    expect(text(confirm.container)).toBe(
      "Smazat toto upozornění?Tokenping přestane posílat upozornění na health factor pro síť Arbitrum." +
        "Ponechat upozorněníSmazat upozornění",
    );
  });
});
