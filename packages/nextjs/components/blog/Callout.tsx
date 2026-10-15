import type { ReactNode } from "react";
import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export const CALLOUT_TONES = ["info", "warning"] as const;

type CalloutTone = (typeof CALLOUT_TONES)[number];

type CalloutProps = {
  tone?: CalloutTone;
  children: ReactNode;
};

const TONE_STYLES: Record<CalloutTone, { label: string; Icon: typeof InformationCircleIcon; className: string }> = {
  info: {
    label: "Note",
    Icon: InformationCircleIcon,
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-50",
  },
  warning: {
    label: "Warning",
    Icon: ExclamationTriangleIcon,
    className:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-50",
  },
};

export const Callout = ({ tone = "info", children }: CalloutProps) => {
  const { label, Icon, className } = TONE_STYLES[tone] ?? TONE_STYLES.info;
  return (
    <div role="note" className={`my-6 flex gap-3 rounded-2xl border p-4 ${className}`}>
      <Icon className="mt-1.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 [&>p]:my-1 [&>p]:text-inherit">
        <span className="sr-only">{`${label}: `}</span>
        {children}
      </div>
    </div>
  );
};
