import { formatUnits } from "viem";
import { AdminCard } from "~~/app/admin/_components/AdminCard";
import { FALLBACK_TOKEN_DECIMALS, type TokenWithdrawForm } from "~~/app/admin/_components/adminForms";

type WithdrawTokenCardProps = {
  form: TokenWithdrawForm;
  onChange: (patch: Partial<TokenWithdrawForm>) => void;
  balance: bigint | undefined;
  tokenDecimals: number | undefined;
  tokenSymbol: string | undefined;
  isBusy: boolean;
  onSubmit: () => void;
};

export const WithdrawTokenCard = ({
  form,
  onChange,
  balance,
  tokenDecimals,
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
    <input
      className="input input-bordered w-full"
      placeholder="Token address"
      value={form.tokenAddress}
      onChange={event => onChange({ tokenAddress: event.target.value })}
    />
    <input
      className="input input-bordered w-full"
      placeholder="Destination address"
      value={form.to}
      onChange={event => onChange({ to: event.target.value })}
    />
    <input
      className="input input-bordered w-full"
      placeholder={`Amount (${tokenSymbol ?? "token"})`}
      value={form.amount}
      onChange={event => onChange({ amount: event.target.value })}
    />
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy}>
      Withdraw token
    </button>
  </AdminCard>
);
