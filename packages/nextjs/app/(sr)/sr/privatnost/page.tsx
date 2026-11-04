import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("sr");

const Privacy = () => PrivacyPage({ locale: "sr" });

export default Privacy;
