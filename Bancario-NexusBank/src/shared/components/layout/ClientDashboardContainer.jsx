import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const ClientDashboardContainer = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-60 mt-20 md:mt-0 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
