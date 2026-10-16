// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { NotificationEmptyState } from "~~/components/custom/notifications/NotificationEmptyState";
import { NotificationErrorSummary } from "~~/components/custom/notifications/NotificationErrorSummary";
import { NotificationFormActions } from "~~/components/custom/notifications/NotificationFormActions";
import { NotificationLoadError } from "~~/components/custom/notifications/NotificationLoadError";
import { NotificationSummary } from "~~/components/custom/notifications/NotificationSummary";
import { TelegramConnectField } from "~~/components/custom/notifications/TelegramConnectField";
import { ThresholdField } from "~~/components/custom/notifications/ThresholdField";
import { LocaleProvider } from "~~/i18n/LocaleProvider";

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

const TELEGRAM = {
  chatId: undefined,
  username: undefined,
  deepLink: undefined,
  isStatusUnknown: false,
  isCheckingStatus: false,
  isConnecting: false,
  isDisconnecting: false,
  onRetryStatus: noop,
  onConnect: noop,
  onDisconnect: noop,
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

  it("renders the saved summary in the card, with the Active badge and the below-threshold warning", () => {
    const { container } = render(
      <NotificationCard isActive>
        <NotificationSummary
          services={["email", "signal", "telegram"]}
          email="me@example.com"
          signalRecipient="alice.42"
          telegramChatId="555"
          telegramUsername="bob"
          threshold={1.8}
          currentHealthFactor="1.20"
          showBelowThresholdWarning
        />
      </NotificationCard>,
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the load error with Try again", () => {
    const { container } = render(<NotificationLoadError isRetrying={false} onRetry={noop} />);
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the Telegram field while waiting for the bot, and with an error", () => {
    const { container } = render(
      <TelegramConnectField
        {...TELEGRAM}
        isConnecting
        deepLink="https://t.me/bot?start=tok"
        error="Connect Telegram before you save."
      />,
    );
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it("renders the linked Telegram field", () => {
    const { container } = render(<TelegramConnectField {...TELEGRAM} chatId="555" username="bob" />);
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
          { field: "telegram", message: "Connect Telegram before you save.", targetId: "form-telegram" },
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

  it("writes the empty state, the summary and the load error in Czech, numbers with a decimal comma", () => {
    const empty = renderCs(<NotificationEmptyState chainName="Arbitrum" onCreate={noop} />);
    expect(text(empty.container)).toBe(
      "Na síti Arbitrum zatím nemáte žádné upozorněníDostanete zprávu, když váš health factor klesne pod práh, který si zvolíte.Vytvořit upozornění",
    );
    empty.unmount();

    const summary = renderCs(
      <NotificationCard isActive>
        <NotificationSummary
          services={["email", "signal", "telegram"]}
          email="me@example.com"
          signalRecipient="alice.42"
          telegramChatId="555"
          telegramUsername={null}
          threshold={1.8}
          currentHealthFactor="1.20"
          showBelowThresholdWarning
        />
      </NotificationCard>,
    );
    expect(text(summary.container)).toBe(
      "Nastavení upozorněníAktivní" +
        "KanályE-mailSignalTelegramE-mailme@example.comSignal@alice.42TelegramPropojenoPráh1,8" +
        "Pod prahem vašeho upozorněníVáš aktuální health factor (1,20) je pod vaším prahem 1,8.",
    );
    summary.unmount();

    const failed = renderCs(<NotificationLoadError isRetrying={false} onRetry={noop} />);
    expect(text(failed.container)).toContain("Nastavení upozornění se nenačetlo");
    expect(screen.getByRole("button", { name: "Zkusit znovu" })).toBeDefined();
  });

  it("writes the Telegram field in Czech in each state", () => {
    const waiting = renderCs(<TelegramConnectField {...TELEGRAM} isConnecting deepLink="https://t.me/bot?start=tok" />);
    expect(text(waiting.container)).toBe(
      // The loading button keeps its label for its width.
      "TelegramPřipojit TelegramČekáme na TelegramTelegram se neotevřel? Otevřít Telegram (otevře se v nové kartě)" +
        "Otevře našeho bota v Telegramu. Stiskněte tam Start a tato peněženka se propojí s vaším chatem.",
    );
    waiting.unmount();
    const linked = renderCs(<TelegramConnectField {...TELEGRAM} chatId="555" username="bob" />);
    expect(text(linked.container)).toBe("TelegramPřipojeno jako @bobOdpojit Telegram");
    linked.unmount();
    const unknown = renderCs(<TelegramConnectField {...TELEGRAM} isStatusUnknown />);
    expect(text(unknown.container)).toBe("TelegramPropojení s Telegramem se nepodařilo ověřitZkusit znovu");
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
