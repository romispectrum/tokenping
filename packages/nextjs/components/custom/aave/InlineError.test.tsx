// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InlineError } from "~~/components/custom/aave/InlineError";

describe("InlineError", () => {
  it("says what failed and why, and retries from an outline button", () => {
    const onRetry = vi.fn();
    render(<InlineError title="Positions did not load" detail="The network did not respond." onRetry={onRetry} />);

    expect(screen.getByRole("alert").textContent).toBe("Positions did not loadThe network did not respond.Try again");
    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry.className).not.toContain("btn-primary");
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has no button without a retry", () => {
    render(<InlineError title="Positions did not load" detail="The network did not respond." />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
