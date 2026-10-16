import Image from "next/image";
import { initialOf } from "~~/components/custom/aave/TokenIcon";
import { cx } from "~~/components/ui";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { networkIconSrc } from "~~/utils/networkIcons";

type NetworkIconProps = {
  chainId: number;
  /** The network's name, for the initial a network without a logo shows. */
  name: string;
  /** Sizes the disc: a `size-*` utility, 20px by default. It replaces the default rather than adding to it. */
  className?: string;
};

const DISC = "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted";

/**
 * A network's logo, from CoinGecko but served by this site (scripts/fetchNetworkIcons.ts), so the browser never
 * contacts CoinGecko. It sits on a muted disc, so a transparent mark reads on both themes and a square logo is cropped
 * round like the token icons. Always decorative: the network is named next to it.
 */
export const NetworkIcon = ({ chainId, name, className = "size-5" }: NetworkIconProps) => {
  const icon = NETWORK_ICONS[chainId];
  if (!icon) {
    return (
      <span aria-hidden="true" className={cx(DISC, "text-xs font-medium text-muted-foreground", className)}>
        {initialOf(name)}
      </span>
    );
  }
  // Already a 64px WebP: the optimizer has nothing to add, and the static IPFS export has no optimizer at all.
  return (
    <span aria-hidden="true" className={cx(DISC, className)}>
      <Image src={networkIconSrc(icon)} alt="" width={20} height={20} unoptimized className="size-full" />
    </span>
  );
};
