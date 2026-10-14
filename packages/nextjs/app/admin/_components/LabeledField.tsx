import type { ReactNode } from "react";

type LabeledFieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

/** The label wraps its control so it also names it: the scaffold-ui inputs take no id for a `for` attribute. */
export const LabeledField = ({ label, className, children }: LabeledFieldProps) => (
  <label className={`fieldset${className ? ` ${className}` : ""}`}>
    <span className="fieldset-legend">{label}</span>
    {children}
  </label>
);
