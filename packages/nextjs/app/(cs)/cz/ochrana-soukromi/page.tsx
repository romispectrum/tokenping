import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("cs");

const Privacy = () => PrivacyPage({ locale: "cs" });

export default Privacy;
