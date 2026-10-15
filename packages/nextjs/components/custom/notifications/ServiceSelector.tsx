import { useId } from "react";
import { SERVICE_ICONS } from "~~/components/custom/notifications/serviceIcons";
import { Checkbox, cx } from "~~/components/ui";
import { getSelectableServices } from "~~/constants/notifications";
import type { NotificationService } from "~~/types/notifications";

type ServiceSelectorProps = {
  /** The group's id, for links to it (the error summary). */
  id?: string;
  services: NotificationService[];
  onToggle: (service: NotificationService) => void;
  /** Shown after a failed Save. */
  error?: string;
};

/**
 * Checkboxes (the form saves with a button, so no switches), each in a choice tile that is wholly its label: the
 * tile is the touch target and selected is the violet accent, never pink.
 */
export const ServiceSelector = ({ id: groupId, services, onToggle, error }: ServiceSelectorProps) => {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  return (
    <fieldset
      id={groupId}
      data-field="services"
      aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
      className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
    >
      <legend className="mb-2 p-0 text-sm leading-snug font-medium text-foreground">Notification services</legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
        {getSelectableServices(services).map(service => {
          const Icon = SERVICE_ICONS[service.id];
          const checkboxId = `${id}-${service.id}`;
          return (
            <label
              key={service.id}
              htmlFor={checkboxId}
              className={cx(
                "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2",
                "text-sm font-medium text-foreground transition-colors duration-200 ease-[ease] pointer-coarse:min-h-11",
                "hover:bg-accent hover:text-accent-foreground has-checked:border-link has-checked:bg-accent has-checked:text-accent-foreground",
              )}
            >
              <Checkbox
                id={checkboxId}
                checked={services.includes(service.id)}
                onChange={() => onToggle(service.id)}
                aria-invalid={error ? true : undefined}
              />
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {service.name}
            </label>
          );
        })}
      </div>
      <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
        Choose where alerts go. You can pick more than one.
      </p>
      {error ? (
        <p id={errorId} role="alert" className="m-0 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
};
