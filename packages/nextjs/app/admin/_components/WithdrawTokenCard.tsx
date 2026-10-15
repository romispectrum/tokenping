import { AddressField } from "~~/app/admin/_components/AddressField";
import { AdminCard, type TxPhase, loadingTextFor } from "~~/app/admin/_components/AdminCard";
import { DataList, DataRow, NoData } from "~~/app/admin/_components/DataList";
import { DecimalsHint } from "~~/app/admin/_components/DecimalsHint";
import { formatExactAmount } from "~~/app/admin/_components/adminFormat";
import {
  FALLBACK_TOKEN_DECIMALS,
  type TokenWithdrawField,
  type TokenWithdrawForm,
} from "~~/app/admin/_components/adminForms";
import type { AdminTxError } from "~~/app/admin/_components/adminTxError";
import { Button, Field, Input } from "~~/components/ui";

export const TOKEN_WITHDRAW_FIELD_IDS: Record<TokenWithdrawField, string> = {
  tokenAddress: "admin-withdraw-token-address",
  to: "admin-withdraw-token-to",
  amount: "admin-withdraw-token-amount",
};

type WithdrawTokenCardProps = {
  form: TokenWithdrawForm;
  onChange: (patch: Partial<TokenWithdrawForm>) => void;
  balance: bigint | undefined;
  tokenDecimals: number | undefined;
  isDecimalsLoading: boolean;
  tokenSymbol: string | undefined;
  /** Any admin transaction is in flight. */
  isBusy: boolean;
  /** This card's transaction in flight. */
  pending?: TxPhase;
  error?: AdminTxError;
  /** The failed submit's message for the field it failed on. */
  fieldErrors?: Partial<Record<TokenWithdrawField, string>>;
  onSubmit: () => void;
};

export const WithdrawTokenCard = ({
  form,
  onChange,
  balance,
  tokenDecimals,
  isDecimalsLoading,
  tokenSymbol,
  isBusy,
  pending,
  error,
  fieldErrors,
  onSubmit,
}: WithdrawTokenCardProps) => (
  <AdminCard
    id="admin-withdraw-token"
    title="Withdraw token"
    description="Send tokens held by the contract to an address."
    current={
      <DataList className="rounded-xl bg-muted p-4">
        <DataRow label="Contract balance">
          {balance === undefined ? (
            <NoData />
          ) : (
            <span className="font-data">
              {formatExactAmount(balance, tokenDecimals ?? FALLBACK_TOKEN_DECIMALS)} {tokenSymbol ?? ""}
            </span>
          )}
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
        disabled={(isBusy && pending === undefined) || tokenDecimals === undefined}
      >
        Withdraw token
      </Button>
    }
  >
    <AddressField
      id={TOKEN_WITHDRAW_FIELD_IDS.tokenAddress}
      label="Token address"
      value={form.tokenAddress}
      onChange={tokenAddress => onChange({ tokenAddress })}
      description={<DecimalsHint decimals={tokenDecimals} isLoading={isDecimalsLoading} action="Withdrawing" />}
      error={fieldErrors?.tokenAddress}
    />
    <AddressField
      id={TOKEN_WITHDRAW_FIELD_IDS.to}
      label="Destination address"
      value={form.to}
      onChange={to => onChange({ to })}
      error={fieldErrors?.to}
    />
    <Field
      id={TOKEN_WITHDRAW_FIELD_IDS.amount}
      label={`Amount (${tokenSymbol ?? "token"})`}
      error={fieldErrors?.amount}
    >
      {control => (
        <Input
          {...control}
          inputMode="decimal"
          autoComplete="off"
          className="font-data"
          value={form.amount}
          onChange={event => onChange({ amount: event.target.value })}
        />
      )}
    </Field>
  </AdminCard>
);
