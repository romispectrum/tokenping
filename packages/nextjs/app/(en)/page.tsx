import { HomePage, homeMetadata } from "~~/components/pages/HomePage";

export const metadata = homeMetadata("en");

// Prerendered, then re-rendered at most hourly with the price cache (ALERT_PLAN_REVALIDATE_SECONDS; route config
// must be a literal).
export const revalidate = 3600;

const Home = () => HomePage({ locale: "en" });

export default Home;
