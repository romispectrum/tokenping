import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("pl");

const Dashboard = () => DashboardPage({ locale: "pl" });

export default Dashboard;
