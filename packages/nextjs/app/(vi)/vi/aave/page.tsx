import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("vi");

const Dashboard = () => DashboardPage({ locale: "vi" });

export default Dashboard;
