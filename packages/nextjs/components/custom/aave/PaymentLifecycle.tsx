import type { ReactNode } from "react";
import { Check, CircleCheck, ExternalLink, LoaderCircle, Minus, PenLine } from "lucide-react";
import type { PaymentProgress, PaymentStep } from "~~/components/custom/aave/paymentProgress";
import { shortenHex } from "~~/components/custom/aave/web3Format";
import { cx } from "~~/components/ui";

type StepState = "upcoming" | "current" | "done" | "skipped";

// Shown next to the step title, so the marker's tint and icon never carry the state alone.
const STEP_STATE_TEXT: Record<StepState, string | null> = {
  upcoming: null,
  current: "In progress",
  done: "Done",
  skipped: "Not needed",
};

const approveState = (progress: PaymentProgress | null): StepState => {
  if (!progress || progress.step === "preparing") return "upcoming";
  if (progress.step === "approve-sign" || progress.step === "approve-pending") return "current";
  // A sent approval stays done when the payment after it fails; a failed approval is not done.
  if (progress.step === "failed") return progress.approveHash ? "done" : "upcoming";
  return progress.approveSkipped ? "skipped" : "done";
};

const payState = (progress: PaymentProgress | null): StepState =>
  progress?.step === "pay-sign" || progress?.step === "pay-pending" ? "current" : "upcoming";

const StepMarker = ({ index, state }: { index: number; state: StepState }) => {
  const base = "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium";
  if (state === "current") {
    return (
      <span aria-hidden="true" className={cx(base, "bg-info-subtle text-info")}>
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
      </span>
    );
  }
  if (state === "done") {
    return (
      <span aria-hidden="true" className={cx(base, "bg-success-subtle text-success")}>
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "skipped") {
    return (
      <span aria-hidden="true" className={cx(base, "border border-dashed border-input text-muted-foreground")}>
        <Minus className="size-4" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cx(base, "border border-input text-foreground tabular-nums")}>
      {index}
    </span>
  );
};

type PaymentStepsProps = {
  /** "1.5 USDC" */
  amount: string;
  /** null while no payment is running. */
  progress: PaymentProgress | null;
};

/** Both wallet requests, shown before the first one opens: a two-step flow never chains a second prompt silently. */
export const PaymentSteps = ({ amount, progress }: PaymentStepsProps) => {
  const steps = [
    {
      title: `Approve ${amount}`,
      hint: "Lets the paywall take exactly this amount. Skipped when an earlier approval covers it.",
      state: approveState(progress),
    },
    { title: `Pay ${amount}`, hint: "Sends the payment and unlocks alerts.", state: payState(progress) },
  ];

  return (
    <ol aria-label="Payment steps" className="m-0 flex list-none flex-col gap-3 p-0">
      {steps.map(({ title, hint, state }, index) => (
        <li key={title} aria-current={state === "current" ? "step" : undefined} className="m-0 flex items-start gap-3">
          <StepMarker index={index + 1} state={state} />
          <span className="flex min-w-0 flex-col gap-0.5 text-sm">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className={cx("font-medium", state === "skipped" ? "text-muted-foreground" : "text-foreground")}>
                {title}
              </span>
              {STEP_STATE_TEXT[state] ? (
                <span className="text-muted-foreground">
                  {/* Keeps the title and the state apart when read as one line. */}
                  <span className="sr-only">, </span>
                  {STEP_STATE_TEXT[state]}
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground">{hint}</span>
          </span>
        </li>
      ))}
    </ol>
  );
};

type Explorer = { name: string; url: string };

const ExplorerLink = ({ hash, explorer }: { hash: string; explorer: Explorer | undefined }) => (
  <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
    <span className="font-data text-sm text-muted-foreground" title={hash}>
      <span className="sr-only">Transaction </span>
      {shortenHex(hash, { start: 10, end: 8 })}
    </span>
    {explorer ? (
      <a
        href={`${explorer.url}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-link underline underline-offset-3 hover:decoration-2 pointer-coarse:min-h-11"
      >
        {`View on ${explorer.name}`}
        <ExternalLink aria-hidden="true" className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    ) : null}
  </p>
);

type StatusDisplay = { tone: "info" | "success"; icon: ReactNode; title?: string; body: string; hash?: string };

const SPINNER = <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />;
const SIGN = <PenLine aria-hidden="true" className="size-5" />;

const describeStep = (
  step: PaymentStep,
  progress: PaymentProgress,
  amount: string,
  network: string,
): StatusDisplay | null => {
  switch (step) {
    case "preparing":
      return {
        tone: "info",
        icon: SPINNER,
        title: "Preparing the payment",
        body: "Checking the current price and your approval.",
      };
    case "approve-sign":
      return {
        tone: "info",
        icon: SIGN,
        title: "Confirm in your wallet",
        body: `Step 1 of 2: approve ${amount}. Nothing is sent until you confirm.`,
      };
    case "approve-pending":
      return {
        tone: "info",
        icon: SPINNER,
        title: `Processing on ${network}`,
        body: "Step 1 of 2: approval submitted. Your wallet asks you to confirm the payment next.",
        hash: progress.approveHash,
      };
    case "pay-sign":
      return {
        tone: "info",
        icon: SIGN,
        title: "Confirm in your wallet",
        body: `Step 2 of 2: pay ${amount}. Nothing is sent until you confirm.`,
      };
    case "pay-pending":
      return {
        tone: "info",
        icon: SPINNER,
        title: `Processing on ${network}`,
        body: "Step 2 of 2: payment submitted. Alerts unlock once the network confirms it.",
        hash: progress.payHash,
      };
    case "failed":
      // The flow is ending; its error toast says what happened, so the region goes quiet instead of guessing.
      return null;
  }
};

const TONE_SURFACE = { info: "border-info/30 bg-info-subtle", success: "border-success/30 bg-success-subtle" };
const TONE_ICON = { info: "text-info", success: "text-success" };

type PaymentStatusProps = {
  /** Lets the Pay button point at the notice that says why it is blocked after a payment. */
  id?: string;
  amount: string;
  /** The running payment, or null. */
  progress: PaymentProgress | null;
  /** Shown when no payment is running: the payment went through but access does not show yet. */
  pendingAccessMessage: string | null;
  network: string;
  explorer: Explorer | undefined;
};

/**
 * The transaction lifecycle in words: one persistent polite live region, mounted while idle so the first change is
 * announced. Each state has an icon and a title; a sent transaction shows its hash and an explorer link.
 */
export const PaymentStatus = ({
  id,
  amount,
  progress,
  pendingAccessMessage,
  network,
  explorer,
}: PaymentStatusProps) => {
  const display: StatusDisplay | null = progress
    ? describeStep(progress.step, progress, amount, network)
    : pendingAccessMessage
      ? { tone: "success", icon: <CircleCheck aria-hidden="true" className="size-5" />, body: pendingAccessMessage }
      : null;

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-step={progress?.step}
      className={
        display
          ? cx("flex items-start gap-3 rounded-xl border p-4 text-sm text-foreground", TONE_SURFACE[display.tone])
          : undefined
      }
    >
      {display ? (
        <>
          <span className={cx("mt-px shrink-0", TONE_ICON[display.tone])}>{display.icon}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {display.title ? <p className="m-0 font-medium">{display.title}</p> : null}
            <p className={cx("m-0", display.title ? "text-muted-foreground" : "font-medium")}>{display.body}</p>
            {display.hash ? <ExplorerLink hash={display.hash} explorer={explorer} /> : null}
          </div>
        </>
      ) : null}
    </div>
  );
};
