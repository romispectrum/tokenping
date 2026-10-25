import { isAddress } from "viem";
import type { MorphoProtocol } from "~~/config/protocols";
import type { BluePreLiquidation, MidnightCollateral, MorphoMarketParams, MorphoToken } from "~~/services/morpho/types";

// notification_configs.market_params comes back from the database as untyped JSON. The database only checks that it
// is an object, so every field is checked here before a reader trusts it: a malformed object is never read as a market.

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAddressValue = (value: unknown) => typeof value === "string" && isAddress(value, { strict: false });

/** A uint256 as a decimal string. */
const isUintString = (value: unknown) => typeof value === "string" && /^(0|[1-9]\d{0,77})$/.test(value);

const isToken = (value: unknown): value is MorphoToken =>
  isObject(value) &&
  isAddressValue(value.address) &&
  typeof value.symbol === "string" &&
  Number.isInteger(value.decimals) &&
  (value.decimals as number) >= 0 &&
  (value.decimals as number) <= 255;

const isPreLiquidation = (value: unknown): value is BluePreLiquidation =>
  isObject(value) && isAddressValue(value.address) && isUintString(value.preLltv) && isAddressValue(value.oracle);

const isCollateral = (value: unknown): value is MidnightCollateral =>
  isObject(value) && isToken(value.token) && isUintString(value.lltv) && isAddressValue(value.oracle);

const PROTOCOL_KIND = { "morpho-blue": "blue", "morpho-midnight": "midnight" } as const;

/** Whether `value` is the stored parameters of a `protocol` market, in the shape services/morpho/params.ts writes. */
export const isStoredMarketParams = (protocol: MorphoProtocol, value: unknown): value is MorphoMarketParams => {
  if (!isObject(value) || value.kind !== PROTOCOL_KIND[protocol] || !isToken(value.loanToken)) return false;
  if (value.kind === "blue") {
    return (
      isToken(value.collateralToken) &&
      isAddressValue(value.oracle) &&
      isAddressValue(value.irm) &&
      isUintString(value.lltv) &&
      Array.isArray(value.preLiquidations) &&
      value.preLiquidations.every(isPreLiquidation)
    );
  }
  return (
    Array.isArray(value.collaterals) &&
    value.collaterals.length > 0 &&
    value.collaterals.every(isCollateral) &&
    Number.isSafeInteger(value.maturity) &&
    (value.maturity as number) > 0
  );
};
