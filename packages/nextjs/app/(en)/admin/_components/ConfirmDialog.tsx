"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import { Button } from "~~/components/ui";

type ConfirmDialogProps = {
  /** Unique on the page: the title and description ids are derived from it. */
  id: string;
  open: boolean;
  /** A question naming the object: "Transfer ownership to 0x1234...abcd?" */
  title: string;
  /** The consequence: what changes and whether it can be undone. */
  children: ReactNode;
  /** Repeats the action: "Transfer ownership". */
  confirmLabel: string;
  /** Names what the owner keeps: "Keep ownership". */
  cancelLabel: string;
  onConfirm: () => void;
  /** Cancel, Escape, or the dialog closing any other way. */
  onCancel: () => void;
};

/**
 * The confirm step of an irreversible action: a modal alert dialog (native <dialog>, so the page behind is inert)
 * with the consequence, a secondary keep button and the solid destructive confirm. Focus starts on the keep button,
 * so Enter never confirms by accident, and returns where it was when the dialog closes. Escape cancels; a click on
 * the scrim does nothing, so the owner always chooses explicitly.
 */
export const ConfirmDialog = ({
  id,
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  // Before paint: the content unmounts in the same render that closes the dialog, so an empty box never shows.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    // Closed by Escape while the page still has it open: report the cancel.
    if (open) onCancel();
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  };

  return (
    <dialog
      id={id}
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={handleClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-frame backdrop:bg-brand-night/40 dark:backdrop:bg-brand-night/70"
    >
      {open ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 id={titleId} className="m-0 text-lg leading-snug font-medium break-words text-foreground">
              {title}
            </h2>
            <div id={descriptionId} className="flex flex-col gap-2 text-sm text-muted-foreground [&_p]:m-0">
              {children}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
};
