import type { ReactNode } from "react";
import { Kicker } from "~~/components/ui/Kicker";

type ShortAnswerProps = {
  children: ReactNode;
};

/**
 * The two or three sentence answer directly under the H1, at lead size in a flat card. The label is a kicker, not a
 * heading, so the outline stays H1 then H2.
 */
export const ShortAnswer = ({ children }: ShortAnswerProps) => (
  <div className="my-8 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
    <Kicker>Short answer</Kicker>
    <div className="text-lead [&>p]:my-0 [&>p+p]:mt-4">{children}</div>
  </div>
);
