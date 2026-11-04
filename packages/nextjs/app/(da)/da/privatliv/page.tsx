import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("da");

const Privacy = () => PrivacyPage({ locale: "da" });

export default Privacy;
