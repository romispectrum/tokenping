import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("id");

const Dashboard = () => DashboardPage({ locale: "id" });

export default Dashboard;
