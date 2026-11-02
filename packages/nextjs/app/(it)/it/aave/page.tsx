import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("it");

const Dashboard = () => DashboardPage({ locale: "it" });

export default Dashboard;
