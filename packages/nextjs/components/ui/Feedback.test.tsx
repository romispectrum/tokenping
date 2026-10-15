// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { Bell } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Alert, LiveRegion } from "~~/components/ui/Alert";
import { EmptyState } from "~~/components/ui/EmptyState";
import { Skeleton } from "~~/components/ui/Skeleton";
import { Spinner } from "~~/components/ui/Spinner";

describe("Alert", () => {
  it("is a note with a title, a description and the neutral info icon by default", () => {
    render(<Alert title="Read only">You are viewing a shared dashboard.</Alert>);
    const alert = screen.getByRole("note");

    expect(alert.getAttribute("data-variant")).toBe("default");
    expect(alert.className).toContain("border-border bg-card");
    expect(screen.getByText("Read only").className).toContain("text-foreground");
    expect(screen.getByText("You are viewing a shared dashboard.").className).toContain("text-muted-foreground");
    expect(alert.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it.each([
    ["info", "bg-info-subtle", "text-info"],
    ["success", "bg-success-subtle", "text-success"],
    ["warning", "bg-warning-subtle", "text-warning"],
    ["destructive", "bg-destructive-subtle", "text-destructive"],
  ] as const)("tints the %s alert and colours only its icon", (variant, surface, iconColor) => {
    render(<Alert variant={variant} title="Status" />);
    const alert = screen.getByRole("note");

    expect(alert.className).toContain(surface);
    expect(alert.querySelector("svg")?.getAttribute("class")).toContain(iconColor);
  });

  it("can drop the icon, take a role and carry an action", () => {
    render(
      <Alert
        variant="destructive"
        role="alert"
        icon={null}
        title="Could not save"
        action={<button>Try again</button>}
      />,
    );
    const alert = screen.getByRole("alert");

    expect(alert.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("announces messages rendered into a live region that already exists", () => {
    const { rerender } = render(<LiveRegion data-testid="region" />);
    const region = screen.getByTestId("region");

    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.getAttribute("aria-atomic")).toBe("true");

    rerender(
      <LiveRegion data-testid="region" politeness="assertive">
        <Alert variant="success" title="Alert saved" />
      </LiveRegion>,
    );
    expect(screen.getByTestId("region")).toBe(region);
    expect(region.getAttribute("aria-live")).toBe("assertive");
    expect(region.textContent).toBe("Alert saved");
  });
});

describe("Skeleton", () => {
  it("pulses in the muted colour, accent on dark, and stops under reduced motion", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-3/4" />);
    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton.getAttribute("aria-hidden")).toBe("true");
    expect(skeleton.className).toBe(
      "animate-pulse rounded-lg bg-muted motion-reduce:animate-none dark:bg-accent h-4 w-3/4",
    );
  });
});

describe("Spinner", () => {
  it("is a polite status with visible text when labelled", () => {
    render(<Spinner label="Loading balances" />);
    const status = screen.getByRole("status");

    expect(status.textContent).toBe("Loading balances");
    expect(status.querySelector("svg")?.getAttribute("class")).toContain("motion-reduce:animate-none");
  });

  it("is a decorative icon without a label", () => {
    const { container } = render(<Spinner className="size-5" />);
    const icon = container.querySelector("svg");

    expect(screen.queryByRole("status")).toBeNull();
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(icon?.getAttribute("class")).toContain("size-5");
  });
});

describe("EmptyState", () => {
  it("shows a calm icon tile, a heading, a description and one action", () => {
    render(
      <EmptyState
        icon={Bell}
        title="No alerts yet"
        description="Set a threshold and we email you before liquidation."
        action={<button>Create an alert</button>}
      />,
    );
    const heading = screen.getByRole("heading", { level: 2, name: "No alerts yet" });

    expect(heading.className).toContain("text-base font-medium");
    expect(screen.getByText("Set a threshold and we email you before liquidation.").className).toContain(
      "text-muted-foreground",
    );
    expect(screen.getByRole("button", { name: "Create an alert" })).toBeTruthy();
    expect(heading.closest(".border-dashed")).not.toBeNull();
  });

  it("renders inline with a lower heading level", () => {
    render(<EmptyState title="No positions" size="inline" headingLevel={3} />);
    const heading = screen.getByRole("heading", { level: 3, name: "No positions" });

    expect(heading.closest(".border-dashed")).toBeNull();
  });
});
