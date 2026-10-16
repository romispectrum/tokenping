import Image from "next/image";
import type { Address } from "viem";
import { TOKEN_ICONS } from "~~/config/tokenIcons.generated";
import { tokenIconKey, tokenIconSrc } from "~~/utils/tokenIcons";

type TokenIconProps = {
  chainId: number;
  address: Address;
  symbol: string;
};

const ICON_CLASS = "size-6 shrink-0 rounded-full";

/** The first letter or digit of a symbol or name, else its first character, else "?". */
export const initialOf = (symbol: string) =>
  (symbol.match(/[A-Za-z0-9]/)?.[0] ?? symbol.trim().charAt(0)).toUpperCase() || "?";

/**
 * A 24px icon for an Aave reserve, from CoinGecko but served by this site (scripts/fetchTokenIcons.ts), so the
 * browser never contacts CoinGecko. A reserve CoinGecko had no logo for gets its initial on a muted disc. Always
 * decorative: the symbol is written next to it.
 */
export const TokenIcon = ({ chainId, address, symbol }: TokenIconProps) => {
  const icon = TOKEN_ICONS[tokenIconKey(chainId, address)];
  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className={`${ICON_CLASS} inline-flex items-center justify-center bg-muted text-xs font-medium text-muted-foreground`}
      >
        {initialOf(symbol)}
      </span>
    );
  }
  // Already a 64px WebP: the optimizer has nothing to add, and the static IPFS export has no optimizer at all.
  return <Image src={tokenIconSrc(icon)} alt="" width={24} height={24} unoptimized className={ICON_CLASS} />;
};
