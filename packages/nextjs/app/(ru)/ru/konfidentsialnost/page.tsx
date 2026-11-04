import { PrivacyPage, privacyMetadata } from "~~/components/pages/PrivacyPage";

export const metadata = privacyMetadata("ru");

const Privacy = () => PrivacyPage({ locale: "ru" });

export default Privacy;
