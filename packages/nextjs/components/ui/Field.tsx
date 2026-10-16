import { type ReactNode, useId } from "react";
import { cx } from "~~/components/ui/classNames";
import { useMessages } from "~~/i18n/LocaleProvider";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";

/** The props a Field hands to its control: spread them on the Input, Select, Textarea, Checkbox or Switch. */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

type FieldProps = {
  /** Always visible. A placeholder is an example value, never the label. */
  label: ReactNode;
  /** One sentence of help under the control. */
  description?: ReactNode;
  /** What is wrong and how to fix it ("Enter an email address like name@example.com"). */
  error?: ReactNode;
  /**
   * The error is an alert by default, announced when it appears. Set false when the field is validated on every
   * keystroke, or when an error summary already announces: the message stays linked through aria-describedby and
   * aria-invalid, it just does not interrupt.
   */
  liveError?: boolean;
  /** Appends "(optional)" to the label; required fields are not starred. */
  optional?: boolean;
  required?: boolean;
  /** The control's id; generated when omitted. */
  id?: string;
  /** "horizontal" puts the control inside its label, before the text: checkbox and switch rows (44px on touch). */
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label, control, description, error, wired for assistive technology: the label names the control, the
 * description and the error describe it, and aria-invalid marks it. The label never turns red: red is for the
 * control border and the message.
 *
 *   <Field label="Email" description="We only use it for alerts." error={errors.email}>
 *     {control => <Input type="email" autoComplete="email" {...control} />}
 *   </Field>
 *
 * "(optional)" follows the page's language (LocaleProvider), so a Field renders inside client components only.
 */
export const Field = ({
  label,
  description,
  error,
  liveError = true,
  optional = false,
  required,
  id,
  orientation = "vertical",
  className,
  children,
}: FieldProps) => {
  const generatedId = useId();
  const optionalLabel = useMessages(COMMON_MESSAGES).field.optional;
  const controlId = id ?? `field${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const invalid = error !== undefined && error !== null && error !== false && error !== "";
  const describedBy = [description ? descriptionId : null, invalid ? errorId : null].filter(Boolean).join(" ");

  const control = children({
    id: controlId,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": invalid || undefined,
    required,
  });
  const labelText = (
    <>
      {label}
      {/* the space keeps "(optional)" a separate word in the accessible name; flex drops it visually */}
      {optional ? (
        <>
          {" "}
          <span className="font-normal text-muted-foreground">{optionalLabel}</span>
        </>
      ) : null}
    </>
  );
  const help = (
    <>
      {description ? (
        <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} role={liveError ? "alert" : undefined} className="m-0 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );

  if (orientation === "horizontal") {
    // The control sits inside its label, so the whole row, gap included, toggles it: 44px tall on touch screens
    // although a checkbox is 20px and a switch 24px. The description and the error stay outside the label (they
    // describe the control, they do not name it) and line up under the label text in the subgrid's second column.
    return (
      <div
        data-slot="field"
        data-invalid={invalid || undefined}
        className={cx("grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1", className)}
      >
        <label
          htmlFor={controlId}
          className="col-span-2 grid cursor-pointer grid-cols-subgrid items-center has-disabled:cursor-not-allowed pointer-coarse:min-h-11"
        >
          {control}
          <span className="flex items-center gap-1.5 text-sm leading-snug font-medium text-foreground">
            {labelText}
          </span>
        </label>
        {description || invalid ? <div className="col-start-2 flex flex-col gap-1">{help}</div> : null}
      </div>
    );
  }

  return (
    <div data-slot="field" data-invalid={invalid || undefined} className={cx("flex w-full flex-col gap-2", className)}>
      <label
        htmlFor={controlId}
        className="flex w-fit items-center gap-1.5 text-sm leading-snug font-medium text-foreground"
      >
        {labelText}
      </label>
      {control}
      {help}
    </div>
  );
};
