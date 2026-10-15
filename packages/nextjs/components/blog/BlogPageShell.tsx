import type { ReactNode } from "react";

type BlogPageShellProps = {
  children: ReactNode;
};

/** The site's background (static, unlike PageBackground's pulsing blobs, which distract while reading). */
export const BlogPageShell = ({ children }: BlogPageShellProps) => (
  <div className="flex-1 bg-base-200 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:pt-10 sm:pb-16">{children}</div>
  </div>
);
