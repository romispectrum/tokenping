import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("ro");

const Dashboard = () => DashboardPage({ locale: "ro" });

export default Dashboard;
