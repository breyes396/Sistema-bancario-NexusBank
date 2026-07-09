import React, { useState, useEffect } from 'react';
import EmployeeLayout from './EmployeeLayout.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../../utils/toast.js';
import { getReversalRequests } from '../../../utils/reversalRequests.js';
import ConfirmModal from '../../../components/ConfirmModal.jsx';
import '../../../../styles/adminDashboard.css';

const EmployeDashnoardContainer = () => {
    const [deposits, setDeposits] = useState([]);
    const [selectedDepositId, setSelectedDepositId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAccountNumber, setNewAccountNumber] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [foundAccountName, setFoundAccountName] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const getDisplayStatus = (status) => {
        if (status === 'PENDIENTE') return 'PENDIENTE';
        if (status === 'COMPLETADA') return 'APROBADO';
        return 'RECHAZADO';
    };

    const getBadgeClass = (status) => {
        if (status === 'PENDIENTE') return 'badge-pendiente';
        if (status === 'COMPLETADA') return 'badge-ingreso';
        return 'badge-egreso';
    };

    const getDepositMethodLabel = (channel) => {
        if (!channel) return 'Ventanilla / caja';
        const s = channel.toString().toLowerCase();
        if (s.includes('ventanilla') || s.includes('caja')) return 'Ventanilla / caja';
        return channel;
    };

    const normalizeAccountType = (raw) => {
        const s = (raw || '').toString().trim().toLowerCase();
        if (!s) return '';
        if (s.includes('ahorr')) return 'ahorro';
        if (s.includes('corrient')) return 'corriente';
        return s;
    };

    const getApprovedReversalKeys = () => {
        const approvedReversals = getReversalRequests().filter((item) => String(item.status || '').toUpperCase() === 'APPROVED');
        return new Set(
            approvedReversals.flatMap((item) => [
                String(item.operationId || ''),
                String(item.reference || ''),
            ].filter(Boolean))
        );
    };

    const fetchDeposits = async () => {
        try {
            setLoading(true);
            const response = await adminDashboardService.getDepositRequests();
            const depositRequests = response?.data?.depositRequests || response?.depositRequests || [];
            const normalized = Array.isArray(depositRequests)
                ? depositRequests.map((dep) => ({
                    id: dep.id,
                    reference: dep.id,
                    amount: Number(dep.amount || 0),
                    status: dep.status || 'PENDIENTE',
                    accountNumber: dep.Account?.accountNumber || 'N/D',
                    // normalize account type to singular lowercase (e.g., 'ahorro')
                    bank: normalizeAccountType(dep.Account?.accountType) || 'interno',
                    userId: dep.relatedAccountId || 'N/D',
                    description: dep.description || 'Pago por servicio',
                    date: dep.createdAt || dep.updatedAt || new Date().toISOString(),
                    method: getDepositMethodLabel(dep.channel),
                    ipAddress: dep.ipAddress || 'N/D',
                    device: dep.device || 'N/D',
                    location: dep.location || 'N/D',
                    raw: dep
                }))
                : [];

            const approvedReversalKeys = getApprovedReversalKeys();
            // Exclude non-deposit entries: try to be conservative and only include items that look like deposits
            const looksLikeDeposit = (dep) => {
                const raw = dep.raw || {};
                const checkFields = [raw.type, raw.transactionType, raw.kind, raw.operation, dep.method, raw.channel, dep.description];
                const joined = checkFields.filter(Boolean).map((s) => String(s).toLowerCase()).join(' ');

                // negative indicators (transferencias)
                if (joined.includes('transfer') || joined.includes('transferencia') || joined.includes('trx') || joined.includes('wire')) return false;

                // positive indicators explicitly pointing to deposits
                if (joined.includes('deposit') || joined.includes('depósito') || joined.includes('deposito') || joined.includes('ventanilla') || joined.includes('caja')) return true;

                // If there is a raw.type-like field and it doesn't mention transfer, and we have account info, consider it a deposit
                const hasRawType = Boolean(raw.type || raw.transactionType || raw.kind || raw.operation);
                if (hasRawType && dep.amount && dep.accountNumber && dep.accountNumber !== 'N/D') return true;

                // conservative default: do not assume deposit
                return false;
            };

            const visibleDeposits = normalized.filter((dep) => {
                const depositId = String(dep.id || '');
                const depositReference = String(dep.reference || '');
                if (approvedReversalKeys.has(depositId) || approvedReversalKeys.has(depositReference)) return false;
                return looksLikeDeposit(dep);
            });

            setDeposits(visibleDeposits);
            if (!selectedDepositId && normalized.length > 0) {
                setSelectedDepositId(visibleDeposits[0]?.id || null);
            }
        } catch (error) {
            console.error(error);
            showError('Error al cargar los depósitos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeposits();
    }, []);

    useEffect(() => {
        const refreshDeposits = () => {
            fetchDeposits();
        };

        window.addEventListener('nexusbank-reversals-updated', refreshDeposits);
        window.addEventListener('storage', refreshDeposits);

        return () => {
            window.removeEventListener('nexusbank-reversals-updated', refreshDeposits);
            window.removeEventListener('storage', refreshDeposits);
        };
    }, []);

    // Lookup account holder name when account number or type changes (debounced)
    useEffect(() => {
        if (!showCreateModal) return;

        const cleaned = (newAccountNumber || '').trim();
        if (!cleaned) {
            setFoundAccountName(null);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setLookupLoading(true);
            setFoundAccountName(null);
            try {
                const resp = await adminDashboardService.getAccounts();
                const accounts = resp?.data || resp?.accounts || resp || [];
                const norm = (str) => (str || '').toString().replace(/\s|\-|\./g, '').toLowerCase();
                const target = norm(cleaned);
                const found = (Array.isArray(accounts) ? accounts : []).find((a) => {
                    const accNum = norm(a.accountNumber || a.number || a.account || '');
                    // No filtrar por tipo de cuenta aquí
                    return (accNum === target || accNum.includes(target) || target.includes(accNum));
                });

                if (!cancelled) {
                    if (found) {
                        const nameCandidates = [
                            found.alias,
                            found.holderName,
                            found.name,
                            found.accountHolderName,
                            found.owner?.name,
                            found.User?.UserProfile?.Name,
                            found.User?.profile?.name,
                            found.User?.username,
                            `${found.firstName || ''} ${found.lastName || ''}`.trim(),
                        ];
                        const name = nameCandidates.find((n) => n && String(n).trim());
                        setFoundAccountName(name || 'Titular (sin nombre)');
                    } else {
                        setFoundAccountName(null);
                    }
                }
            } catch (err) {
                if (!cancelled) setFoundAccountName(null);
            } finally {
                if (!cancelled) setLookupLoading(false);
            }
        }, 450);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [newAccountNumber, showCreateModal]);

    

    const selectedDeposit = deposits.find((item) => item.id === selectedDepositId) || deposits[0] || null;

    const filteredDeposits = deposits.filter((deposit) => {
        const searchValue = `${deposit.id} ${deposit.accountNumber} ${deposit.bank} ${deposit.description}`.toLowerCase();
        const matchesSearch = searchValue.includes(searchTerm.toLowerCase());
        const statusMatch =
            filterStatus === 'TODOS'
                ? true
                : filterStatus === 'PENDIENTE'
                    ? deposit.status === 'PENDIENTE'
                    : filterStatus === 'APROBADO'
                        ? deposit.status === 'COMPLETADA'
                        : ['FALLIDA', 'REVERTIDA'].includes(deposit.status);
        return matchesSearch && statusMatch;
    });

    const summary = {
        pending: deposits.filter((deposit) => deposit.status === 'PENDIENTE').length,
        approved: deposits.filter((deposit) => deposit.status === 'COMPLETADA').length,
        rejected: deposits.filter((deposit) => ['FALLIDA', 'REVERTIDA'].includes(deposit.status)).length,
        total: deposits.length
    };

    const openApproveConfirm = (deposit) => {
        if (deposit.status !== 'PENDIENTE') return;
        setConfirmAction({
            type: 'approveDeposit',
            depositId: deposit.id,
            accountNumber: deposit.accountNumber,
            amount: deposit.amount,
            userId: deposit.userId,
        });
    };

    const closeConfirm = () => setConfirmAction(null);

    const handleConfirmApprove = async () => {
        if (!confirmAction || confirmAction.type !== 'approveDeposit') return;

        try {
            await adminDashboardService.approveDeposit(confirmAction.depositId);
            showSuccess('Depósito aprobado correctamente.');
            closeConfirm();
            fetchDeposits();
        } catch (error) {
            showError(error.response?.data?.message || 'Error al aprobar el depósito');
        }
    };

    const handleReject = async (deposit) => {
        if (deposit.status !== 'PENDIENTE') return;

        try {
            await adminDashboardService.rejectDeposit(deposit.id);
            showSuccess('Depósito rechazado correctamente.');
            fetchDeposits();
        } catch (error) {
            showError(error.response?.data?.message || 'Error al rechazar el depósito');
        }
    };

    return (
        <EmployeeLayout>
            <section className="admin-section animate-fade-in-up">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-[#1A2E52]">Panel de Empleado — Depósitos</h2>
                                <p className="text-gray-500">Depósitos pendientes de aprobación y el detalle completo de cada solicitud.</p>
                            </div>
                            <div className="mt-2 sm:mt-0">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(true); setNewAccountNumber(''); setFoundAccountName(null); }}
                                    className="px-4 py-2 rounded-lg font-semibold"
                                    style={{ backgroundColor: '#d4a017', color: '#0f172a' }}
                                >
                                    Crear depósito
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card blue">
                            <div className="stat-label">Alertas & Notificaciones</div>
                            <div className="stat-value">{summary.total}</div>
                            <div className="stat-subtitle">Depósitos totales visibles</div>
                        </div>
                        <div className="stat-card light-blue">
                            <div className="stat-label">Pendientes</div>
                            <div className="stat-value">{summary.pending}</div>
                            <div className="stat-subtitle positive">Esperando aprobación</div>
                        </div>
                        <div className="stat-card light-blue">
                            <div className="stat-label">Aprobados</div>
                            <div className="stat-value">{summary.approved}</div>
                            <div className="stat-subtitle positive">Procesados</div>
                        </div>
                    </div>

                    

                    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
                        <div className="movements-section">
                            <div className="movements-header">
                                <div>
                                    <h3 className="movements-title">Depósitos Pendientes de Aprobación</h3>
                                    <p className="text-sm text-gray-500 mt-1">Selecciona un depósito para ver el detalle completo.</p>
                                </div>
                                <div className="filters-container">
                                    <select
                                        className="filter-select"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="PENDIENTE">Pendientes</option>
                                        <option value="APROBADO">Aprobados</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-wrapper">
                                <table className="movements-table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Fecha</th>
                                            <th>Banco Emisor</th>
                                            <th>Referencia</th>
                                            <th>Monto</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">Cargando depósitos...</td>
                                            </tr>
                                        ) : filteredDeposits.length > 0 ? (
                                            filteredDeposits.map((deposit) => (
                                                <tr
                                                    key={deposit.id}
                                                    className={selectedDeposit?.id === deposit.id ? 'bg-[#eff6ff]' : ''}
                                                    onClick={() => setSelectedDepositId(deposit.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="font-semibold text-sm">{deposit.userId}</td>
                                                    <td className="date-column">{new Date(deposit.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    <td>{deposit.bank}</td>
                                                    <td className="font-mono text-xs">{deposit.reference}</td>
                                                    <td className="font-bold">Q{deposit.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                                                    <td>
                                                        <span className={`status-badge ${getBadgeClass(deposit.status)}`}>
                                                            {getDisplayStatus(deposit.status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openApproveConfirm(deposit);
                                                                }}
                                                                disabled={deposit.status !== 'PENDIENTE'}
                                                                className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition ${deposit.status === 'PENDIENTE' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                                                            >
                                                                Aprobar
                                                            </button>
                                                            {/* Rechazar eliminado: acción no disponible en la UI de empleado */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="empty-message">No se encontraron depósitos.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="movements-section">
                            <div className="flex items-center justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="movements-title">Detalle del Depósito</h3>
                                    <p className="text-sm text-gray-500 mt-1">Información detallada para el depósito seleccionado.</p>
                                </div>
                                {selectedDeposit && (
                                    <span className={`status-badge ${getBadgeClass(selectedDeposit.status)}`}>
                                        {getDisplayStatus(selectedDeposit.status)}
                                    </span>
                                )}
                            </div>

                            {selectedDeposit ? (
                                <div className="space-y-5">
                                    <div className="rounded-[28px] border border-[#e5e7eb] bg-[#f8fafc] p-5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm uppercase tracking-[0.2em] text-[#64748b]">Monto</p>
                                                <p className="text-3xl font-bold text-[#1f2937]">Q{selectedDeposit.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-[#64748b]">REF</p>
                                                <p className="font-semibold text-[#1f2937]">{selectedDeposit.reference}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                                        <div className="grid gap-4 text-sm text-[#334155]">
                                            <div className="flex justify-between"><span className="font-semibold">Usuario</span><span>{selectedDeposit.userId}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Número de Cuenta</span><span>{selectedDeposit.accountNumber}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Banco Emisor</span><span>{selectedDeposit.bank}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Número de Referencia</span><span>{selectedDeposit.reference}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Fecha / Hora</span><span>{new Date(selectedDeposit.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Método / Canal</span><span>{selectedDeposit.method}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Descripción</span><span>{selectedDeposit.description}</span></div>
                                            {/* Campos sensibles eliminados: Dirección IP, Dispositivo, Ubicación */}
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <button
                                            type="button"
                                            onClick={() => openApproveConfirm(selectedDeposit)}
                                            disabled={selectedDeposit.status !== 'PENDIENTE'}
                                            className="rounded-2xl bg-green-600 text-white py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Aprobar Depósito
                                        </button>
                                        {/* Botón Rechazar eliminado: no disponible para empleados */}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                                    Selecciona un depósito para ver el detalle.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Modal: Crear Depósito (entrada rápida) */}
                {showCreateModal && (
                    <div className="modal-backdrop">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h4 className="text-lg font-bold">Crear Depósito — Datos</h4>
                                </div>

                            <div className="modal-body">
                                <label className="block text-sm font-semibold mb-1">Número de Cuenta</label>
                                <input
                                    type="text"
                                    value={newAccountNumber}
                                    onChange={(e) => setNewAccountNumber(e.target.value)}
                                    placeholder="Ej. 001-1234567890-1"
                                    className="w-full p-2 border rounded mb-3"
                                />

                                {/* Tipo de Cuenta eliminado: no se requiere validación */}

                                    <label className="block text-sm font-semibold mb-1">Monto</label>
                                    <input
                                        type="number"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        placeholder="Ej. 1500"
                                        className="w-full p-2 border rounded mb-3"
                                    />

                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">Titular:</p>
                                    {lookupLoading ? (
                                        <p className="text-sm font-medium">Buscando...</p>
                                    ) : foundAccountName ? (
                                        <p className="text-sm font-medium text-green-700">{foundAccountName}</p>
                                    ) : newAccountNumber ? (
                                        <p className="text-sm font-medium text-red-600">No encontrado</p>
                                    ) : (
                                        <p className="text-sm font-medium text-gray-400">Ingresa número de cuenta</p>
                                    )}
                                </div>

                                <div className="mt-4 flex justify-end gap-2">
                                    <button className="px-4 py-2 rounded border" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                    <button
                                        className="px-4 py-2 rounded bg-amber-500 text-white"
                                        onClick={async () => {
                                            // Validaciones
                                            if (!foundAccountName) return showError('Busca y selecciona una cuenta válida primero.');
                                            const amount = Number(newAmount);
                                            if (!amount || amount <= 0) return showError('Ingresa un monto válido.');

                                            try {
                                                const payload = {
                                                    accountNumber: newAccountNumber,
                                                    amount,
                                                    description: 'Depósito por ventanilla'
                                                };
                                                await adminDashboardService.createDepositForAccount(payload);
                                                showSuccess('Depósito creado correctamente.');
                                                setShowCreateModal(false);
                                                setNewAccountNumber('');
                                                setNewAmount('');
                                                setFoundAccountName(null);
                                                // refrescar lista
                                                await new Promise(r => setTimeout(r, 500));
                                                fetchDeposits();
                                            } catch (err) {
                                                console.error(err);
                                                showError(err.response?.data?.message || 'Error creando el depósito');
                                            }
                                        }}
                                    >
                                        Listo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    open={!!confirmAction}
                    title="Aprobar depósito"
                    message={confirmAction
                        ? `¿Deseas aprobar el depósito de Q${Number(confirmAction.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })} para la cuenta ${confirmAction.accountNumber || 'sin número'}?`
                        : ''}
                    confirmLabel="Aprobar"
                    tone="primary"
                    onConfirm={handleConfirmApprove}
                    onCancel={closeConfirm}
                />
            </section>
        </EmployeeLayout>
    );
};

export default EmployeDashnoardContainer;
