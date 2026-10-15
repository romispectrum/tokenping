import type { Address } from "viem";
import { AddressField } from "~~/app/admin/_components/AddressField";
import { AdminCard, type TxPhase, loadingTextFor } from "~~/app/admin/_components/AdminCard";
import { ConfirmDialog } from "~~/app/admin/_components/ConfirmDialog";
import type { NewOwnerField } from "~~/app/admin/_components/adminForms";
import type { AdminTxError } from "~~/app/admin/_components/adminTxError";
import { shortenHex, toDisplayAddress } from "~~/components/custom/aave/web3Format";
import { Button } from "~~/components/ui";

export const TRANSFER_FIELD_IDS: Record<NewOwnerField, string> = {
  newOwner: "admin-new-owner",
};

type TransferOwnershipCardProps = {
  value: string;
  onChange: (value: string) => void;
  /** Any admin transaction is in flight. */
  isBusy: boolean;
  /** This card's transaction in flight. */
  pending?: TxPhase;
  error?: AdminTxError;
  /** The failed submit's message for the field it failed on. */
  fieldErrors?: Partial<Record<NewOwnerField, string>>;
  /** Checks the address; when it is valid the page sets confirmTarget, which opens the confirm dialog. */
  onReview: () => void;
  /** The checked new owner while the confirm dialog is open. */
  confirmTarget?: Address;
  onConfirm: () => void;
  onCancelConfirm: () => void;
};

// The contract's Ownable is single step: the new owner does not accept, and this wallet loses every onlyOwner call
// as soon as the transaction confirms. So the card's button only opens a confirm dialog naming the new owner; the
// solid destructive button is the dialog's confirm, and Enter in the field opens the dialog, never the wallet.
export const TransferOwnershipCard = ({
  value,
  onChange,
  isBusy,
  pending,
  error,
  fieldErrors,
  onReview,
  confirmTarget,
  onConfirm,
  onCancelConfirm,
}: TransferOwnershipCardProps) => (
  <>
    <AdminCard
      id="admin-transfer-ownership"
      tone="destructive"
      title="Transfer ownership"
      description="Moves owner rights to another wallet in one transaction. This wallet then loses access to every action on this page."
      onSubmit={onReview}
      error={error}
      pending={pending}
      actions={
        // Outline, not solid: this opens the confirm step. text-destructive and the hover fill are important
        // because the outline variant's own text-foreground and hover:bg-accent come later in the stylesheet.
        <Button
          type="submit"
          variant="outline"
          className="text-destructive! hover:bg-destructive-subtle!"
          loading={pending !== undefined}
          loadingText={loadingTextFor(pending, "Transferring")}
          disabled={isBusy && pending === undefined}
        >
          Transfer ownership
        </Button>
      }
    >
      <AddressField
        id={TRANSFER_FIELD_IDS.newOwner}
        label="New owner address"
        value={value}
        onChange={onChange}
        error={fieldErrors?.newOwner}
      />
    </AdminCard>
    <ConfirmDialog
      id="admin-transfer-confirm"
      open={confirmTarget !== undefined}
      title={confirmTarget ? `Transfer ownership to ${shortenHex(toDisplayAddress(confirmTarget))}?` : ""}
      confirmLabel="Transfer ownership"
      cancelLabel="Keep ownership"
      onConfirm={onConfirm}
      onCancel={onCancelConfirm}
    >
      {confirmTarget ? (
        <>
          <p>
            New owner: <span className="font-data break-all text-foreground">{toDisplayAddress(confirmTarget)}</span>
          </p>
          <p>
            This wallet loses every action on this page as soon as the transaction confirms. Only the new owner can
            transfer ownership back.
          </p>
        </>
      ) : null}
    </ConfirmDialog>
  </>
);
