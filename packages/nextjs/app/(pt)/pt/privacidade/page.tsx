import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("pt");

const Privacy = () => PrivacyPage({ locale: "pt" });

export default Privacy;
