import { type ReactElement, createElement, useId } from "react";
import {
  LOGO_VIEWBOX,
  type LogoArt,
  type LogoVariant,
  SOLID_DEFAULT_COLOR,
  type SvgNode,
  logoNodes,
} from "~~/components/brand/logoArt";

/**
 * The Tokenping logo as inline SVG. A Server Component (it only uses useId), so it renders anywhere.
 *
 * - variant "primary" (default): the bell and the wordmark. "symbol": the bell alone.
 * - tone names the surface the logo sits on. "auto" (default) follows the nearest .dark class (the page theme or a
 *   dark band): solid art on light, outline art on dark. "light" forces the solid art, "dark" the outline art, for a
 *   surface that cannot carry the .dark class (a photo).
 * - Size it by height and keep the width automatic: className="h-8 w-auto". The lockup needs h-7 or more (100px
 *   wide), the symbol h-12 or more; only favicons go smaller. Never stretch, rotate, shadow or animate it.
 * - The solid art is black and follows text colour, so className may tint it text-brand-violet or text-brand-pink,
 *   on a light marketing surface only. The outline art is never recoloured.
 * - title is the accessible name. Pass title="" when a wrapping link already names it (aria-label="Tokenping home").
 * - With tone "auto", do not pass display utilities (block, flex) in className: they fight the dark:hidden pair.
 *   Wrap the logo in an element instead.
 */

export type TokenpingLogoTone = "auto" | "light" | "dark";

type TokenpingLogoProps = {
  variant?: LogoVariant;
  tone?: TokenpingLogoTone;
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

type LogoSvgProps = {
  variant: LogoVariant;
  art: LogoArt;
  className: string;
  title: string;
  /** Unique per instance and art, so several logos can share a page. */
  idBase: string;
};

const LogoSvg = ({ variant, art, className, title, idBase }: LogoSvgProps) => {
  const titleId = `${idBase}-title`;
  const named = title !== "";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={LOGO_VIEWBOX[variant][art]}
      // A presentation attribute: any text colour class on the element overrides it.
      color={art === "solid" ? SOLID_DEFAULT_COLOR : undefined}
      className={className || undefined}
      role={named ? "img" : undefined}
      aria-labelledby={named ? titleId : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
      data-art={art}
    >
      {named ? <title id={titleId}>{title}</title> : null}
      {logoNodes(variant, art, `${idBase}-mask`).map(toElement)}
    </svg>
  );
};

export const TokenpingLogo = ({
  variant = "primary",
  tone = "auto",
  className = "",
  title = "Tokenping",
}: TokenpingLogoProps) => {
  // useId output contains characters that are not safe inside url(#...); the counter part stays unique.
  const uid = `tp${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svg = (art: LogoArt, toneClass = "") => (
    <LogoSvg
      variant={variant}
      art={art}
      className={[toneClass, className].filter(Boolean).join(" ")}
      title={title}
      idBase={`${uid}-${art}`}
    />
  );

  if (tone === "light") return svg("solid");
  if (tone === "dark") return svg("outline");
  return (
    <>
      {svg("solid", "dark:hidden")}
      {svg("outline", "hidden dark:block")}
    </>
  );
};
