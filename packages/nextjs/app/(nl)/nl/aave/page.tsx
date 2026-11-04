import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("nl");

const Dashboard = () => DashboardPage({ locale: "nl" });

export default Dashboard;
