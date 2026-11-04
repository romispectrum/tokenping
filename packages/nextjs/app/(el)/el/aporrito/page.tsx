import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("el");

const Privacy = () => PrivacyPage({ locale: "el" });

export default Privacy;
