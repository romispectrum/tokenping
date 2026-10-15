"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, Copy } from "lucide-react";
import { shortenHex, toDisplayAddress } from "~~/components/custom/aave/web3Format";
import { cx } from "~~/components/ui";

// A deterministic avatar from chart series 1, 4 and 5: never chart-3 (pink, the view's primary action) and never
// chart-2 (cyan in dark, never a fill).
const AVATAR_FILLS = [
  "from-chart-1 to-chart-4",
  "from-chart-4 to-chart-1",
  "from-chart-1 to-chart-5",
  "from-chart-5 to-chart-1",
  "from-chart-4 to-chart-5",
  "from-chart-5 to-chart-4",
] as const;

const COPIED_RESET_MS = 2_000;

const avatarFill = (address: string) => {
  let hash = 0;
  for (const char of address.toLowerCase().slice(2)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_FILLS[hash % AVATAR_FILLS.length];
};

type CopyState = "idle" | "copied" | "failed";

const COPY_ANNOUNCEMENTS: Record<CopyState, string> = {
  idle: "",
  copied: "Address copied",
  failed: "Could not copy. Select the address and copy it manually.",
};

type AddressChipProps = {
  address: string;
  /** Read before the address by screen readers ("Wallet"). */
  label?: string;
  className?: string;
};

/**
 * An address as `0x1234...abcd` in the data face, with a copy button. The full checksummed address is in `title` and
 * in the accessible name; copy confirms with an icon swap and an announced "Address copied".
 */
export const AddressChip = ({ address, label = "Address", className }: AddressChipProps) => {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fullAddress = toDisplayAddress(address);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), COPIED_RESET_MS);
  };

  return (
    <span
      title={fullAddress}
      className={cx(
        "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-secondary pr-0.5 pl-1 text-sm text-secondary-foreground",
        className,
      )}
    >
      <span aria-hidden="true" className={cx("size-6 shrink-0 rounded-full bg-linear-135", avatarFill(fullAddress))} />
      <span className="sr-only">{`${label}: ${fullAddress}`}</span>
      <span aria-hidden="true" className="truncate pl-0.5 font-data">
        {shortenHex(fullAddress)}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label.toLowerCase()} ${fullAddress}`}
        className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-[ease] after:absolute after:-inset-2 hover:bg-accent hover:text-accent-foreground"
      >
        {copyState === "copied" ? (
          <Check aria-hidden="true" className="size-4 text-success" />
        ) : copyState === "failed" ? (
          <CircleAlert aria-hidden="true" className="size-4 text-destructive" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
      </button>
      {/* Mounted from the start, so the copy result is announced. */}
      <span role="status" aria-live="polite" className="sr-only">
        {COPY_ANNOUNCEMENTS[copyState]}
      </span>
    </span>
  );
};
