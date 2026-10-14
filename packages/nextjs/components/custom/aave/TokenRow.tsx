import { formatDebtBreakdown } from "~~/components/custom/aave/positionsView";
import type { TokenPosition } from "~~/services/aave/positions";
import { formatTokenAmount } from "~~/utils/format";

type TokenRowProps = {
  symbol: string;
  subtitle: string;
  amount: string;
  caption: string;
  /** Tailwind gradient stops for the symbol avatar. */
  avatarGradient: string;
  amountColor: string;
};

export const TokenRow = ({ symbol, subtitle, amount, caption, avatarGradient, amountColor }: TokenRowProps) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-base-300 hover:bg-base-200 dark:border-white/5 dark:hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}
      >
        {symbol.slice(0, 2)}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm text-base-content dark:text-white truncate">{symbol}</p>
        <p className="text-[10px] text-base-content/60 dark:text-gray-500 leading-tight">{subtitle}</p>
      </div>
    </div>

    <div className="text-right shrink-0">
      <p className={`font-semibold ${amountColor}`}>{amount}</p>
      <p className="text-[10px] text-base-content/60 dark:text-gray-500">{caption}</p>
    </div>
  </div>
);

/** For tokens with a supply balance. */
export const CollateralTokenRow = ({ token }: { token: TokenPosition }) => (
  <TokenRow
    symbol={token.symbol}
    subtitle={token.usageAsCollateralEnabled ? "Collateral enabled" : "Collateral disabled"}
    amount={formatTokenAmount(token.aTokenBalance, token.decimals)}
    caption={`${token.supplyApy.toFixed(2)}% APY`}
    avatarGradient="from-emerald-500 to-teal-600"
    amountColor="text-emerald-600 dark:text-emerald-400"
  />
);

/** For tokens with stable and/or variable debt. */
export const DebtTokenRow = ({ token }: { token: TokenPosition }) => (
  <TokenRow
    symbol={token.symbol}
    subtitle={formatDebtBreakdown(token)}
    amount={formatTokenAmount(token.stableDebt + token.variableDebt, token.decimals)}
    caption="Borrowed"
    avatarGradient="from-red-500 to-rose-600"
    amountColor="text-red-600 dark:text-red-400"
  />
);
