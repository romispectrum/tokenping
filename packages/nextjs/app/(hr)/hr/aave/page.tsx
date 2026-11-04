import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("hr");

const Dashboard = () => DashboardPage({ locale: "hr" });

export default Dashboard;
