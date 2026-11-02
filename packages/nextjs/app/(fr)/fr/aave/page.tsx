import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("fr");

const Dashboard = () => DashboardPage({ locale: "fr" });

export default Dashboard;
