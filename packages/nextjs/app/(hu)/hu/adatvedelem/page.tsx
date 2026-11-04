import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("hu");

const Privacy = () => PrivacyPage({ locale: "hu" });

export default Privacy;
