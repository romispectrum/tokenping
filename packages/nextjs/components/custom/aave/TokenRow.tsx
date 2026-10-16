import { TokenIcon } from "~~/components/custom/aave/TokenIcon";
import { formatDebtBreakdown } from "~~/components/custom/aave/positionsView";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import type { TokenPosition } from "~~/services/aave/positions";
import { formatTokenAmount } from "~~/utils/format";

// Table cells: 48px rows, hairlines between them. Amounts are compared digit by digit, so they are right-aligned in the
// data face; rates are Satoshi tabular figures, right-aligned; words stay left.
const CELL = "h-12 px-3 align-middle";
const ASSET_CELL = `${CELL} font-medium`;
const AMOUNT_CELL = `${CELL} text-right font-data whitespace-nowrap`;
const NUMBER_CELL = `${CELL} text-right tabular-nums whitespace-nowrap`;
const TEXT_CELL = `${CELL} text-muted-foreground`;

export type TokenRowProps = {
  token: TokenPosition;
  /** The market's chain: a reserve's icon is looked up by chain and address. */
  chainId: number;
};

const AssetCell = ({ token, chainId }: TokenRowProps) => (
  <th scope="row" className={`${ASSET_CELL} text-left`}>
    {/* A block flex box: an inline one would sit on the text baseline, about 2px above the row's centre. */}
    <span className="flex items-center gap-2">
      <TokenIcon chainId={chainId} address={token.asset} symbol={token.symbol} />
      {token.symbol}
    </span>
  </th>
);

/** A token with a supply balance: asset, amount supplied, supply APY, whether it counts as collateral. */
export const CollateralTokenRow = ({ token, chainId }: TokenRowProps) => {
  const t = useMessages(DASHBOARD_MESSAGES).tokens;
  return (
    <tr className="border-t border-border">
      <AssetCell token={token} chainId={chainId} />
      <td className={AMOUNT_CELL}>{formatTokenAmount(token.aTokenBalance, token.decimals)}</td>
      <td className={NUMBER_CELL}>{`${token.supplyApy.toFixed(2)}%`}</td>
      <td className={TEXT_CELL}>{token.usageAsCollateralEnabled ? t.enabled : t.disabled}</td>
    </tr>
  );
};

/** A token with stable and/or variable debt: asset, total borrowed, and the split by rate type. */
export const DebtTokenRow = ({ token, chainId }: TokenRowProps) => {
  const t = useMessages(DASHBOARD_MESSAGES).tokens;
  return (
    <tr className="border-t border-border">
      <AssetCell token={token} chainId={chainId} />
      <td className={AMOUNT_CELL}>{formatTokenAmount(token.stableDebt + token.variableDebt, token.decimals)}</td>
      <td className={TEXT_CELL}>{formatDebtBreakdown(token, t)}</td>
    </tr>
  );
};

/** A column header, by its key in the dashboard messages' `tokens`. */
export type TokenColumn = "asset" | "supplied" | "supplyApy" | "collateral" | "borrowed" | "rateType";

/** The column headers each row type fills, in order; numeric columns are right-aligned with their header. */
export const COLLATERAL_COLUMNS = [
  { column: "asset", align: "left" },
  { column: "supplied", align: "right" },
  { column: "supplyApy", align: "right" },
  { column: "collateral", align: "left" },
] as const;

export const DEBT_COLUMNS = [
  { column: "asset", align: "left" },
  { column: "borrowed", align: "right" },
  { column: "rateType", align: "left" },
] as const;
