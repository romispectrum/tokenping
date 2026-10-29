import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("hi");

const Dashboard = () => DashboardPage({ locale: "hi" });

export default Dashboard;
