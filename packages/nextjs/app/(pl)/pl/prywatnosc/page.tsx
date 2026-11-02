import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("pl");

const Privacy = () => PrivacyPage({ locale: "pl" });

export default Privacy;
