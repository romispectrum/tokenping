// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressChip } from "~~/components/custom/aave/AddressChip";
import { LocaleProvider } from "~~/i18n/LocaleProvider";

const ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const announcement = () => screen.getByRole("status").textContent;

describe("AddressChip", () => {
  it("shows the short checksummed address in the data face and names the full one", () => {
    render(<AddressChip address={ADDRESS.toLowerCase()} label="Wallet" />);

    const short = screen.getByText("0xd8dA...6045");
    expect(short.className).toContain("font-data");
    expect(short.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText(`Wallet: ${ADDRESS}`).className).toBe("sr-only");
    expect(screen.getByTitle(ADDRESS)).toBeDefined();
  });

  it("copies the full checksummed address and announces it, then resets", async () => {
    render(<AddressChip address={ADDRESS.toLowerCase()} label="Wallet" />);
    expect(announcement()).toBe("");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: `Copy wallet ${ADDRESS}` })));

    expect(writeText).toHaveBeenCalledWith(ADDRESS);
    expect(announcement()).toBe("Address copied");
    await act(async () => vi.advanceTimersByTime(2_000));
    expect(announcement()).toBe("");
  });

  it("says how to copy by hand when the clipboard refuses", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<AddressChip address={ADDRESS} />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: `Copy address ${ADDRESS}` })));

    expect(announcement()).toBe("Could not copy. Select the address and copy it manually.");
  });
});

describe("AddressChip in Czech", () => {
  const renderCzech = () =>
    render(
      <LocaleProvider locale="cs">
        <AddressChip address={ADDRESS.toLowerCase()} label="Peněženka" />
      </LocaleProvider>,
    );

  it("names the copy button and announces the copy in Czech", async () => {
    renderCzech();

    expect(screen.getByText(`Peněženka: ${ADDRESS}`)).toBeDefined();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: `Zkopírovat adresu ${ADDRESS}` }));
    });
    expect(announcement()).toBe("Adresa zkopírována");
  });

  it("says in Czech when the copy failed", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    renderCzech();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: `Zkopírovat adresu ${ADDRESS}` }));
    });
    expect(announcement()).toBe("Nepodařilo se zkopírovat. Označte adresu a zkopírujte ji ručně.");
  });
});
