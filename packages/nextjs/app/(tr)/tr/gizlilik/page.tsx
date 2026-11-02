import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("tr");

const Privacy = () => PrivacyPage({ locale: "tr" });

export default Privacy;
