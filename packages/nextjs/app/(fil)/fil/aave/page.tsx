import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("fil");

const Dashboard = () => DashboardPage({ locale: "fil" });

export default Dashboard;
