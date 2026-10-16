import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("en");

const Privacy = () => PrivacyPage({ locale: "en" });

export default Privacy;
