import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("bg");

const Dashboard = () => DashboardPage({ locale: "bg" });

export default Dashboard;
