import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("it");

const Privacy = () => PrivacyPage({ locale: "it" });

export default Privacy;
