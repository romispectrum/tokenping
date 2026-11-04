import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("el");

const Dashboard = () => DashboardPage({ locale: "el" });

export default Dashboard;
