import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("nl");

const Privacy = () => PrivacyPage({ locale: "nl" });

export default Privacy;
