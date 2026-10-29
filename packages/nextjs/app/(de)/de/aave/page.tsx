import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("de");

const Dashboard = () => DashboardPage({ locale: "de" });

export default Dashboard;
