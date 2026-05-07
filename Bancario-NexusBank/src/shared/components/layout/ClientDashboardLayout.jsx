import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const ClientDashboardLayout = () => {
  return (
    <div className="dashboard-bg min-h-screen text-[#1A2E52] font-sans selection:bg-[#C8A84B] selection:text-white">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 mt-20 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
