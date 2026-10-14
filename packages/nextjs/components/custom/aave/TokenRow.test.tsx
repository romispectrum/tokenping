import { describe, expect, it } from "vitest";
import { CollateralTokenRow, DebtTokenRow } from "~~/components/custom/aave/TokenRow";
import {
  MIXED_DEBT_GHO,
  STABLE_DEBT_USDT,
  SUPPLIED_AND_BORROWED_LINK,
  SUPPLIED_USDC,
  SUPPLIED_WETH_NOT_COLLATERAL,
  VARIABLE_DEBT_DAI,
} from "~~/components/custom/aave/__fixtures__/positions";
import { renderMarkup } from "~~/utils/testing/render";

// Rows only ever receive tokens that passed PositionDetails' filters (a supply balance, or some debt).
describe("CollateralTokenRow", () => {
  it("renders a supplied collateral token with its rate", () => {
    expect(renderMarkup(<CollateralTokenRow token={SUPPLIED_USDC} />)).toMatchSnapshot();
  });

  it("renders a small balance that is not used as collateral", () => {
    expect(renderMarkup(<CollateralTokenRow token={SUPPLIED_WETH_NOT_COLLATERAL} />)).toMatchSnapshot();
  });

  it("labels the supply rate as APY", () => {
    // BUG(B1.4): liquidityRate is an APR but the row labels it APY.
    expect(renderMarkup(<CollateralTokenRow token={SUPPLIED_AND_BORROWED_LINK} />)).toContain(">0.01% APY</p>");
  });
});

describe("DebtTokenRow", () => {
  it("renders variable-only debt", () => {
    expect(renderMarkup(<DebtTokenRow token={VARIABLE_DEBT_DAI} />)).toMatchSnapshot();
  });

  it("renders stable-only debt", () => {
    expect(renderMarkup(<DebtTokenRow token={STABLE_DEBT_USDT} />)).toMatchSnapshot();
  });

  it("renders stable and variable debt with their total", () => {
    expect(renderMarkup(<DebtTokenRow token={MIXED_DEBT_GHO} />)).toMatchSnapshot();
  });
});
