import { type ReactElement, createElement, useId } from "react";
import { LOGO_VIEWBOX, type LogoVariant, type SvgNode, logoNodes } from "~~/components/brand/logoArt";

/**
 * The Tokenping logo as inline SVG. A Server Component (it only uses useId), so it renders anywhere.
 *
 * - variant "primary" (default): the mark and the wordmark. "symbol": the mark alone.
 * - The mark brings its own gradient square, so one drawing works on light and dark surfaces. The wordmark follows
 *   the text colour: the foreground token, which a .dark band (or the dark theme) turns white.
 * - Size it by height and keep the width automatic: className="h-8 w-auto". The lockup needs h-7 or more (106px
 *   wide), the symbol h-8 or more; only favicons go smaller. Never stretch, rotate, shadow or animate it.
 * - className may tint the wordmark text-brand-violet or text-brand-pink, on a light marketing surface only. The
 *   mark itself is never recoloured.
 * - title is the accessible name. Pass title="" when a wrapping link already names it (aria-label="Tokenping home").
 */

type TokenpingLogoProps = {
  variant?: LogoVariant;
  className?: string;
  title?: string;
};

const toReactAttrs = (attrs: SvgNode["attrs"]) =>
  Object.fromEntries(
    Object.entries(attrs).map(([name, value]) => [
      name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()),
      value,
    ]),
  );

const toElement = (node: SvgNode, index: number): ReactElement =>
  createElement(node.tag, { key: index, ...toReactAttrs(node.attrs) }, node.children?.map(toElement));

export const TokenpingLogo = ({ variant = "primary", className, title = "Tokenping" }: TokenpingLogoProps) => {
  // useId output contains characters that are not safe inside url(#...); the counter part stays unique.
  const uid = `tp${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const titleId = `${uid}-title`;
  const named = title !== "";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={LOGO_VIEWBOX[variant]}
      className={className || undefined}
      role={named ? "img" : undefined}
      aria-labelledby={named ? titleId : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
    >
      {named ? <title id={titleId}>{title}</title> : null}
      {logoNodes(variant, `${uid}-gradient`).map(toElement)}
    </svg>
  );
};
