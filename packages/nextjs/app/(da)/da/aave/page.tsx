import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("da");

const Dashboard = () => DashboardPage({ locale: "da" });

export default Dashboard;
