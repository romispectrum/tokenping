import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("hu");

const Dashboard = () => DashboardPage({ locale: "hu" });

export default Dashboard;
