import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("es");

const Privacy = () => PrivacyPage({ locale: "es" });

export default Privacy;
