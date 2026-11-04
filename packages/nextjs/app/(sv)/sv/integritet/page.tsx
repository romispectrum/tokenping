import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("sv");

const Privacy = () => PrivacyPage({ locale: "sv" });

export default Privacy;
