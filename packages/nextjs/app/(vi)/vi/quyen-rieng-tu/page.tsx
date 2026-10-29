import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("vi");

const Privacy = () => PrivacyPage({ locale: "vi" });

export default Privacy;
