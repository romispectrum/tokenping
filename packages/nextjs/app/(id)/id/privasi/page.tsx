import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("id");

const Privacy = () => PrivacyPage({ locale: "id" });

export default Privacy;
