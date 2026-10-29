import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("de");

const Privacy = () => PrivacyPage({ locale: "de" });

export default Privacy;
