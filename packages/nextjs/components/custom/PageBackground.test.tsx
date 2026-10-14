import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { PageBackground } from "~~/components/custom/PageBackground";
import { renderStaticMarkup } from "~~/utils/testing/render";

// Verbatim copy of the wrapper and blobs formerly inlined in app/page.tsx and app/aave/page.tsx.
const LegacyBackground = ({ children }: { children: ReactNode }) => (
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

const Content = () => <div className="relative z-10 flex flex-col items-center grow">content</div>;

describe("PageBackground", () => {
  it("renders the same markup as the inline page background", () => {
    expect(
      renderStaticMarkup(
        <PageBackground>
          <Content />
        </PageBackground>,
      ),
    ).toBe(
      renderStaticMarkup(
        <LegacyBackground>
          <Content />
        </LegacyBackground>,
      ),
    );
  });

  it("renders children after the blob layer", () => {
    expect(renderStaticMarkup(<PageBackground>child</PageBackground>)).toBe(
      '<div class="min-h-screen bg-base-200 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">' +
        '<div class="fixed inset-0 overflow-hidden pointer-events-none">' +
        '<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>' +
        '<div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay:1s"></div>' +
        '<div class="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay:2s"></div>' +
        "</div>child</div>",
    );
  });
});
