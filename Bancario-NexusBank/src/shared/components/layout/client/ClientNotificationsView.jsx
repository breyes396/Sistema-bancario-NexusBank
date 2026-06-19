import React, { useState, useEffect } from 'react';
import { notificationService } from '../../../api/notification.service.js';
import '../../../../styles/adminDashboard.css';

const ClientNotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getMyNotifications();
      const notificationsData = response.data || [];
      
      const formattedNotifications = notificationsData.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        date: new Date(notif.createdAt).toLocaleString(),
        url: notif.url,
        raw: notif
      }));

      setNotifications(formattedNotifications.sort((a, b) => new Date(b.raw.createdAt) - new Date(a.raw.createdAt)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    const searchStr = `${n.title} ${n.message}`.toLowerCase();
    const matchSearch = searchStr.includes(searchTerm.toLowerCase());
    
    let matchStatus = true;
    if (filterStatus === 'LEIDAS') matchStatus = n.read === true;
    if (filterStatus === 'NO_LEIDAS') matchStatus = n.read === false;
    
    return matchSearch && matchStatus;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1A2E52', marginBottom: '10px' }}>
            Mis Notificaciones
          </h1>
          <p style={{ color: '#666' }}>Historial de todas tus notificaciones</p>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2D5899' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>No leídas</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.unread}</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Leídas</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.read}</div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              minWidth: '150px'
            }}
          >
            <option value="TODOS">Todas</option>
            <option value="NO_LEIDAS">No leídas</option>
            <option value="LEIDAS">Leídas</option>
          </select>
        </div>

        {/* Lista de notificaciones */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              Cargando notificaciones...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No hay notificaciones
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notif, index) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '20px',
                    borderBottom: index !== filteredNotifications.length - 1 ? '1px solid #eee' : 'none',
                    background: notif.read ? '#fafafa' : '#f0f8ff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: notif.read ? '#ddd' : '#f59e0b',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A2E52', marginBottom: '6px' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
                        {notif.message}
                      </div>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#999' }}>
                        <span>{notif.date}</span>
                        <span style={{
                          padding: '2px 8px',
                          background: notif.read ? '#e5e7eb' : '#fef3c7',
                          borderRadius: '4px',
                          color: notif.read ? '#666' : '#92400e',
                          fontWeight: '500'
                        }}>
                          {notif.read ? '✓ Leída' : 'No leída'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientNotificationsView;
