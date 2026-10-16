import { HomeHero } from "~~/components/home/HomeHero";
import { HomeObjections } from "~~/components/home/HomeObjections";
import {
  ClosingCtaSection,
  CoverageSection,
  FromTheBlogSection,
  HowItWorksSection,
  LimitsSection,
  PricingSection,
  ProblemSection,
} from "~~/components/home/HomeSections";
import { getHomeDescription, getHomeTitle, softwareApplicationJsonLd } from "~~/components/home/homeContent";
import { SectionDivider } from "~~/components/home/marketingLayout";
import { JsonLd } from "~~/components/seo/JsonLd";
import type { Locale } from "~~/i18n/locales";
import { routeAlternates } from "~~/i18n/routes";
import { getAlertPlan } from "~~/services/marketing/alertPlan";
import { pageMetadata } from "~~/utils/seo";

export const homeMetadata = (locale: Locale) =>
  pageMetadata({
    title: getHomeTitle(locale),
    description: getHomeDescription(locale),
    locale,
    alternates: routeAlternates("home"),
    absoluteTitle: true,
  });

// Proof slots (user counts, testimonials, alert stories, partner logos) stay out until real, dated proof exists
// (marketing plan §2.6). The example alert is product evidence, not proof of use: it is the hero's right column.
//
// Signature budget: the hero wash and the questions wash (never adjacent), two glows (the hero card and the closing
// band, never in one view), one grain card (the hero) and the closing band's grain, a divider at each of the four
// boundaries between two plain sections (none next to a wash or the dark band). Pink: the hero's primary action and
// the closing band's, the same action, screens apart. Each section carries one visual (the alert, the chart, the
// scale, the logo grid, the price list) and as few words as it needs around it.
/** The home page of one language; app/(en)/page.tsx and app/(cs)/cz/page.tsx render it. */
export const HomePage = async ({ locale }: { locale: Locale }) => {
  // One read for the whole page: the steps, the pricing block, the objections and the JSON-LD show the same plan.
  const plan = await getAlertPlan();

  return (
    <>
      <HomeHero locale={locale} />
      <ProblemSection locale={locale} />
      <SectionDivider />
      <HowItWorksSection plan={plan} locale={locale} />
      <SectionDivider />
      <CoverageSection locale={locale} />
      <SectionDivider />
      <PricingSection plan={plan} locale={locale} />
      <HomeObjections plan={plan} locale={locale} />
      <LimitsSection locale={locale} />
      <FromTheBlogSection locale={locale} />
      <ClosingCtaSection locale={locale} />
      <JsonLd data={softwareApplicationJsonLd(plan, locale)} />
    </>
  );
};
