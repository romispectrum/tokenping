import { readFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "~~/i18n/locales";
import { routePath } from "~~/i18n/routes";

// Every language other than English has the same thin route files under app/(<locale>)/<prefix>/, and every language
// has a client root in i18n/client/<locale>.tsx. They are generated from the templates below
// (`yarn locale-routes`), and scripts/localeRoutes.test.ts fails when a file on disk differs from its template.
// English (app/(en)) has extra pages and stays hand-written.

export const PACKAGE_ROOT = path.resolve(__dirname, "..");

/** A web font a language's layout adds to <html> (see components/fonts). */
const LAYOUT_FONTS: Partial<Record<Locale, { name: string; module: string }>> = {
  vi: { name: "VIETNAMESE_FONT_CLASSES", module: "~~/components/fonts/vietnamese" },
};

/** The message areas client components read (i18n/client/messages.ts). */
const CLIENT_AREAS = ["alerts", "blog", "calculator", "common", "dashboard", "morpho"] as const;

/** A route's folder under the language's prefix: "/cz/ochrana-soukromi" → "ochrana-soukromi". */
const lastSegment = (locale: Locale, route: Parameters<typeof routePath>[1]) =>
  routePath(locale, route).split("/").pop() as string;

const thinPage = (component: string, metadata: string, name: string, locale: Locale, extra = "") => `
import { ${component}, ${metadata} } from "~~/components/pages/${component}";

export const metadata = ${metadata}("${locale}");
${extra}
const ${name} = () => ${component}({ locale: "${locale}" });

export default ${name};
`;

const layout = (locale: Locale) => {
  const font = LAYOUT_FONTS[locale];
  return `
import type { ReactNode } from "react";
import { ROOT_VIEWPORT, rootDocument } from "~~/components/RootDocument";
${font ? `import { ${font.name} } from "${font.module}";` : ""}
import { LocaleRoot } from "~~/i18n/client/${locale}";
import { rootMetadata } from "~~/utils/seo";

export const metadata = rootMetadata("${locale}");
export const viewport = ROOT_VIEWPORT;

const RootLayout = ({ children }: { children: ReactNode }) =>
  rootDocument({ locale: "${locale}", LocaleRoot, children${font ? `, fontClassName: ${font.name}` : ""} });

export default RootLayout;
`;
};

const blogPost = (locale: Locale) => `
import { BlogPostPage, blogPostMetadata, blogPostParams } from "~~/components/pages/BlogPostPage";

// Unknown slugs are a real 404. The pages are prerendered and re-rendered at most hourly, matching the cache of the
// alert price they show (ALERT_PLAN_REVALIDATE_SECONDS; route config must be a literal).
export const dynamicParams = false;
export const revalidate = 3600;

export const generateStaticParams = () => blogPostParams("${locale}");

type PostRouteProps = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: PostRouteProps) => blogPostMetadata("${locale}", (await params).slug);

const Post = async ({ params }: PostRouteProps) => BlogPostPage({ locale: "${locale}", slug: (await params).slug });

export default Post;
`;

const blogFeed = (locale: Locale) => `
import { getPublishedPosts } from "~~/content/blog";
import { buildRssFeed } from "~~/utils/rss";

// Built once at build time; also required for the \`yarn ipfs\` static export. Placeholder posts are left out.
export const dynamic = "force-static";

export const GET = () =>
  new Response(buildRssFeed(getPublishedPosts("${locale}"), "${locale}"), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
`;

const clientRoot = (locale: Locale) => `
"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
${CLIENT_AREAS.map(area => `import { MESSAGES as ${area} } from "~~/i18n/messages/${area}/${locale}";`).join("\n")}

const MESSAGES = { ${CLIENT_AREAS.join(", ")} };

/** The ${locale} root layout's client root: the only module that brings ${locale} strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="${locale}" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
`;

/** Every generated file of one language, by path relative to the package, before formatting. */
export const localeRouteSources = (locale: Locale): Record<string, string> => {
  const files: Record<string, string> = { [`i18n/client/${locale}.tsx`]: clientRoot(locale) };
  if (locale === DEFAULT_LOCALE) return files;

  const dir = `app/(${locale})/${lastSegment(locale, "home")}`;
  return {
    ...files,
    [`app/(${locale})/layout.tsx`]: layout(locale),
    [`${dir}/page.tsx`]: thinPage(
      "HomePage",
      "homeMetadata",
      "Home",
      locale,
      "\n// Same cadence as the English home page (route config must be a literal).\nexport const revalidate = 3600;\n",
    ),
    [`${dir}/aave/page.tsx`]: thinPage("DashboardPage", "dashboardMetadata", "Dashboard", locale),
    [`${dir}/morpho/page.tsx`]: thinPage("MorphoPage", "morphoMetadata", "Morpho", locale),
    [`${dir}/blog/page.tsx`]: thinPage("BlogIndexPage", "blogIndexMetadata", "Blog", locale),
    [`${dir}/blog/[slug]/page.tsx`]: blogPost(locale),
    [`${dir}/blog/feed.xml/route.ts`]: blogFeed(locale),
    [`${dir}/${lastSegment(locale, "privacy")}/page.tsx`]: thinPage(
      "PrivacyPage",
      "privacyMetadata",
      "Privacy",
      locale,
    ),
    [`${dir}/not-found.tsx`]: thinPage("NotFoundPage", "notFoundMetadata", "NotFound", locale),
  };
};

/** The generated files of every language, formatted with the package's Prettier config. */
export const localeRouteFiles = async (locales: readonly Locale[] = LOCALES): Promise<Record<string, string>> => {
  const entries = await Promise.all(
    locales.flatMap(locale =>
      Object.entries(localeRouteSources(locale)).map(async ([file, source]) => {
        const filepath = path.join(PACKAGE_ROOT, file);
        const options = await resolveConfig(filepath);
        const text = source.replace(/\n{3,}/g, "\n\n").trimStart();
        return [file, await format(text, { ...options, filepath })] as const;
      }),
    ),
  );
  return Object.fromEntries(entries);
};

/** What is on disk at a generated path, or undefined. */
export const readGenerated = (file: string) => {
  try {
    return readFileSync(path.join(PACKAGE_ROOT, file), "utf8");
  } catch {
    return undefined;
  }
};
