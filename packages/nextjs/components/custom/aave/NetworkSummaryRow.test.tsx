import { describe, expect, it } from "vitest";
import { NetworkSummaryRow } from "~~/components/custom/aave/NetworkSummaryRow";
import {
  ARBITRUM_EMPTY_POSITION,
  ETHEREUM_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { renderMarkup } from "~~/utils/testing/render";

const noop = () => undefined;

describe("NetworkSummaryRow", () => {
  it("renders a selected active network with a notification bell", () => {
    expect(
      renderMarkup(<NetworkSummaryRow position={ETHEREUM_POSITION} isSelected onSelect={noop} hasNotification />),
    ).toMatchSnapshot();
  });

  it("renders an unselected active network without a bell", () => {
    expect(
      renderMarkup(
        <NetworkSummaryRow
          position={POLYGON_COLLATERAL_ONLY_POSITION}
          isSelected={false}
          onSelect={noop}
          hasNotification={false}
        />,
      ),
    ).toMatchSnapshot();
  });

  it("renders an empty network without the health factor chip", () => {
    const html = renderMarkup(
      <NetworkSummaryRow position={ARBITRUM_EMPTY_POSITION} isSelected={false} onSelect={noop} hasNotification />,
    );

    expect(html).not.toContain("HF ");
    expect(html).toMatchSnapshot();
  });
});
