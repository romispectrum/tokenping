import { formatUnits } from "viem";
import { AdminCard } from "~~/app/admin/_components/AdminCard";
import { DecimalsHint } from "~~/app/admin/_components/DecimalsHint";
import { HexAddressInput } from "~~/app/admin/_components/HexAddressInput";
import { LabeledField } from "~~/app/admin/_components/LabeledField";
import { FALLBACK_TOKEN_DECIMALS, type TokenWithdrawForm } from "~~/app/admin/_components/adminForms";

type WithdrawTokenCardProps = {
  form: TokenWithdrawForm;
  onChange: (patch: Partial<TokenWithdrawForm>) => void;
  balance: bigint | undefined;
  tokenDecimals: number | undefined;
  isDecimalsLoading: boolean;
  tokenSymbol: string | undefined;
  isBusy: boolean;
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
  onSubmit,
}: WithdrawTokenCardProps) => (
  <AdminCard
    title="Withdraw token"
    description={
      <>
        Contract token balance:{" "}
        {balance === undefined ? "0" : formatUnits(balance, tokenDecimals ?? FALLBACK_TOKEN_DECIMALS)}{" "}
        {tokenSymbol ?? ""}
      </>
    }
  >
    <LabeledField label="Token address">
      <HexAddressInput
        placeholder="Token address"
        value={form.tokenAddress}
        onChange={tokenAddress => onChange({ tokenAddress })}
      />
    </LabeledField>
    <LabeledField label="Destination address">
      <HexAddressInput placeholder="Destination address" value={form.to} onChange={to => onChange({ to })} />
    </LabeledField>
    <LabeledField label={`Amount (${tokenSymbol ?? "token"})`}>
      <input
        className="input input-bordered w-full"
        placeholder={`Amount (${tokenSymbol ?? "token"})`}
        value={form.amount}
        onChange={event => onChange({ amount: event.target.value })}
      />
    </LabeledField>
    <DecimalsHint decimals={tokenDecimals} isLoading={isDecimalsLoading} action="Withdrawing" />
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy || tokenDecimals === undefined}>
      Withdraw token
    </button>
  </AdminCard>
);
