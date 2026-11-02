import { HomePage, homeMetadata } from "~~/components/pages/HomePage";

export const metadata = homeMetadata("pt");

// Same cadence as the English home page (route config must be a literal).
export const revalidate = 3600;

const Home = () => HomePage({ locale: "pt" });

export default Home;
