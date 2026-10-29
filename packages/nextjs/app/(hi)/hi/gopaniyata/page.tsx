import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("hi");

const Privacy = () => PrivacyPage({ locale: "hi" });

export default Privacy;
