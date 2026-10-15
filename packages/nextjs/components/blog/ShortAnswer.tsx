import type { ReactNode } from "react";

type ShortAnswerProps = {
  children: ReactNode;
};

/** The 2–3 sentence answer directly under the H1. The label is not a heading, so the outline stays H1 -> H2. */
export const ShortAnswer = ({ children }: ShortAnswerProps) => (
  <div className="my-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5 dark:border-indigo-400/30 dark:bg-indigo-500/10">
    <p className="m-0 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
      Short answer
    </p>
    <div className="text-base-content [&>p]:my-2 [&>p:last-child]:mb-0 [&>p]:text-base-content dark:[&>p]:text-gray-100">
      {children}
    </div>
  </div>
);
