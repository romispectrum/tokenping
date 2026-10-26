# The Tokenping design system

How Tokenping looks, reads and behaves, for anyone changing the UI in `packages/nextjs`. The values live in one
file, `packages/nextjs/styles/globals.css`; this page explains how to use them. Stack: Next.js 15, Tailwind CSS 4,
DaisyUI 5, light and dark themes.

## Colour

Six brand colours. Never invent, tint or approximate another one.

| Name | Hex | Variable | Role |
|---|---|---|---|
| Pink | `#FE5FA9` | `--brand-pink` | The one expressive accent per view |
| Violet | `#9C27B0` | `--brand-violet` | Links, focus, kickers and info on light |
| Cyan | `#20FAFF` | `--brand-cyan` | Links, focus and kickers on dark; never on a light surface |
| Plum | `#4E2255` | `--brand-plum` | Text on the violet tint, lifted dark items |
| Night | `#18001C` | `--brand-night` | The only dark surface (never `#000`) |
| White | `#FFFFFF` | `--brand-white` | Light surfaces, text on dark |

Components use the **semantic tokens**, which switch with the theme. Brand utilities (`bg-brand-pink`,
`text-brand-violet`) are for brand moments on marketing pages only.

| Need | Use |
|---|---|
| Page, card, popover | `bg-background`, `bg-card`, `bg-popover` |
| Body and secondary text | `text-foreground`, `text-muted-foreground` |
| The one primary action | `Button` (pink fill, night text, 7.03:1) |
| Dark button or band on a light page | `bg-inverse text-inverse-foreground`, or a band with `className="dark bg-background"` |
| Hover and selected | `bg-accent text-accent-foreground` |
| Link | `text-link` plus an underline (plain `<a>` in prose is styled already) |
| Hairline, control boundary | `border-border`, `border-input` (3:1, for every form control) |
| Quiet fill | `bg-muted`, `bg-secondary` |
| Status | `text-success bg-success-subtle`, `text-warning bg-warning-subtle`, `text-destructive bg-destructive-subtle`, `text-info bg-info-subtle` |
| Charts | `--chart-1` to `--chart-4` in order, `--chart-5` for "Other" |
| Data | `font-data` |

Never write hex, `rgb()` or Tailwind palette colours (`gray-*`, `red-*`, `white`, `black`) in a component. The
only hex outside `globals.css`: `components/brand/themeColor.ts` (browser UI colour), `next/og` images and the logo
artwork.

### One pink per view

Exactly one solid pink element per viewport: the primary action, or one brand moment when the view has no primary
action. Everything else that is interactive uses `accent`, `ring` and `link`.

- Hover, selected, focus, open and checked states are never pink.
- Never white text on pink (2.83:1). Never pink text on a light surface.
- A second strong action is `inverse` (marketing) or `secondary` (product UI). Repeated row actions are `outline`,
  `ghost` or `link`.
- A dialog is its own view, so its confirm button may be pink. A destructive confirm is `destructive`.
- The wallet modals (RainbowKit) take `--link` as their accent: the selected wallet and the help links are violet
  on light and cyan on dark, never pink.
- Status colours are for status only, always with an icon and a word. Pink is never a status.
- The marketing glow and chart series do not count against the budget.

### Light and dark

Light is the default for every visitor. `ThemeToggle` flips between light and dark; `ThemeChoice` offers Light,
Dark and System (System follows the OS). next-themes puts the `dark` class and `data-theme="dark"` on `<html>`: the
class switches the tokens, `data-theme` switches DaisyUI. Dark surfaces step up from night with white overlays
(`card` 5.5%, `popover` 8%, `accent` 12%) and have no shadows.

A band that is always dark, such as a footer, takes `className="dark bg-background"`. `.dark` switches the tokens and
resets the text colour, so plain text, every token utility and every DaisyUI component inside follows; the band
paints its own background. Inside it, `dark:` matches (use it for surfaces); `theme-dark:` matches only when the
user's theme is dark, for UI that reports the theme, such as the toggle's icon.

## Type

- **Satoshi** for every word (`font-sans`, the default). **Geist Mono** through `font-data` for addresses, hashes,
  transaction ids and numbers compared digit by digit, nothing else.
- Both load through `next/font` in `components/RootDocument.tsx`, with `display: "swap"` and a metric-matched fallback.
  Only Satoshi's upright face is preloaded; its italic (same family) and Geist Mono load on the pages that use them.
- Weights: 400 body; 500 headings, buttons, labels, nav (`h1` to `h6` are 500 already); 700 only for data emphasis
  (table headers, totals, key numbers, kickers, the uppercase `brand` badge). Never 600.
- Marketing: `text-display` (hero h1), `text-section` (section h2), `text-lead` (sublines), `Kicker`. Product UI:
  `text-2xl` page titles, `text-sm` for UI text.
- Floor 14px for anything read as a sentence; 12px only for badges, kickers, chart ticks and legal text.
- Table header cells: `text-xs font-bold uppercase tracking-wide text-muted-foreground`.

## Shape and motion

Radius: `rounded-lg` 10px controls, `rounded-xl` 14px menus and inner panels, `rounded-2xl` 18px cards,
`rounded-3xl` 22px hero frames, `rounded-full` pills; nothing below 6px. Shadows: `shadow-card`,
`shadow-card-hover`, `shadow-frame` only, none in dark. Motion: `ease`, 150 to 250ms for UI, small lifts under
`motion-safe:`; reduced motion is honoured globally.

## Effects: marketing pages only

The grain glass card (`GrainCard`), the glow (`Glow`, `GlowWash`), the brand hairline (`BrandDivider`) and the
lavender washes belong to marketing pages: home, the blog index, the header and end areas of blog posts, privacy.
One glow and one grain surface per view. Product UI (the dashboard, alert settings, the paywall, admin) stays calm:
flat cards, no effects. There is no mascot.

## Logo

`TokenpingLogo` from `components/brand`: the white bell with two ping arcs on a rounded purple to indigo square,
and the "Tokenping" wordmark in Satoshi Medium. `variant="primary"` (lockup) or `"symbol"`. The square brings its own
background, so one drawing works on light and dark surfaces; the wordmark follows the text colour (white in a dark
band). Size by height with `w-auto`: the lockup `h-7` (106px wide) or more, the symbol `h-8` or more; only favicons
go smaller. A home link carries the name (`aria-label="Tokenping home"`) and the logo gets `title=""`. Never stretch,
rotate, recolour the square, shadow or animate it; the wordmark may take `text-brand-violet` or `text-brand-pink` on
a light marketing surface. The square's gradient is logo artwork and does not count as an accent. Clear space: half
the lockup height, a quarter of the symbol height. The favicon, the PNG icons and the social cards are generated
from the same artwork (`components/brand/logoArt.ts`). `app/favicon.ico` (16, 32 and 48px, for Safari and search
results) is the one static copy: after changing the artwork, rebuild it from `/logo.png` with
`magick logo.png -filter Lanczos -define icon:auto-resize=48,32,16 app/favicon.ico`.

## Voice

- No em dashes or en dashes anywhere: UI strings, content, metadata, comments. Use a comma, a colon, a full stop or
  a plain hyphen.
- Sentence case for every label. Buttons start with a verb and name the object ("Save alert", "Connect wallet").
- Links name their destination; never "Learn more" or "Click here".
- Loading labels have no trailing dots: "Saving", "Processing", "Waiting for your wallet".
- Plain words where money or keys are involved; no hype words; never invent facts, names, prices or metrics.
- Never "free" (nor "zdarma" or "bezplatný" in Czech, nor "gratis" or "gratuito" in Spanish), anywhere: copy,
  articles, metadata, README. Say what alerts cost and leave it there; where the point is that looking needs no
  payment, say exactly that ("looking at your positions needs no payment", "prohlížení pozic nevyžaduje platbu", "ver
  tus posiciones no requiere pago"). For other tools: "costs nothing", "at no charge", "a no-cost tier" ("no cuesta
  nada", "sin comisión"). The blog's content lint rejects the word.

## Primitives

`components/ui` (import from `~~/components/ui`). They are built on DaisyUI classes plus the token utilities, and
each has tests next to it.

| Component | Notes |
|---|---|
| `Button`, `buttonClasses()` | Variants `default` (the pink primary), `inverse`, `secondary`, `outline`, `ghost`, `link`, `destructive`; sizes `sm`, `default`, `lg`, `icon`. Pending work is `loading` plus `loadingText`, never `disabled`; disabled is the variant at half opacity. A link that looks like a button is `<Link className={buttonClasses(...)}>`. |
| `Card` and parts | Flat by default; `marketing` adds `shadow-card`. Never nest cards. |
| `Badge`, `badgeClasses()` | `neutral`, `brand`, `success`, `warning`, `info`, `destructive`, `pink`. |
| `Field` | Visible label, description, error and "(optional)", wired with `aria-describedby` and `aria-invalid`. Wraps `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`. `orientation="horizontal"` (checkbox and switch rows) makes the whole row the label, 44px on touch. The error is an alert; `liveError={false}` keeps it linked but quiet, for fields checked on every keystroke or forms whose error summary already announces. |
| `Alert`, `LiveRegion` | Status tint plus icon; a message that appears after an action goes in a `LiveRegion` that is already mounted. |
| `Skeleton`, `Spinner`, `EmptyState` | Loading and empty states. |
| `Kicker`, `SectionHeader` | The one heading formula. |
| `GrainCard`, `Glow`, `GlowWash`, `BrandDivider` | Marketing pages only. |
| `ThemeToggle`, `ThemeChoice` | `ThemeToggle` flips light and dark (top bar); `ThemeChoice` offers Light, Dark and System (footer, settings). |
| `LanguageSwitch` | The language menu in the header: a disclosure with one plain link per language (each language has its own root layout, so switching is a full page load). Import it from `~~/components/ui/LanguageSwitch`; the index does not re-export it. See [i18n.md](i18n.md). |

DaisyUI components used directly (`btn`, `input`, `checkbox`, `toggle`, `badge`, `menu`, `card-title`, `table` ...)
take their colours from the tokens and follow the same focus, boundary, checked and weight rules (500 for titles and
legends, 700 for table headers and stat values), so the Scaffold-ETH screens match.

## Accessibility

- WCAG AA: 4.5:1 for text, 3:1 for control boundaries and focus rings. Every token pair in `globals.css` passes in
  both themes; re-check them after changing a token.
- Focus is always visible: a 2px outline in `--ring`.
- Every field has a visible label; status changes are announced with `aria-live` or `role="status"`.
- Touch targets are at least 44px on touch screens (`pointer-coarse:min-h-11`, plus `pointer-coarse:min-w-11` on
  icon-only controls).
- Icons are lucide-react, `size-4` in controls and `size-5` or `size-6` with `strokeWidth={1.5}` in content;
  decorative icons are `aria-hidden`, icon-only buttons have an `aria-label`.
- No `<img>` has an empty alt (SEO checkers flag one). A logo beside its written name (`NetworkIcon`, `TokenIcon`)
  takes the name as alt and is `aria-hidden`, so the name is read once; a logo on its own (`NetworkIcon standalone`,
  the hero's network strip) is the name, in its alt and as a hover `title`.
