import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("nb");

const Dashboard = () => DashboardPage({ locale: "nb" });

export default Dashboard;
