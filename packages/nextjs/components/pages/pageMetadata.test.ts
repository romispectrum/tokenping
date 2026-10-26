import type { Metadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALES, type Locale } from "~~/i18n/locales";

// Every page's <title> and meta description, in every language, within what a search result shows: 60 and 155
// characters. Measured with Telegram on, the longest channel list ("Signal, Telegram y correo electrónico").

type MetadataBuilder = (locale: Locale) => Metadata;

const loadBuilders = async (): Promise<Record<string, MetadataBuilder>> => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
  const [home, dashboard, morpho, blog, privacy] = await Promise.all([
    import("~~/components/pages/HomePage"),
    import("~~/components/pages/DashboardPage"),
    import("~~/components/pages/MorphoPage"),
    import("~~/components/pages/BlogIndexPage"),
    import("~~/components/pages/PrivacyPage"),
  ]);
  return {
    home: home.homeMetadata,
    dashboard: dashboard.dashboardMetadata,
    morpho: morpho.morphoMetadata,
    blog: blog.blogIndexMetadata,
    privacy: privacy.privacyMetadata,
  };
};

/** The <title> as the browser shows it: an absolute title, or the template's "%s | Tokenping". */
const shownTitle = ({ title }: Metadata) =>
  typeof title === "string" ? `${title} | Tokenping` : (title as { absolute: string }).absolute;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("page metadata", () => {
  it.each(LOCALES)("keeps every %s page's title within 60 and description within 155 characters", async locale => {
    for (const [page, build] of Object.entries(await loadBuilders())) {
      const metadata = build(locale);
      const title = shownTitle(metadata);
      const description = String(metadata.description);

      expect(title.length, `${page}: ${title}`).toBeLessThanOrEqual(60);
      expect(description.length, `${page}: ${description}`).toBeLessThanOrEqual(155);
    }
  });
});
