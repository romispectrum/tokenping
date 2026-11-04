import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("sv");

const Dashboard = () => DashboardPage({ locale: "sv" });

export default Dashboard;
