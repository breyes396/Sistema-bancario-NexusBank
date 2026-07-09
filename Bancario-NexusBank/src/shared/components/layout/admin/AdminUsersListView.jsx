import { useState, useEffect } from "react";
import AdminLayout from './AdminLayout.jsx';
import "../../../../styles/countlist.css";
import { adminDashboardService } from "../../../api/adminDashboard.service.js";
import { useAuthStore } from "../../../../features/auth/store/authStore.js";
import { useNavigate } from "react-router-dom";
 
const ROLES = ["Cliente", "Empleado", "Administrador"];

function maskString(value, visible = 2) {
  if (!value) return '';
  const s = String(value);
  if (s.length <= visible) return s;
  const keep = s.slice(-visible);
  const stars = '*'.repeat(Math.max(3, s.length - visible));
  return `${stars}${keep}`;
}

export default function AdminUsersListView() {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [pendingRole, setPendingRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editDisabledNote, setEditDisabledNote] = useState('');
  const [toast, setToast] = useState(null);
 
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const usersResponse = await adminDashboardService.getUsers();
      const requestsResponse = await adminDashboardService.getPendingAccountRequests();
      
      const usersData = usersResponse?.data?.items || [];
      const pendingRequestsData = requestsResponse?.data || [];

      // Transform users to match the UI structure
      const transformedUsers = usersData.map(u => {
        const profile = u.profile || {};
        const accounts = u.accounts || [];
        
        // Check if user has any account FROZEN
        const hasFrozen = accounts.some(acc => acc.accountStatus === 'FROZEN');
        // Check if user has any PENDING account request
        const hasPendingRequest = pendingRequestsData.some(req => req.userId === u.id);

        let finalStatus = 'Inactivo';
        if (hasFrozen) finalStatus = 'Congelado';
        else if (u.status) finalStatus = 'Activo';

        return {
          id: u.id,
          name: profile.name || u.email || 'Usuario',
          email: u.email,
          username: profile.username || u.email,
          role: u.role || "Cliente",
          status: finalStatus,
          av: "av-blue", 
          init: (profile.name || u.email || "U").substring(0, 2).toUpperCase(),
          phone: profile.phoneNumber || "N/A",
          dpi: profile.documentNumber || "N/A",
          job: profile.jobName || "N/A",
          income: `Q ${profile.income || 0}`,
          reg: new Date(u.createdAt).toLocaleDateString(),
          accounts: accounts.map(acc => ({
            id: acc.id,
            type: acc.accountType,
            num: acc.accountNumber,
            bal: `Q ${acc.accountBalance}`,
            status: acc.accountStatus
          })),
          pendingAccount: hasPendingRequest
        };
      });

      setClients(transformedUsers);
      setPendingRequests(pendingRequestsData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      showToast("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveAccount(accountId) {
    try {
      await adminDashboardService.approveAccount(accountId);
      showToast("Cuenta aprobada con éxito");
      fetchData();
    } catch (error) {
      console.error("Error approving account:", error);
      showToast("Error al aprobar cuenta");
    }
  }

  async function handleApproveRequest(requestId) {
    try {
      await adminDashboardService.approveAccountRequest(requestId);
      showToast("Solicitud aprobada con éxito");
      fetchData(); 
    } catch (error) {
      console.error("Error approving request:", error);
      showToast("Error al aprobar solicitud");
    }
  }

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === "Todos" || 
                       (roleFilter === "Admin" && (c.role === "Admin" || c.role === "Administrador")) ||
                       (roleFilter === "Clientes" && c.role === "Cliente") ||
                       (roleFilter === "Empleados" && c.role === "Empleado");

    const matchesStatus = statusFilter === "Todos" || c.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
 
  const selected = clients.find((c) => c.id === selectedId) || null;
 
  const totalActivos = clients.filter((c) => c.status === "Activo").length;
 
  function handleRoleChange(val) {
    setPendingRole(val);
  }
 
  function handleConfirmClick() {
    if (!pendingRole || pendingRole === selected.role) return;
    
    // Protection: If target is Admin, only they themselves can change their own data
    const isAdmin = selected.role === 'Admin' || selected.role === 'Administrador';
    const isSelf = selected.id === currentUser?.id;

    if (isAdmin && !isSelf) {
      showToast("No puedes cambiar el rol de otro administrador");
      return;
    }

    setShowModal(true);
  }
 
  async function confirmRoleChange() {
    try {
      await adminDashboardService.updateUser(selectedId, { role: pendingRole });
      
      const isSelf = selectedId === currentUser?.id;

      if (isSelf) {
        showToast("Tu rol ha cambiado. Cerrando sesión...");
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 1500);
      } else {
        showToast(`Rol de ${selected.name} cambiado a ${pendingRole}`);
        setShowModal(false);
        setPendingRole(null);
        fetchData(); 
      }
    } catch (error) {
      console.error("Error updating role:", error);
      showToast(error.response?.data?.msg || "Error al cambiar el rol");
    }
  }
 
  function cancelModal() {
    setShowModal(false);
    setPendingRole(null);
  }
 
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }
 
  function selectClient(id) {
    setSelectedId(id);
    setPendingRole(null);
  }
 
  const currentRole = pendingRole ?? selected?.role ?? "";
  const roleChanged = pendingRole && selected && pendingRole !== selected.role;
 
  return (
    <AdminLayout>
      <div className="alv-root">
      <div className="alv-layout">
        {/* ── Sidebar ── */}
        <aside className="alv-sidebar">
          <div className="alv-sidebar-header">
            <h2>Usuarios registrados</h2>
            <p>Cuentas aprobadas y activas en el sistema</p>
          </div>
 
          <div className="alv-stats">
            <div className="alv-stat">
              <div className="alv-stat-num">{clients.length}</div>
              <div className="alv-stat-label">Total</div>
            </div>
            <div className="alv-stat">
              <div className="alv-stat-num">{totalActivos}</div>
              <div className="alv-stat-label">Activos</div>
            </div>
          </div>
 
          <div className="alv-filters-wrap">
            <div className="alv-search-wrap">
              <input
                className="alv-search"
                type="text"
                placeholder="Buscar usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="alv-selects-row">
              <div className="alv-filter-item">
                <label>Rol</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Admin">Admin</option>
                  <option value="Clientes">Clientes</option>
                  <option value="Empleados">Empleados</option>
                </select>
              </div>
              <div className="alv-filter-item">
                <label>Estado</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Congelado">Congelados</option>
                </select>
              </div>
            </div>
          </div>
 
          <div className="alv-client-list">
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`alv-client-item${selectedId === c.id ? " active" : ""}`}
                onClick={() => selectClient(c.id)}
              >
                <div className={`alv-avatar ${c.av}`}>{c.init}</div>
                <div className="alv-client-info">
                  <div className="alv-client-name">{c.name}</div>
                  <div className="alv-client-sub">{c.email}</div>
                </div>
                <span className={`alv-badge badge-${c.status.toLowerCase()}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </aside>
 
        {/* ── Detail ── */}
        <main className="alv-detail">
          {!selected ? (
            <div className="alv-empty">
              <span>Seleccioná un usuario para ver su información</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="alv-detail-header">
                <div className="alv-dname-row">
                  <div className={`alv-avatar alv-d-avatar ${selected.av}`}>
                    {selected.init}
                  </div>
                  <div className="alv-d-title">
                    <h3>{selected.name}</h3>
                    <p>{selected.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="alv-role-badge">{selected.role}</span>
                  <button
                    className="px-4 py-2 bg-[#163c78] text-white rounded-lg font-semibold hover:bg-[#112a53] transition shadow-sm"
                    onClick={() => {
                      setEditForm({ name: selected.name || '', phone: selected.phone || '' });
                      const hasPending = pendingRequests.some(r => r.userId === selected.id);
                      if (hasPending) setEditDisabledNote('Este usuario tiene solicitudes pendientes; algunos campos están bloqueados.');
                      else setEditDisabledNote('');
                      setShowEditModal(true);
                    }}
                  >Editar</button>
                </div>
              </div>
 
              {/* Info del registro */}
              <div className="alv-section">
                <div className="alv-section-title">Información del cliente</div>
                <div className="alv-info-grid">
                  <div className="alv-info-row">
                    <span className="alv-info-label">Nombre completo</span>
                    <span className="alv-info-val">{selected.name}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">Username</span>
                    <span className="alv-info-val">{selected.username}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">Correo</span>
                    <span className="alv-info-val">{selected.email}</span>
                  </div>
                  {/** Mostrar datos parcialmente censurados para seguridad */}
                  <div className="alv-info-row">
                    <span className="alv-info-label">Teléfono</span>
                    <span className="alv-info-val">{maskString(selected.phone, 3)}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">DPI</span>
                    <span className="alv-info-val">{maskString(selected.dpi, 4)}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">Trabajo</span>
                    <span className="alv-info-val">{selected.job}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">Ingresos</span>
                    <span className="alv-info-val green">{selected.income}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">Fecha registro</span>
                    <span className="alv-info-val">{selected.reg}</span>
                  </div>
                  <div className="alv-info-row">
                    <span className="alv-info-label">Estado</span>
                    <span className={`alv-info-val ${selected.status === "Activo" ? "green" : ""}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>
 
              <hr className="alv-divider" />
 
              {/* Cuentas */}
              <div className="alv-section">
                <div className="alv-section-title">
                  Cuentas del cliente ({selected.accounts.length})
                </div>
                <div className="alv-accounts">
                  {selected.accounts.length === 0 && !selected.pendingAccount && (
                    <p className="alv-acc-empty">Sin cuentas activas</p>
                  )}
                  {selected.accounts.map((acc, i) => (
                    <div className="alv-account-card" key={i}>
                      <div>
                        <div className="alv-acc-type">
                          {acc.type} 
                          {acc.status === 'UNDER_REVIEW' && (
                            <span className="alv-badge badge-pending" style={{ marginLeft: '8px' }}>PENDIENTE</span>
                          )}
                        </div>
                        <div className="alv-acc-num">{acc.num}</div>
                      </div>
                      <div className="alv-acc-right">
                        <div className="alv-acc-bal">{acc.bal}</div>
                        {acc.status === 'UNDER_REVIEW' && (
                          <button 
                            className="alv-approve-btn"
                            onClick={() => handleApproveAccount(acc.id)}
                          >
                            Aprobar Cuenta
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Solicitudes Pendientes (AccountRequest) */}
                  {pendingRequests.filter(r => r.userId === selected.id).map(req => (
                    <div className="alv-account-card alv-acc-pending-card" key={req.id}>
                      <div>
                        <div className="alv-acc-type">
                          Solicitud: {req.accountType}
                          <span className="alv-badge badge-pending" style={{ marginLeft: '8px' }}>NUEVA</span>
                        </div>
                        <div className="alv-acc-num">Pendiente de creación</div>
                        {req.note && <div className="alv-acc-note">{req.note}</div>}
                      </div>
                      <div className="alv-acc-right">
                        <button 
                          className="alv-approve-btn"
                          onClick={() => handleApproveRequest(req.id)}
                        >
                          Crear y Aprobar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
 
              <hr className="alv-divider" />
 
              {/* Cambiar rol */}
              <div className="alv-section">
                <div className="alv-section-title">Cambiar rol del usuario</div>
                <div className="alv-role-section">
                  <div className="alv-role-row">
                    <span className="alv-role-label">
                      Rol actual: <strong style={{ color: "#4ecba3" }}>{selected.role}</strong>
                    </span>
                    <select
                      className="alv-role-select"
                      value={currentRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <p className="alv-role-hint">
                    Este cambio es inmediato y afecta los permisos del usuario.
                  </p>
                </div>
 
                {roleChanged && (
                  <div className="alv-confirm-wrap">
                    <button className="alv-confirm-btn" onClick={handleConfirmClick}>
                      Confirmar cambio de rol
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
 
      {/* ── Modal de confirmación ── */}
      {showModal && (
        <div className="alv-modal-overlay">
          <div className="alv-modal">
            <h3>¿Confirmar cambio de rol?</h3>
            <p>
              Estás a punto de cambiar el rol de{" "}
              <strong>{selected?.name}</strong> de{" "}
              <strong>{selected?.role}</strong> a{" "}
              <strong>{pendingRole}</strong>.<br />
              Este cambio es inmediato y afecta los permisos del usuario.
            </p>
            <div className="alv-modal-btns">
              <button className="alv-modal-cancel" onClick={cancelModal}>
                Cancelar
              </button>
              <button className="alv-modal-ok" onClick={confirmRoleChange}>
                Sí, cambiar rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de edición limitada ── */}
      {showEditModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-screen overflow-y-auto mt-10 mb-10">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-[#1A2E52]">Editar Usuario</h2>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition">✕</button>
            </div>

            <div className="p-6">
              {editDisabledNote && <p className="text-sm text-yellow-700 mb-4">{editDisabledNote}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-[#1A2E52]">Nombre Completo</label>
                  <input
                    type="text"
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                    value={editForm.name}
                    onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-[#1A2E52]">Teléfono</label>
                  <input
                    type="text"
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
                    disabled={pendingRequests.some(r => r.userId === selected.id)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button className="px-5 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button className="px-5 py-3 bg-[#163c78] text-white rounded-lg font-bold hover:bg-[#112a53] transition" onClick={async () => {
                  try {
                    const payload = { name: editForm.name };
                    if (!pendingRequests.some(r => r.userId === selected.id)) payload.phoneNumber = editForm.phone;
                    await adminDashboardService.updateUser(selected.id, payload);
                    showToast('Usuario actualizado correctamente');
                    setShowEditModal(false);
                    fetchData();
                  } catch (err) {
                    console.error(err);
                    showToast(err.response?.data?.message || 'Error actualizando usuario');
                  }
                }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* ── Toast ── */}
      {toast && <div className="alv-toast">{toast}</div>}
      </div>
    </AdminLayout>
  );
}