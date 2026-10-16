import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("cs");

const Dashboard = () => DashboardPage({ locale: "cs" });

export default Dashboard;
