import { HomeHero } from "~~/components/home/HomeHero";
import { HomeObjections } from "~~/components/home/HomeObjections";
import {
  ClosingCtaSection,
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
    title: getHomeTitle(),
    description: getHomeDescription(),
    locale,
    alternates: routeAlternates("home"),
    absoluteTitle: true,
  });

// Proof slots (user counts, testimonials, alert stories, partner logos) stay out until real, dated proof exists
// (marketing plan §2.6). The example alert is product evidence, not proof of use: it is the hero's right column.
//
// Signature budget: the hero wash and the questions wash (never adjacent), two glows (the hero card and the closing
// band, never in one view), one grain card (the hero) and the closing band's grain, a divider at each of the three
// boundaries between two plain sections (none next to a wash or the dark band). Pink: the hero's primary action and
// the closing band's, the same action, screens apart.
/** The home page of one language; app/(en)/page.tsx and app/(cs)/cs/page.tsx render it. */
export const HomePage = async ({ locale }: { locale: Locale }) => {
  // One read for the whole page: the steps, the pricing block, the objections and the JSON-LD show the same plan.
  const plan = await getAlertPlan();

  return (
    <>
      <HomeHero locale={locale} />
      <ProblemSection />
      <SectionDivider />
      <HowItWorksSection plan={plan} />
      <SectionDivider />
      <PricingSection plan={plan} />
      <HomeObjections plan={plan} />
      <LimitsSection />
      <FromTheBlogSection />
      <ClosingCtaSection locale={locale} />
      <JsonLd data={softwareApplicationJsonLd(plan)} />
    </>
  );
};
