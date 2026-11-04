import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("nb");

const Privacy = () => PrivacyPage({ locale: "nb" });

export default Privacy;
