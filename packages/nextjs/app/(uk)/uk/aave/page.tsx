import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("uk");

const Dashboard = () => DashboardPage({ locale: "uk" });

export default Dashboard;
