import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getReversalRequests } from '../../../utils/reversalRequests.js';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingReversions, setPendingReversions] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const sidebarStyle = {
    width: 220,
    background: '#102b55',
    color: '#cfe0ff',
    padding: '20px 12px',
    minHeight: 'calc(100vh - 64px)'
  };
  const sectionTitle = { fontSize: 12, color: '#7fa6ea', margin: '12px 0 8px' };
  const item = { padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' };

  useEffect(() => {
    const load = () => {
      const pending = getReversalRequests().filter((item) => String(item.status || '').toUpperCase() === 'PENDING').length;
      setPendingReversions(pending);
    };

    const loadRequests = async () => {
      try {
        const response = await adminDashboardService.getPendingAccountRequests();
        const data = response?.data?.accountRequests || response?.data || response || [];
        setPendingRequestsCount(Array.isArray(data) ? data.length : 0);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    load();
    loadRequests();
    window.addEventListener('nexusbank-reversals-updated', load);
    window.addEventListener('storage', load);

    return () => {
      window.removeEventListener('nexusbank-reversals-updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  return (
    <aside className="admin-sidebar" style={sidebarStyle}>
      <nav>
        <div>
          <div style={sectionTitle}>GENERAL</div>
          <div 
            style={{...item, background: location.pathname === '/AdminDashboard' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard')}
          >
            Dashboard
          </div>
          <div 
            style={{...item, marginTop:6, background: location.pathname === '/AdminDashboard/users' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/users' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/users' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/users')}
          >
            Usuarios
          </div>
          <div 
            style={{...item, marginTop:6, background: location.pathname === '/AdminDashboard/employees' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/employees' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/employees' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/employees')}
          >
            Empleados
          </div>
        </div>

        <div style={{marginTop:16}}>
          <div style={sectionTitle}>OPERACIONES</div>
          <div 
            style={{...item, background: location.pathname === '/AdminDashboard/global-transactions' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/global-transactions' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/global-transactions' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/global-transactions')}
          >
            Transacciones globales
          </div>
          <div 
            style={{...item, background: location.pathname === '/AdminDashboard/ranking' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/ranking' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/ranking' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/ranking')}
          >
            Ranking de usuarios
          </div>
          <div 
            style={{...item, background: location.pathname === '/AdminDashboard/promotions' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/promotions' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/promotions' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/promotions')}
          >
            Promociones
          </div>
        </div>

        <div style={{marginTop:16}}>
          <div style={sectionTitle}>CONTROL</div>
          <div 
            style={{...item, background: location.pathname === '/AdminDashboard/requests' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/requests' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/requests' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/requests')}
          >
            Pendientes <span style={{marginLeft:6, background:'#f59e0b', padding:'2px 6px', borderRadius:10, fontSize:12, color:'#0b1220'}}>{pendingRequestsCount}</span>
          </div>
          <div 
            style={{...item, background: location.pathname === '/AdminDashboard/control-accounts' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/control-accounts' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/control-accounts' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/control-accounts')}
          >
            Control de cuentas
          </div>
          <div 
            style={{...item, marginTop:6, background: location.pathname === '/AdminDashboard/reversions' ? '#0d294a' : 'transparent', color: location.pathname === '/AdminDashboard/reversions' ? '#fff' : '#cfe0ff', fontWeight: location.pathname === '/AdminDashboard/reversions' ? 700 : 400}}
            onClick={() => navigate('/AdminDashboard/reversions')}
          >
            Reversiones
            <span style={{marginLeft:6, background:'#f59e0b', padding:'2px 6px', borderRadius:10, fontSize:12, color:'#0b1220'}}>{pendingReversions}</span>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
