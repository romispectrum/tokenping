import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("pt");

const Dashboard = () => DashboardPage({ locale: "pt" });

export default Dashboard;
