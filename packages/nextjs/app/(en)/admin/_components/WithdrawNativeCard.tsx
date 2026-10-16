import { AddressField } from "~~/app/(en)/admin/_components/AddressField";
import { AdminCard, type TxPhase, loadingTextFor } from "~~/app/(en)/admin/_components/AdminCard";
import { DataList, DataRow, NoData } from "~~/app/(en)/admin/_components/DataList";
import { formatExactAmount } from "~~/app/(en)/admin/_components/adminFormat";
import type { NativeWithdrawField, NativeWithdrawForm } from "~~/app/(en)/admin/_components/adminForms";
import type { AdminTxError } from "~~/app/(en)/admin/_components/adminTxError";
import { Button, Field, Input } from "~~/components/ui";

export const NATIVE_WITHDRAW_FIELD_IDS: Record<NativeWithdrawField, string> = {
  to: "admin-withdraw-native-to",
  amountEth: "admin-withdraw-native-amount",
};

type WithdrawNativeCardProps = {
  form: NativeWithdrawForm;
  onChange: (patch: Partial<NativeWithdrawForm>) => void;
  balance: bigint | undefined;
  /** Any admin transaction is in flight. */
  isBusy: boolean;
  /** This card's transaction in flight. */
  pending?: TxPhase;
  error?: AdminTxError;
  /** The failed submit's message for the field it failed on. */
  fieldErrors?: Partial<Record<NativeWithdrawField, string>>;
  onSubmit: () => void;
};

// The amount is a plain Input, not scaffold-ui's EtherInput: its pill has no visible keyboard focus, a boundary below
// 3:1 and a 35px height, and its USD toggle is out of the tab order. The withdrawal is in ETH only, which the parser
// reads from the typed string.
export const WithdrawNativeCard = ({
  form,
  onChange,
  balance,
  isBusy,
  pending,
  error,
  fieldErrors,
  onSubmit,
}: WithdrawNativeCardProps) => (
  <AdminCard
    id="admin-withdraw-native"
    title="Withdraw ETH"
    description="Send ETH held by the contract to an address."
    current={
      <DataList className="rounded-xl bg-muted p-4">
        <DataRow label="Contract balance">
          {balance === undefined ? <NoData /> : <span className="font-data">{formatExactAmount(balance, 18)} ETH</span>}
        </DataRow>
      </DataList>
    }
    onSubmit={onSubmit}
    error={error}
    pending={pending}
    actions={
      <Button
        type="submit"
        variant="secondary"
        loading={pending !== undefined}
        loadingText={loadingTextFor(pending, "Withdrawing")}
        disabled={isBusy && pending === undefined}
      >
        Withdraw ETH
      </Button>
    }
  >
    <AddressField
      id={NATIVE_WITHDRAW_FIELD_IDS.to}
      label="Destination address"
      value={form.to}
      onChange={to => onChange({ to })}
      error={fieldErrors?.to}
    />
    <Field id={NATIVE_WITHDRAW_FIELD_IDS.amountEth} label="Amount (ETH)" error={fieldErrors?.amountEth}>
      {control => (
        <Input
          {...control}
          inputMode="decimal"
          autoComplete="off"
          className="font-data"
          value={form.amountEth}
          onChange={event => onChange({ amountEth: event.target.value })}
        />
      )}
    </Field>
  </AdminCard>
);
