import { DashboardPage, dashboardMetadata } from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("ru");

const Dashboard = () => DashboardPage({ locale: "ru" });

export default Dashboard;
