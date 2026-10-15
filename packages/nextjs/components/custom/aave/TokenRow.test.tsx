import type { ReactNode } from "react";
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

// Rows are table rows, so they render inside the body of a table like TokenTable's.
const row = (node: ReactNode) =>
  renderMarkup(
    <table>
      <tbody>{node}</tbody>
    </table>,
  );

// Rows only ever receive tokens that passed PositionDetails' filters (a supply balance, or some debt).
describe("CollateralTokenRow", () => {
  it("renders a supplied collateral token with its rate", () => {
    const html = row(<CollateralTokenRow token={SUPPLIED_USDC} />);

    expect(html).toContain('<th scope="row"');
    expect(html).toContain(">Enabled</td>");
    expect(html).toMatchSnapshot();
  });

  it("renders a small balance that is not used as collateral", () => {
    const html = row(<CollateralTokenRow token={SUPPLIED_WETH_NOT_COLLATERAL} />);

    expect(html).toContain(">Disabled</td>");
    expect(html).toMatchSnapshot();
  });

  it("shows the supply APY with two decimals", () => {
    expect(row(<CollateralTokenRow token={SUPPLIED_AND_BORROWED_LINK} />)).toContain(">0.01%</td>");
    expect(row(<CollateralTokenRow token={{ ...SUPPLIED_USDC, supplyApy: 3.56197 }} />)).toContain(">3.56%</td>");
  });

  // Amounts are compared digit by digit: right-aligned in the data face. Rates are Satoshi tabular figures.
  it("sets the amount in the data face and the rate in tabular figures, both right-aligned", () => {
    const html = row(<CollateralTokenRow token={SUPPLIED_USDC} />);

    expect(html).toMatch(/<td class="[^"]*text-right font-data[^"]*">1,234\.56<\/td>/);
    expect(html).toMatch(/<td class="[^"]*text-right tabular-nums[^"]*">3\.46%<\/td>/);
  });
});

describe("DebtTokenRow", () => {
  it("renders variable-only debt", () => {
    expect(row(<DebtTokenRow token={VARIABLE_DEBT_DAI} />)).toMatchSnapshot();
  });

  it("renders stable-only debt", () => {
    expect(row(<DebtTokenRow token={STABLE_DEBT_USDT} />)).toMatchSnapshot();
  });

  it("renders stable and variable debt with their total", () => {
    const html = row(<DebtTokenRow token={MIXED_DEBT_GHO} />);

    expect(html).toContain(">2,001.5</td>");
    expect(html).toContain(">Stable 1.5 · Variable 2,000</td>");
    expect(html).toMatchSnapshot();
  });
});
