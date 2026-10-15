// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "~~/components/ui/Checkbox";
import { Field } from "~~/components/ui/Field";
import { Input } from "~~/components/ui/Input";
import { Select } from "~~/components/ui/Select";
import { Switch } from "~~/components/ui/Switch";
import { Textarea } from "~~/components/ui/Textarea";

describe("Field", () => {
  it("labels the control with a visible label", () => {
    render(<Field label="Email">{control => <Input type="email" {...control} />}</Field>);
    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input.getAttribute("type")).toBe("email");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  it("describes the control with its description", () => {
    render(
      <Field label="Email" description="We only use it for alerts.">
        {control => <Input {...control} />}
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-describedby")).toBe(
      screen.getByText("We only use it for alerts.").id,
    );
  });

  it("marks the control invalid and announces the error after the description", () => {
    render(
      <Field
        label="Email"
        description="We only use it for alerts."
        error="Enter an email address like name@example.com"
      >
        {control => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    const error = screen.getByRole("alert");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      `${screen.getByText("We only use it for alerts.").id} ${error.id}`,
    );
    expect(error.textContent).toBe("Enter an email address like name@example.com");
    expect(error.className).toContain("text-destructive");
    // the label never turns red
    expect(screen.getByText("Email").className).toContain("text-foreground");
  });

  it("keeps a quiet error linked but not announced when liveError is false", () => {
    render(
      <Field label="Price (USD)" error="Enter a price above 0." liveError={false}>
        {control => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Price (USD)" });
    const error = screen.getByText("Enter a price above 0.");

    expect(screen.queryByRole("alert")).toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(error.id);
  });

  it("appends (optional) instead of starring required fields", () => {
    render(
      <Field label="Telegram username" optional>
        {control => <Input {...control} />}
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "Telegram username (optional)" })).toBeTruthy();
  });

  it("passes required and a given id to the control", () => {
    render(
      <Field label="Threshold" id="threshold" required>
        {control => <Input inputMode="decimal" {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Threshold" }) as HTMLInputElement;

    expect(input.id).toBe("threshold");
    expect(input.required).toBe(true);
  });

  it("gives every field its own ids", () => {
    render(
      <>
        <Field label="First">{control => <Input {...control} />}</Field>
        <Field label="Second">{control => <Input {...control} />}</Field>
      </>,
    );

    expect(screen.getByRole("textbox", { name: "First" }).id).not.toBe(
      screen.getByRole("textbox", { name: "Second" }).id,
    );
  });

  it("puts a checkbox before its label in a horizontal row", () => {
    render(
      <Field label="Email me a weekly summary" orientation="horizontal">
        {control => <Checkbox {...control} />}
      </Field>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Email me a weekly summary" });
    const label = screen.getByText("Email me a weekly summary");

    expect(checkbox.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // A 20px checkbox or 24px switch alone misses the 44px touch target: the whole row is its label instead.
  it("makes the whole horizontal row the control's label, 44px on touch, with the help outside it", () => {
    render(
      <Field
        label="Email alerts"
        description="We email you below your threshold."
        error="Add an email address first"
        orientation="horizontal"
      >
        {control => <Switch {...control} />}
      </Field>,
    );
    const toggle = screen.getByRole("switch", { name: "Email alerts" }) as HTMLInputElement;
    const row = toggle.closest("label") as HTMLLabelElement;

    expect(row.htmlFor).toBe(toggle.id);
    expect(row.className).toContain("pointer-coarse:min-h-11");
    expect(row.contains(screen.getByText("We email you below your threshold."))).toBe(false);
    expect(row.contains(screen.getByRole("alert"))).toBe(false);
    expect(toggle.getAttribute("aria-describedby")).toBe(
      `${screen.getByText("We email you below your threshold.").id} ${screen.getByRole("alert").id}`,
    );

    fireEvent.click(screen.getByText("Email alerts"));
    expect(toggle.checked).toBe(true);
  });
});

describe("form controls", () => {
  it("renders a filled input with the 3:1 boundary and the ring focus", () => {
    render(<Input aria-label="Amount" />);
    const input = screen.getByRole("textbox", { name: "Amount" });

    expect(input.getAttribute("type")).toBe("text");
    expect(input.className).toContain("input w-full");
    expect(input.className).toContain("border-input bg-background");
    expect(input.className).toContain("focus-visible:outline-ring");
    expect(input.className).toContain("aria-invalid:border-destructive");
    expect(input.className).toContain("text-base text-foreground md:text-sm");
  });

  it("renders a textarea in the same box", () => {
    render(<Textarea aria-label="Note" />);

    expect(screen.getByRole("textbox", { name: "Note" }).className).toContain("textarea field-sizing-content");
  });

  it("renders a native select", () => {
    render(
      <Select aria-label="Network" defaultValue="base">
        <option value="ethereum">Ethereum</option>
        <option value="base">Base</option>
      </Select>,
    );
    const select = screen.getByRole("combobox", { name: "Network" }) as HTMLSelectElement;

    expect(select.value).toBe("base");
    expect(select.className).toContain("select w-full border border-input bg-background");
  });

  it("renders a checkbox", () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    const checkbox = screen.getByRole("checkbox", { name: "Agree" }) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);
    expect(checkbox.className).toContain("checkbox size-5");
  });

  it("renders a switch as a checkbox with the switch role", () => {
    render(<Switch aria-label="Email alerts" defaultChecked />);
    const toggle = screen.getByRole("switch", { name: "Email alerts" }) as HTMLInputElement;

    expect(toggle.type).toBe("checkbox");
    expect(toggle.checked).toBe(true);
    expect(toggle.className).toContain("toggle");
  });
});
