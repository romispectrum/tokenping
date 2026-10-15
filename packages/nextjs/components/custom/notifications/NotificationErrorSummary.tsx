import type { Ref } from "react";
import type { NotificationFormField } from "~~/components/custom/notifications/notificationForm";
import { Alert } from "~~/components/ui";

export type ErrorSummaryItem = {
  field: NotificationFormField;
  message: string;
  /** The id of the field's group or wrapper, the link's target. */
  targetId: string;
};

type NotificationErrorSummaryProps = {
  items: readonly ErrorSummaryItem[];
  /** Focuses the field's first control: following the link alone would only scroll to it. */
  onSelect: (field: NotificationFormField) => void;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Shown at the top of a form with more than 3 fields when Save fails: how many fields to fix, and each message as a
 * link to its field. The form moves focus here (tabIndex -1), and role="alert" announces it.
 */
export const NotificationErrorSummary = ({ items, onSelect, ref }: NotificationErrorSummaryProps) => (
  <Alert
    ref={ref}
    role="alert"
    tabIndex={-1}
    variant="destructive"
    title={`Fix ${items.length} ${items.length === 1 ? "field" : "fields"} to save`}
  >
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {items.map(({ field, message, targetId }) => (
        <li key={field}>
          <a
            href={`#${targetId}`}
            onClick={event => {
              event.preventDefault();
              onSelect(field);
            }}
          >
            {message}
          </a>
        </li>
      ))}
    </ul>
  </Alert>
);
