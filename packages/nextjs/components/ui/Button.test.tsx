// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "~~/components/ui/Button";
import { BUTTON_SIZES, BUTTON_VARIANTS, type ButtonVariant, buttonClasses } from "~~/components/ui/buttonClasses";

describe("Button", () => {
  it("is a pink primary btn of type button by default", () => {
    render(<Button>Save changes</Button>);
    const button = screen.getByRole("button", { name: "Save changes" });

    expect(button.getAttribute("type")).toBe("button");
    expect(button.className.split(" ")).toEqual(expect.arrayContaining(["btn", "btn-primary"]));
    expect(button.className).toContain("focus-visible:outline-ring");
  });

  it.each(Object.keys(BUTTON_VARIANTS) as ButtonVariant[])("applies the %s variant", variant => {
    render(<Button variant={variant}>Go</Button>);

    expect(screen.getByRole("button").className).toContain(BUTTON_VARIANTS[variant]);
  });

  // Hover, selected and focus are never pink: only the default variant carries the primary colour.
  it("keeps pink to the default variant", () => {
    for (const variant of Object.keys(BUTTON_VARIANTS) as ButtonVariant[]) {
      const classes = BUTTON_VARIANTS[variant];
      expect(/btn-primary|bg-primary|brand-pink/.test(classes), variant).toBe(variant === "default");
    }
  });

  it.each(Object.entries(BUTTON_SIZES))("applies the %s size", (size, classes) => {
    // lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view
    render(<Button size={size as keyof typeof BUTTON_SIZES}>Go</Button>);

    expect(screen.getByRole("button").className).toContain(classes);
  });

  it("reaches 44px on touch screens at every size but lg, which is 48px already", () => {
    expect(BUTTON_SIZES.sm).toContain("pointer-coarse:min-h-11");
    expect(BUTTON_SIZES.default).toContain("pointer-coarse:min-h-11");
    expect(BUTTON_SIZES.icon).toContain("pointer-coarse:min-w-11");
    expect(BUTTON_SIZES.lg).toContain("btn-lg");
  });

  it("keeps the given type and calls onClick", () => {
    const onClick = vi.fn();
    render(
      // lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view
      <Button type="submit" onClick={onClick}>
        Send message
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Send message" });
    fireEvent.click(button);

    expect(button.getAttribute("type")).toBe("submit");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("loading", () => {
    // Loading keeps focus and colour (aria-disabled, not disabled) and blocks the action.
    it("sets aria-busy and aria-disabled, stays focusable and ignores clicks", () => {
      const onClick = vi.fn();
      render(
        // lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view
        <Button loading onClick={onClick}>
          Save changes
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Save changes" });
      button.focus();
      fireEvent.click(button);

      expect(button.getAttribute("aria-busy")).toBe("true");
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.hasAttribute("disabled")).toBe(false);
      expect(document.activeElement).toBe(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not submit its form while loading", () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      render(
        <form onSubmit={e => onSubmit(e.nativeEvent)}>
          {/* lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view */}
          <Button type="submit" loading>
            Save changes
          </Button>
        </form>,
      );
      fireEvent.click(screen.getByRole("button"));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows the loading label and keeps the normal label laid out but hidden", () => {
      render(
        // lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view
        <Button loading loadingText="Saving">
          Save changes
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Saving" });
      const hiddenLabel = button.querySelector('[aria-hidden="true"].invisible');

      expect(hiddenLabel?.textContent).toBe("Save changes");
      expect(button.querySelector("svg.animate-spin")?.getAttribute("aria-hidden")).toBe("true");
    });

    it("keeps the label as the accessible name when there is no loading label", () => {
      // lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view
      render(<Button loading>Save changes</Button>);
      const button = screen.getByRole("button", { name: "Save changes" });

      expect(button.querySelector(".opacity-0")?.textContent).toBe("Save changes");
      expect(button.querySelector("svg.motion-reduce\\:animate-none")).not.toBeNull();
    });
  });

  it("swallows clicks and submits while aria-disabled, but stays focusable", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    render(
      <form onSubmit={e => onSubmit(e.nativeEvent)}>
        <Button type="submit" variant="secondary" aria-disabled onClick={onClick}>
          Pay
        </Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Pay" });

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  it("stays a native disabled button when disabled", () => {
    // lint-brand-ignore-next-line multiple-primary: every test renders its own button, a test file is not a view
    render(<Button disabled>Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(button.className).toContain("disabled:pointer-events-none disabled:opacity-50");
  });

  // DaisyUI greys every disabled btn; each filled variant keeps its own fill so all of them fade the same way.
  it.each([
    ["default", "disabled:bg-primary! disabled:text-primary-foreground"],
    ["inverse", "disabled:bg-inverse! disabled:text-inverse-foreground"],
    ["secondary", "disabled:bg-secondary!"],
    ["outline", "disabled:bg-background!"],
    ["destructive", "disabled:bg-destructive! disabled:text-destructive-foreground"],
  ] as const)("keeps the %s fill when disabled", (variant, classes) => {
    expect(BUTTON_VARIANTS[variant]).toContain(classes);
  });
});

describe("buttonClasses", () => {
  it("styles a link as a button with the same classes", () => {
    expect(buttonClasses({ variant: "secondary", size: "lg", className: "w-full" })).toBe(
      `${buttonClasses().split(" btn-primary")[0]} ${BUTTON_VARIANTS.secondary} ${BUTTON_SIZES.lg} w-full`,
    );
  });
});
