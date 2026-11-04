import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("sl");

const Dashboard = () => DashboardPage({ locale: "sl" });

export default Dashboard;
