import { useEffect, useId, useRef } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { SUBTLE_DESTRUCTIVE_CLASS } from "~~/components/custom/notifications/styles";
import { Button } from "~~/components/ui";

type NotificationFormActionsProps = {
  chainName: string;
  /** Delete is offered only for a saved config. */
  canDelete: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isConfirmingDelete: boolean;
  onCancel: () => void;
  onRequestDelete: () => void;
  onKeep: () => void;
  onConfirmDelete: () => void;
};

/**
 * Save (the view's one pink primary, a submit button), Cancel, and Delete, which asks first. The confirmation
 * replaces the row, so nothing pink sits next to it; it opens with focus on "Keep alert", so Enter never deletes, and
 * "Keep alert" hands focus back to Delete.
 */
export const NotificationFormActions = ({
  chainName,
  canDelete,
  isSaving,
  isDeleting,
  isConfirmingDelete,
  onCancel,
  onRequestDelete,
  onKeep,
  onConfirmDelete,
}: NotificationFormActionsProps) => {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const keepRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(isConfirmingDelete);

  useEffect(() => {
    if (isConfirmingDelete) keepRef.current?.focus();
    // After a successful delete the Delete button is gone; the form moves focus itself.
    else if (wasConfirming.current) deleteRef.current?.focus();
    wasConfirming.current = isConfirmingDelete;
  }, [isConfirmingDelete]);

  if (isConfirmingDelete && canDelete) {
    return (
      <div
        role="group"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive-subtle p-4"
      >
        <div className="flex gap-3">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <p id={titleId} className="m-0 text-sm font-medium text-foreground">
              Delete this alert?
            </p>
            <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
              Tokenping stops sending health factor alerts for {chainName}.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={keepRef} variant="secondary" onClick={onKeep}>
            Keep alert
          </Button>
          <Button variant="destructive" loading={isDeleting} loadingText="Deleting" onClick={onConfirmDelete}>
            Delete alert
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
      {canDelete ? (
        <Button
          ref={deleteRef}
          variant="ghost"
          className={`mr-auto ${SUBTLE_DESTRUCTIVE_CLASS}`}
          onClick={onRequestDelete}
        >
          <Trash2 aria-hidden="true" />
          Delete alert
        </Button>
      ) : null}
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" loading={isSaving} loadingText="Saving">
        Save alert
      </Button>
    </div>
  );
};
