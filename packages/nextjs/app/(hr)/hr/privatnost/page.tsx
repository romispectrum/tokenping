import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("hr");

const Privacy = () => PrivacyPage({ locale: "hr" });

export default Privacy;
