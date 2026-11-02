import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("fr");

const Privacy = () => PrivacyPage({ locale: "fr" });

export default Privacy;
