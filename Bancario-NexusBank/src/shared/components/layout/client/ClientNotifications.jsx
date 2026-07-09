import React, { useEffect, useRef, useState } from 'react';
import { notificationService } from '../../../api/notification.service.js';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';

const ClientNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  

  const load = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications();
      setList(res.data || []);
    } catch (err) {
      console.error('Error loading notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Load once on mount (no polling)
    load();
    return;
  }, []);

  useEffect(() => {
    const onDoc = (e) => { 
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); 
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setList(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginRight: 12 }}>
      <button
        onClick={async () => { setIsOpen(!isOpen); if (!isOpen) await load(); }}
        className="relative p-2 text-gray-500 hover:text-[#2D5899] transition bg-white/50 rounded-full shadow-sm hover-lift flex items-center justify-center"
        title="Notificaciones"
      >
        <FaBell className="w-5 h-5 text-gray-500 hover:text-[#2D5899]" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, background: '#0b2b52', color: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(2,8,18,0.3)', zIndex: 60, padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontWeight: 700 }}>Notificaciones</div>
            <button onClick={() => { setIsOpen(false); navigate('/clientdashboard/notifications'); }} style={{ background: 'transparent', border: 'none', color: '#9fb3d6', cursor: 'pointer' }}>Ver todas</button>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 16 }}>Cargando...</div>
            ) : list.filter(n => !n.read).length === 0 ? (
              <div style={{ padding: 16 }}>No tienes notificaciones nuevas.</div>
            ) : (
              list.filter(n => !n.read).slice(0, 8).map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#9fb3d6' }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: '#6b8db0', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleMarkRead(n.id)} 
                      style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                    >
                      Marcar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientNotifications;
