import Image from "next/image";
import { initialOf } from "~~/components/custom/aave/TokenIcon";
import { cx } from "~~/components/ui";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { networkIconSrc } from "~~/utils/networkIcons";

type NetworkIconProps = {
  chainId: number;
  /** The network's name: the logo's alt, and the initial a network without a logo shows. */
  name: string;
  /**
   * For a logo with no written name next to it (the hero's logo strip): the logo is then the name, for assistive tech
   * and as a tooltip. The tooltip is the logo's own title: one on its list item would name the item a second time.
   * Otherwise the written name is what is read, and the logo is hidden from assistive tech.
   */
  standalone?: boolean;
  /** Sizes the disc: a `size-*` utility, 20px by default. It replaces the default rather than adding to it. */
  className?: string;
};

const DISC = "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted";

/**
 * A network's logo, from CoinGecko but served by this site (scripts/fetchNetworkIcons.ts), so the browser never
 * contacts CoinGecko. It sits on a muted disc, so a transparent mark reads on both themes and a square logo is cropped
 * round like the token icons.
 *
 * Its alt is always the network's name, never empty (SEO checkers flag empty ones), and screen readers still hear each
 * network once: next to a written name the logo is aria-hidden, standalone it is the only name. The bare name rather
 * than "Ethereum logo" leaves nothing to translate: network names are the same in both languages.
 */
export const NetworkIcon = ({ chainId, name, standalone = false, className = "size-5" }: NetworkIconProps) => {
  const icon = NETWORK_ICONS[chainId];
  if (!icon) {
    return (
      <span
        // As an image the disc is read as the name, never as its letter.
        {...(standalone ? { role: "img", "aria-label": name, title: name } : { "aria-hidden": true })}
        className={cx(DISC, "text-xs font-medium text-muted-foreground", className)}
      >
        {initialOf(name)}
      </span>
    );
  }
  // Already a 64px WebP: the optimizer has nothing to add, and the static IPFS export has no optimizer at all.
  return (
    <span aria-hidden={standalone ? undefined : true} className={cx(DISC, className)}>
      <Image
        src={networkIconSrc(icon)}
        alt={name}
        title={standalone ? name : undefined}
        width={20}
        height={20}
        unoptimized
        className="size-full"
      />
    </span>
  );
};
