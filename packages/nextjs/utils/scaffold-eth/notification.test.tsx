// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster, toast } from "react-hot-toast";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { notification } from "~~/utils/scaffold-eth/notification";

describe("notification", () => {
  // react-hot-toast asks for prefers-reduced-motion, which jsdom does not implement.
  beforeAll(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }));
  });

  afterEach(() => {
    act(() => toast.remove());
  });

  it("announces errors as alerts and everything else politely", async () => {
    render(<Toaster />);
    act(() => {
      notification.error("Payment failed");
      notification.success("Alert saved");
    });

    const error = (await screen.findByText("Payment failed")).closest('[role="alert"]');
    const success = (await screen.findByText("Alert saved")).closest('[role="status"]');
    expect(error?.getAttribute("aria-live")).toBe("assertive");
    expect(success?.getAttribute("aria-live")).toBe("polite");
  });

  it("closes with a named dismiss button", async () => {
    render(<Toaster />);
    act(() => {
      notification.info("Waiting for your wallet");
    });
    await screen.findByText("Waiting for your wallet");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByText("Waiting for your wallet")).toBeNull();
  });
});
