import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("tr");

const Dashboard = () => DashboardPage({ locale: "tr" });

export default Dashboard;
