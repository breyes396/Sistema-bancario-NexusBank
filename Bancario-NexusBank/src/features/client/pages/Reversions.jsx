import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../auth/store/authStore.js';
import { getReversalRequestsByUser } from '../../../shared/utils/reversalRequests.js';

const statusLabel = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'Aprobada';
  if (normalized === 'REJECTED') return 'Rechazada';
  return 'Pendiente';
};

const statusBadge = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
  if (normalized === 'REJECTED') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
};

const typeLabel = (type) => String(type || '').toUpperCase() === 'DEPOSITO' ? 'Depósito' : 'Transferencia';

const filterByType = (items, typeFilter) => {
  if (typeFilter === 'ALL') return items;
  return items.filter((item) => String(item.type || '').toUpperCase() === typeFilter);
};

const filterByStatus = (items, statusFilter) => {
  if (statusFilter === 'ALL') return items;
  return items.filter((item) => String(item.status || '').toUpperCase() === statusFilter);
};

const filterByQuery = (items, query) => {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) => {
    const haystack = [
      item.reference,
      item.operationDescription,
      item.reason,
      item.accountNumber,
      item.sourceAccountNumber,
      item.destinationAccountNumber,
      item.type,
      item.status,
    ].join(' ').toLowerCase();

    return haystack.includes(normalized);
  });
};

const Reversions = () => {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const load = () => {
      const next = getReversalRequestsByUser({
        userId: user?.id,
        email: user?.email,
      });
      setItems(next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    load();
    window.addEventListener('nexusbank-reversals-updated', load);
    window.addEventListener('storage', load);

    return () => {
      window.removeEventListener('nexusbank-reversals-updated', load);
      window.removeEventListener('storage', load);
    };
  }, [user?.email, user?.id]);

  const filtered = useMemo(() => {
    const byType = filterByType(items, typeFilter);
    const byStatus = filterByStatus(byType, statusFilter);
    return filterByQuery(byStatus, search);
  }, [items, search, statusFilter, typeFilter]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C8A84B]">Control</p>
        <h1 className="text-3xl lg:text-4xl font-bold text-[#1A2E52]">Reversiones</h1>
        <p className="text-gray-500 mt-2">Solicitudes de reversión para depósitos y transferencias.</p>
      </div>

      <section className="glass-panel rounded-3xl p-5 border border-white/60 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por referencia, cuenta o motivo"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#2D5899] focus:outline-none"
          />
          <select
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#2D5899] focus:outline-none"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="DEPOSITO">Depósitos</option>
            <option value="TRANSFERENCIA">Transferencias</option>
          </select>
          <select
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#2D5899] focus:outline-none"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-5 border border-white/60 shadow-lg">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No hay solicitudes que coincidan con los filtros.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">{typeLabel(item.type)} · REF {item.reference}</p>
                    <h3 className="text-lg font-bold text-[#1A2E52]">
                      Q {Number(item.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <p><span className="font-semibold">Cuenta:</span> {item.accountNumber || item.sourceAccountNumber || '-'}</p>
                  <p><span className="font-semibold">Fecha:</span> {new Date(item.createdAt).toLocaleString('es-GT')}</p>
                  <p className="md:col-span-2"><span className="font-semibold">Motivo:</span> {item.reason}</p>
                  {item.adminComment && (
                    <p className="md:col-span-2"><span className="font-semibold">Respuesta Admin:</span> {item.adminComment}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Reversions;
