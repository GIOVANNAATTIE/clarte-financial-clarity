import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

const AppLayout = () => (
  <div className="flex min-h-screen">
    <AppSidebar />
    <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
