import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("es");

const Dashboard = () => DashboardPage({ locale: "es" });

export default Dashboard;
