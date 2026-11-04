import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("uk");

const Privacy = () => PrivacyPage({ locale: "uk" });

export default Privacy;
