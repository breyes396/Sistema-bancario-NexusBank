import React from 'react';

const AdminSidebar = () => {
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
          <div style={{...item, background:'#0d294a', color:'#fff', fontWeight:700}}>Dashboard</div>
          <div style={{...item, marginTop:6}}>Usuarios <span style={{marginLeft:6, background:'#ff4757', padding:'2px 6px', borderRadius:10, fontSize:12, color:'#fff'}}>142</span></div>
          <div style={{...item, marginTop:6}}>Depósitos</div>
        </div>

        <div style={{marginTop:16}}>
          <div style={sectionTitle}>OPERACIONES</div>
          <div style={{...item}}>Transacciones</div>
          <div style={{...item}}>Promociones</div>
        </div>

        <div style={{marginTop:16}}>
          <div style={sectionTitle}>CONTROL</div>
          <div style={{...item}}>Pendientes <span style={{marginLeft:6, background:'#f59e0b', padding:'2px 6px', borderRadius:10, fontSize:12, color:'#0b1220'}}>3</span></div>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
