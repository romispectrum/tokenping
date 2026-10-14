import type { ReactNode } from "react";

type PageBackgroundProps = {
  children: ReactNode;
};

/** Full-height page wrapper with the gradient background and three pulsing blobs. */
export const PageBackground = ({ children }: PageBackgroundProps) => (
  <div className="min-h-screen bg-base-200 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </div>
    {children}
  </div>
);
