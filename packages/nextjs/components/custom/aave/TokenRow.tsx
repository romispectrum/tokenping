import { formatDebtBreakdown } from "~~/components/custom/aave/positionsView";
import type { TokenPosition } from "~~/services/aave/positions";
import { formatTokenAmount } from "~~/utils/format";

// Table cells: 48px rows, hairlines between them. Amounts are compared digit by digit, so they are right-aligned in the
// data face; rates are Satoshi tabular figures, right-aligned; words stay left.
const CELL = "h-12 px-3 align-middle";
const ASSET_CELL = `${CELL} font-medium`;
const AMOUNT_CELL = `${CELL} text-right font-data whitespace-nowrap`;
const NUMBER_CELL = `${CELL} text-right tabular-nums whitespace-nowrap`;
const TEXT_CELL = `${CELL} text-muted-foreground`;

/** A token with a supply balance: asset, amount supplied, supply APY, whether it counts as collateral. */
export const CollateralTokenRow = ({ token }: { token: TokenPosition }) => (
  <tr className="border-t border-border">
    <th scope="row" className={`${ASSET_CELL} text-left`}>
      {token.symbol}
    </th>
    <td className={AMOUNT_CELL}>{formatTokenAmount(token.aTokenBalance, token.decimals)}</td>
    <td className={NUMBER_CELL}>{`${token.supplyApy.toFixed(2)}%`}</td>
    <td className={TEXT_CELL}>{token.usageAsCollateralEnabled ? "Enabled" : "Disabled"}</td>
  </tr>
);

/** A token with stable and/or variable debt: asset, total borrowed, and the split by rate type. */
export const DebtTokenRow = ({ token }: { token: TokenPosition }) => (
  <tr className="border-t border-border">
    <th scope="row" className={`${ASSET_CELL} text-left`}>
      {token.symbol}
    </th>
    <td className={AMOUNT_CELL}>{formatTokenAmount(token.stableDebt + token.variableDebt, token.decimals)}</td>
    <td className={TEXT_CELL}>{formatDebtBreakdown(token)}</td>
  </tr>
);

/** The column headers each row type fills, in order; numeric columns are right-aligned with their header. */
export const COLLATERAL_COLUMNS = [
  { label: "Asset", align: "left" },
  { label: "Supplied", align: "right" },
  { label: "Supply APY", align: "right" },
  { label: "Collateral", align: "left" },
] as const;

export const DEBT_COLUMNS = [
  { label: "Asset", align: "left" },
  { label: "Borrowed", align: "right" },
  { label: "Rate type", align: "left" },
] as const;
