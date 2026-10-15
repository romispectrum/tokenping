import { PageBackground } from "~~/components/custom/PageBackground";
import { HomeHero } from "~~/components/home/HomeHero";
import { HomeObjections } from "~~/components/home/HomeObjections";
import {
  ClosingCtaSection,
  ExampleAlertSection,
  FromTheBlogSection,
  HowItWorksSection,
  LimitsSection,
  PricingSection,
  ProblemSection,
} from "~~/components/home/HomeSections";
import { getHomeDescription, getHomeTitle, softwareApplicationJsonLd } from "~~/components/home/homeContent";
import { JsonLd } from "~~/components/seo/JsonLd";
import { getAlertPlan } from "~~/services/marketing/alertPlan";
import { pageMetadata } from "~~/utils/seo";

export const metadata = pageMetadata({
  title: getHomeTitle(),
  description: getHomeDescription(),
  path: "/",
  absoluteTitle: true,
});

// Prerendered, then re-rendered at most hourly with the price cache (ALERT_PLAN_REVALIDATE_SECONDS; route config
// must be a literal).
export const revalidate = 3600;

// Proof slots (user counts, testimonials, alert stories, partner logos) stay out until real, dated proof exists
// (marketing plan §2.6). The example alert is product evidence, not proof of use.
const Home = async () => {
  // One read for the whole page: the steps, the pricing block, the objections and the JSON-LD show the same plan.
  const plan = await getAlertPlan();

  return (
    <PageBackground>
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-6 pb-24 sm:gap-8 sm:pt-8 sm:pb-16">
        <HomeHero />
        <ExampleAlertSection />
        <ProblemSection />
        <HowItWorksSection plan={plan} />
        <PricingSection plan={plan} />
        <HomeObjections plan={plan} />
        <LimitsSection />
        <FromTheBlogSection />
        <ClosingCtaSection />
      </div>
      <JsonLd data={softwareApplicationJsonLd(plan)} />
    </PageBackground>
  );
};

export default Home;
