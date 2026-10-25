import type { Hex } from "viem";
import { shortenHex } from "~~/components/custom/aave/web3Format";
import type { MorphoPosition } from "~~/services/morpho/positions";
import type { MorphoMarketParams, MorphoReading } from "~~/services/morpho/types";
import { formatTokenAmount } from "~~/utils/format";
import { formatHealthFactor } from "~~/utils/healthFactor";

// What the Morpho dashboard shows of a position, kept out of the components so it is testable on its own. Numbers keep
// the app's own format, as on /aave.

const PERCENT = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 });

/** "OETH/USDC"; a Midnight market's collaterals joined with "+" ("sUSDe+savUSD/USDC"). */
export const pairName = (params: MorphoMarketParams) =>
  params.kind === "blue"
    ? `${params.collateralToken.symbol}/${params.loanToken.symbol}`
    : `${params.collaterals.map(({ token }) => token.symbol).join("+")}/${params.loanToken.symbol}`;

/**
 * The market's name in the alert form and the paywall: "Base (OETH/USDC)", like an Aave V4 Spoke's "Ethereum (V4
 * Lido)". A market that could not be read shows its short id.
 */
export const marketName = ({ chain, params, marketId }: Pick<MorphoPosition, "chain" | "params" | "marketId">) =>
  `${chain.name} (${params ? pairName(params) : shortenHex(marketId as Hex)})`;

/** "86%"; a Midnight market lists each collateral's, lowest first: "86%, 91.5%". */
export const lltvText = (params: MorphoMarketParams) => {
  const lltvs = params.kind === "blue" ? [params.lltv] : params.collaterals.map(({ lltv }) => lltv);
  return [...new Set(lltvs)]
    .map(lltv => Number(lltv) / 1e18)
    .sort((a, b) => a - b)
    .map(value => PERCENT.format(value))
    .join(", ");
};

/** The share of the collateral's value that is borrowed, or null without collateral to compare with. */
export const ltvText = ({ debt, collateralValue }: MorphoReading) =>
  collateralValue > 0n ? PERCENT.format(Number((debt * 10_000n) / collateralValue) / 10_000) : null;

/** The health factor as HealthFactorBadge reads it: two decimals, or "∞" without debt. */
export const healthFactorText = ({ healthFactor }: MorphoReading) => formatHealthFactor(healthFactor);

export const hasDebt = (reading: MorphoReading | null | undefined) => !!reading && reading.debt > 0n;

/** "55,113.36 USDC": an amount of the market's loan token. */
export const loanAmount = (amount: bigint, params: MorphoMarketParams) =>
  `${formatTokenAmount(amount, params.loanToken.decimals)} ${params.loanToken.symbol}`;

/** How far a Midnight loan is from maturity at the reading's block: whole days, or whole hours in the last day. */
export const maturityCountdown = (maturity: number, now: number) => {
  const seconds = maturity - now;
  if (seconds <= 0) return { matured: true, days: 0, hours: 0 } as const;
  return {
    matured: false,
    days: Math.floor(seconds / 86_400),
    hours: Math.max(1, Math.floor(seconds / 3600)),
  } as const;
};

/** The maturity as an ISO day, for formatLongDate. */
export const maturityDay = (maturity: number) => new Date(maturity * 1000).toISOString().slice(0, 10);
