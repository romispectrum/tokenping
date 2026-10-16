import type { ReactElement } from "react";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddressPage from "~~/app/(en)/blockexplorer/address/[address]/page";
import TransactionPage from "~~/app/(en)/blockexplorer/transaction/[txHash]/page";

const state = vi.hoisted(() => ({ devRoutesEnabled: false }));

const NOT_FOUND = "NEXT_HTTP_ERROR_FALLBACK;404";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error(NOT_FOUND);
  },
}));
vi.mock("~~/utils/devRoutes", () => ({ areDevRoutesEnabled: () => state.devRoutesEnabled }));
vi.mock("~~/app/(en)/blockexplorer/_components/AddressComponent", () => ({ AddressComponent: () => null }));
vi.mock("~~/app/(en)/blockexplorer/transaction/_components/TransactionComp", () => ({ default: () => null }));

// Any non-zero address: the page reads the hardhat build-info directory before it looks the address up.
const ADDRESS = "0x1111111111111111111111111111111111111111";
const TX_HASH = "0xabc0000000000000000000000000000000000000000000000000000000000000";

type AsyncPage<Params> = (props: { params: Promise<Params> }) => Promise<ReactElement | null>;

const renderAddressPage = () =>
  (AddressPage as AsyncPage<{ address: string }>)({ params: Promise.resolve({ address: ADDRESS }) });
const renderTransactionPage = () =>
  (TransactionPage as unknown as AsyncPage<{ txHash: string }>)({ params: Promise.resolve({ txHash: TX_HASH }) });

/**
 * Next renders the /blockexplorer layout and these pages in parallel, so the layout's notFound() does not stop a
 * page's own work. Outside hardhat builds the address page used to reach the build-info read anyway and answer 500.
 */
describe("/blockexplorer address and transaction pages", () => {
  beforeEach(() => {
    state.devRoutesEnabled = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("answers 404 for any address outside local hardhat builds, before touching the file system", async () => {
    const existsSync = vi.spyOn(fs, "existsSync");

    await expect(renderAddressPage()).rejects.toThrow(NOT_FOUND);
    expect(existsSync).not.toHaveBeenCalled();
  });

  it("reads the hardhat build output for an address on the local chain", async () => {
    state.devRoutesEnabled = true;
    const existsSync = vi.spyOn(fs, "existsSync").mockReturnValue(false);

    // Without the hardhat artifacts this is the error that, ungated, turned every address URL into a 500.
    await expect(renderAddressPage()).rejects.toThrow(/artifacts\/build-info not found/);
    expect(existsSync).toHaveBeenCalledOnce();
  });

  it("answers 404 for any transaction outside local hardhat builds", async () => {
    await expect(renderTransactionPage()).rejects.toThrow(NOT_FOUND);
  });

  it("renders a transaction on the local chain", async () => {
    state.devRoutesEnabled = true;

    expect((await renderTransactionPage())?.props).toEqual({ txHash: TX_HASH });
  });
});
