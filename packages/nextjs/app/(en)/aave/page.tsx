import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("en");

const Dashboard = () => DashboardPage({ locale: "en" });

export default Dashboard;
