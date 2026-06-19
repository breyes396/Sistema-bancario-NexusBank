import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const EmployeeSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarStyle = {
    width: 220,
    background: '#102b55',
    color: '#cfe0ff',
    padding: '20px 12px',
    minHeight: 'calc(100vh - 64px)'
  };
  const sectionTitle = { fontSize: 12, color: '#7fa6ea', margin: '12px 0 8px' };
  const item = { padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' };

  return (
    <aside style={sidebarStyle}>
      <nav>
        <div>
          <div style={sectionTitle}>GENERAL</div>
          <div
            style={{ ...item, background: location.pathname === '/EmployeeDashboard' ? '#0d294a' : 'transparent', color: location.pathname === '/EmployeeDashboard' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/EmployeeDashboard' ? 700 : 400 }}
            onClick={() => navigate('/EmployeeDashboard')}
          >
            Dashboard
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default EmployeeSidebar;
