// @vitest-environment jsdom
/// <reference types="vite/client" />
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import type { Metadata } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_BLOG_SLUGS } from "~~/components/home/homeContent";
import { LOCALES, LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import { routePath } from "~~/i18n/routes";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { PUBLISH_EVERY_TRANSLATION, mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";

// Every translated home page (app/(<locale>)/<prefix>/page.tsx), checked the same way. A new language adds a row
// to COPY; English has its own test (app/(en)/page.test.tsx), and Czech has more in app/(cs)/cz/page.test.tsx.

type CopyRules = {
  /** The h1 names the live channels (Signal and email while Telegram is off). */
  h1Channels: RegExp;
  /** The channel badges, in order. */
  badges: readonly string[];
  /** The form of address the language's voice forbids (docs/i18n.md). */
  wrongAddress?: RegExp;
  /** Claims the language's voice forbids beyond "free": real time, instant, multi-protocol. */
  claims?: RegExp;
};

const COPY: Partial<Record<Locale, CopyRules>> = {
  cs: {
    h1Channels: /Signal a e-mail/,
    badges: ["Signal", "E-mail"],
    wrongAddress: /(?<!\p{L})(tvůj|tvoje|tvá|tvé|tvých|tebe|tobě|ti)(?!\p{L})/iu,
  },
  es: {
    h1Channels: /Signal y correo electrónico/,
    badges: ["Signal", "Correo"],
    wrongAddress: /\busted(es)?\b/i,
    claims: /en tiempo real|instantáne|multiprotocolo/i,
  },
  hi: {
    h1Channels: /Signal और ईमेल/,
    badges: ["Signal", "ईमेल"],
    // The familiar तुम and तू never appear; आप is the only address.
    wrongAddress: /(?:^|[\s"(])(?:तुम|तू|तुम्हार|तेर)(?=[\s।,.?"]|$)/u,
    claims: /री?यल[- ]?टाइम|वास्तविक समय|तुरंत अलर्ट|मल्टी[- ]?प्रोटोकॉल/u,
  },
  de: {
    h1Channels: /Signal und E-Mail/,
    badges: ["Signal", "E-Mail"],
    // Informal du throughout: no formal Sie, Ihnen or Ihr inside a sentence.
    wrongAddress: /[^.!?:\s]\s+(?:Sie|Ihnen|Ihre?[mnrs]?)\b/u,
    claims: /(?<!\p{L})echtzeit|sofortige (?:Alerts?|Benachrichtigung)|multi[- ]?protokoll/iu,
  },
  vi: {
    h1Channels: /Signal và email/,
    badges: ["Signal", "Email"],
    // bạn throughout: never the formal quý khách or the rude mày.
    wrongAddress: /quý khách|\bmày\b/iu,
    claims: /thời gian thực|tức thì|đa giao thức/iu,
  },
  fr: {
    h1Channels: /Signal et e-mail/,
    badges: ["Signal", "E-mail"],
    // vous throughout: never the familiar tu, te, toi, ton, ta, tes.
    wrongAddress: /(?<!\p{L})(?:tu|toi|ton|tes|t')(?!\p{L})/iu,
    claims: /en temps réel|instantané|multi[- ]?protocole/iu,
  },
  pt: {
    h1Channels: /Signal e e-mail/,
    badges: ["Signal", "E-mail"],
    // você throughout: never tu, te, teu, tua, contigo, nor the formal o senhor or a senhora.
    wrongAddress: /(?<!\p{L})(?:tu|teus?|tuas?|contigo|o senhor|a senhora)(?!\p{L})/iu,
    claims: /em tempo real|instantâne|multi[- ]?protocolo/iu,
  },
  it: {
    h1Channels: /Signal e email/,
    badges: ["Signal", "Email"],
    // tu throughout: never the formal Lei, Suo, Sua inside a sentence.
    wrongAddress: /[^.!?:\s]\s+(?:Lei|Suo|Sua|Suoi|Sue)\b/u,
    claims: /in tempo reale|istantane|multi[- ]?protocoll/iu,
  },
};

const TRANSLATED = LOCALES.filter(locale => locale !== "en");

const HOME_MODULES = import.meta.glob<{ default: () => Promise<ReactElement>; metadata: Metadata }>(
  "./\\([a-z]*\\)/*/page.tsx",
);

const homeModule = (locale: Locale) => {
  const key = `./(${locale})${routePath(locale, "home")}/page.tsx`;
  const load = HOME_MODULES[key];
  if (!load) throw new Error(`no home page at ${key}`);
  return load();
};

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };
const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));
vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const renderHome = async (locale: Locale) => {
  const { default: Home } = await homeModule(locale);
  return render(await Home());
};

/** Visible page text, without the JSON-LD. */
const pageText = (container: HTMLElement) => {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach(script => script.remove());
  return clone.textContent ?? "";
};

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
  // Every post published in every language, so the blog links do not depend on who has finished.
  mockPostStubs([], PUBLISH_EVERY_TRANSLATION);
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it("has copy rules for every translated home page", () => {
  expect(Object.keys(COPY).sort()).toEqual([...TRANSLATED].sort());
});

describe.each(TRANSLATED)("the %s home page", locale => {
  const home = routePath(locale, "home");
  const rules = COPY[locale] as CopyRules;

  it("has a brand-first title, its own canonical and hreflang to every language", async () => {
    const { metadata } = await homeModule(locale);
    const title = (metadata.title as { absolute: string }).absolute;

    expect(title).toMatch(/^Tokenping: /);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.alternates?.canonical).toBe(home);
    expect(metadata.alternates?.languages).toEqual({
      ...Object.fromEntries(
        LOCALES.flatMap(other => {
          const { htmlLang, regions = [] } = LOCALE_INFO[other];
          return [htmlLang, ...regions.map(({ hreflang }) => hreflang)].map(lang => [lang, routePath(other, "home")]);
        }),
      ),
      "x-default": "/",
    });
    expect(metadata.openGraph).toMatchObject({ url: home, locale: LOCALE_INFO[locale].ogLocale });
    expect(String(metadata.openGraph?.title)).not.toMatch(/Tokenping/);
  });

  it("keeps the Telegram variant of the description within 155 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await homeModule(locale);

    expect(String(metadata.description)).toContain("Telegram");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });

  it("has one h1 naming the live channels, and badges them in the language", async () => {
    await renderHome(locale);
    const headings = screen.getAllByRole("heading", { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toMatch(rules.h1Channels);
    expect(screen.getAllByText(/.+/, { selector: ".badge" }).map(badge => badge.textContent)).toEqual(rules.badges);
  });

  it("keeps the voice: its form of address, no dashes, nothing described by what it does not cost", async () => {
    const { container } = await renderHome(locale);
    const { metadata } = await homeModule(locale);
    const text = pageText(container);

    if (rules.wrongAddress) expect(text).not.toMatch(rules.wrongAddress);
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(text).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
    if (rules.claims) expect(text).not.toMatch(rules.claims);
  });

  it("points every internal link at a page in the language, its guides included", async () => {
    const { container } = await renderHome(locale);
    const hrefs = [...container.querySelectorAll("a[href]")]
      .map(link => link.getAttribute("href")!)
      .filter(href => href.startsWith("/"));

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href.startsWith(`${home}/`) || href === home, href).toBe(true);
    for (const key of HOME_BLOG_SLUGS)
      expect(container.querySelector(`a[href="${home}/blog/${POST_SLUGS[key][locale]}"]`), key).not.toBeNull();
  });

  it("describes the page, its questions and the site in JSON-LD, in the language", async () => {
    const { container } = await renderHome(locale);
    const [app, faq, site] = jsonLdBlocks(container);
    const lang = LOCALE_INFO[locale].htmlLang;

    expect(app).toMatchObject({
      "@type": "SoftwareApplication",
      url: `https://tokenping.xyz${home}`,
      inLanguage: lang,
      offers: { url: `https://tokenping.xyz${routePath(locale, "dashboard")}` },
    });
    expect(faq).toMatchObject({ "@type": "FAQPage", inLanguage: lang });
    expect(site["@graph"][1]).toMatchObject({
      "@type": "WebSite",
      inLanguage: LOCALES.map(other => LOCALE_INFO[other].htmlLang),
    });
  });
});
