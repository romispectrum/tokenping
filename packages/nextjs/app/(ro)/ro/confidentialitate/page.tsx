import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("ro");

const Privacy = () => PrivacyPage({ locale: "ro" });

export default Privacy;
