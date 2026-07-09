import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import AdminPageHeader from './AdminPageHeader.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError } from '../../../utils/toast.js';
import '../../../../styles/adminDashboard.css';

const fetchEmployeesStats = async () => {
    const data = await adminDashboardService.getEmployeesStats();
    // adminDashboardService returns response.data (the full JSON body)
    // sendSuccess wraps payload as { success, data: { employees } }
    return data?.data?.employees || data?.employees || [];
};

const buildAvatarSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';
    const origin = authUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    if (url.startsWith('/uploads')) return `${origin}${url}`;
    if (url.startsWith('/api/v1/uploads')) return `${origin}${url.replace(/^\/api\/v1/, '')}`;
    return `${origin}/${url.replace(/^\//, '')}`;
};

/* ─── Modal de Detalles ─── */
const EmployeeDetailModal = ({ employee, onClose }) => {
    if (!employee) return null;

    const avatarSrc = buildAvatarSrc(employee.profilePhotoUrl);
    const total = employee.stats.totalProcessed;
    const approvedPct = total > 0 ? Math.round((employee.stats.approved / total) * 100) : 0;
    const revertedPct = total > 0 ? Math.round((employee.stats.reverted / total) * 100) : 0;

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(6,14,28,0.82)',
                backdropFilter: 'blur(6px)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(160deg, #0a1c3a 0%, #0f2a54 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 24, padding: '36px 32px',
                    width: '100%', maxWidth: 520,
                    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                    animation: 'modalIn 0.25s cubic-bezier(.34,1.56,.64,1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`
                    @keyframes modalIn {
                        from { opacity:0; transform: scale(0.92) translateY(16px); }
                        to   { opacity:1; transform: scale(1)   translateY(0); }
                    }
                `}</style>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#102b55,#163c78)',
                        border: '3px solid #C8A84B',
                        overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {avatarSrc ? (
                            <img src={avatarSrc} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>{employee.name}</h2>
                        <p style={{ color: '#7fa6ea', fontSize: 13, margin: '4px 0 0' }}>@{employee.username} · {employee.email}</p>
                        <span style={{
                            display: 'inline-block', marginTop: 6,
                            background: employee.status ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                            color: employee.status ? '#34d399' : '#f87171',
                            border: `1px solid ${employee.status ? '#34d399' : '#f87171'}`,
                            borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                        }}>
                            {employee.status ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontSize: 18 }}
                    >✕</button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 28 }}>
                    {[
                        { label: 'Aprobados', value: employee.stats.approved, color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: '✅' },
                        { label: 'Total', value: employee.stats.totalProcessed, color: '#C8A84B', bg: 'rgba(200,168,75,0.12)', icon: '📊' },
                    ].map(({ label, value, color, bg, icon }) => (
                        <div key={label} style={{
                            background: bg, border: `1px solid ${color}33`,
                            borderRadius: 16, padding: '16px 12px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 22 }}>{icon}</div>
                            <div style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
                            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Barra de progreso */}
                {total > 0 && (
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: '#94a3b8', fontSize: 13 }}>Tasa de aprobación</span>
                            <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>{approvedPct}%</span>
                        </div>
                        <div style={{ height: 10, background: 'rgba(248,113,113,0.3)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${approvedPct}%`,
                                background: 'linear-gradient(90deg,#34d399,#059669)',
                                borderRadius: 99, transition: 'width 0.6s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ color: '#34d399', fontSize: 11 }}>✅ {approvedPct}% aprobados</span>
                            <span style={{ color: '#f87171', fontSize: 11 }}>↩️ {revertedPct}% revertidos</span>
                        </div>
                    </div>
                )}

                {/* Info adicional */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                    padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10
                }}>
                    {[
                        { label: 'Teléfono', value: employee.phone },
                        { label: 'Miembro desde', value: formatDate(employee.createdAt) },
                        { label: 'Último acceso', value: formatDate(employee.lastLogin) },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>{label}</span>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ─── Vista principal ─── */
const AdminEmployeesView = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchEmployeesStats();
                if (active) setEmployees(data);
            } catch (err) {
                showError('No se pudieron cargar los empleados');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const filtered = employees.filter((e) => {
        const q = search.toLowerCase();
        return (
            e.name?.toLowerCase().includes(q) ||
            e.username?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q)
        );
    });

    const buildAvatarInitial = (name) => (name || 'E').charAt(0).toUpperCase();

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <AdminLayout>
            <div className="admin-section animate-fade-in-up">
                <AdminPageHeader
                    title="Empleados"
                    breadcrumbs={[
                        { label: 'Inicio', to: '/AdminDashboard' },
                        { label: 'Empleados' }
                    ]}
                    description="Gestión y estadísticas de depósitos por empleado."
                />

                {/* Barra de búsqueda */}
                <div style={{ marginBottom: 24, maxWidth: 400 }}>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '11px 14px 11px 42px',
                                background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: 12, fontSize: 14, outline: 'none',
                                color: '#1e293b', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Tabla / Cards */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            border: '4px solid #e2e8f0', borderTopColor: '#163c78',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 20px',
                        background: '#fff', borderRadius: 20,
                        border: '1px dashed #e2e8f0', color: '#94a3b8'
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                        <p style={{ fontSize: 16, fontWeight: 600 }}>No se encontraron empleados</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map((emp) => {
                            const avatarSrc = buildAvatarSrc(emp.profilePhotoUrl);
                            const total = emp.stats.totalProcessed;
                            const approvedPct = total > 0 ? Math.round((emp.stats.approved / total) * 100) : 0;

                            return (
                                <div
                                    key={emp.id}
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #e8edf5',
                                        borderRadius: 18,
                                        padding: '20px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 20,
                                        boxShadow: '0 2px 8px rgba(22,60,120,0.06)',
                                        transition: 'box-shadow 0.2s, transform 0.15s',
                                        cursor: 'default'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,60,120,0.14)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,60,120,0.06)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%',
                                        background: 'linear-gradient(135deg,#163c78,#2D5899)',
                                        border: '2px solid #C8A84B',
                                        overflow: 'hidden', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {avatarSrc ? (
                                            <img src={avatarSrc} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{buildAvatarInitial(emp.name)}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: 15, color: '#1A2E52' }}>{emp.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: 13 }}>@{emp.username}</span>
                                            <span style={{
                                                background: emp.status ? '#dcfce7' : '#fee2e2',
                                                color: emp.status ? '#16a34a' : '#dc2626',
                                                borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700
                                            }}>
                                                {emp.status ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{emp.email}</p>
                                        {/* Mini barra de progreso */}
                                        {total > 0 && (
                                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', width: `${approvedPct}%`,
                                                        background: 'linear-gradient(90deg,#34d399,#059669)',
                                                        borderRadius: 99
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{approvedPct}% aprob.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{emp.stats.approved}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Aprobados</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: '#C8A84B' }}>{emp.stats.totalProcessed}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total</div>
                                        </div>
                                    </div>

                                    {/* Botón Detalles */}
                                    <button
                                        onClick={() => setSelectedEmployee(emp)}
                                        style={{
                                            background: 'linear-gradient(135deg,#163c78,#2D5899)',
                                            color: '#fff', border: 'none',
                                            borderRadius: 12, padding: '10px 20px',
                                            fontWeight: 700, fontSize: 13,
                                            cursor: 'pointer', flexShrink: 0,
                                            transition: 'filter 0.2s, transform 0.15s',
                                            boxShadow: '0 4px 12px rgba(22,60,120,0.25)'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    >
                                        Ver Detalles
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedEmployee && (
                <EmployeeDetailModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
        </AdminLayout>
    );
};

export default AdminEmployeesView;
