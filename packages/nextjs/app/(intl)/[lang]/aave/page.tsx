import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";
import { type LangParams, pageLocale } from "~~/i18n/localeSegment";

export const generateMetadata = async (props: LangParams) => dashboardMetadata(await pageLocale(props));

const Dashboard = async (props: LangParams) => DashboardPage({ locale: await pageLocale(props) });

export default Dashboard;
