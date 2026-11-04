import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("sr");

const Dashboard = () => DashboardPage({ locale: "sr" });

export default Dashboard;
