import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientFavoriteService } from '../../../shared/api/clientFavorite.service.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';

const defaultForm = {
  accountNumber: '',
  accountType: 'ahorro',
  alias: '',
};

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingFavoriteId, setEditingFavoriteId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await clientFavoriteService.getFavorites();
      setFavorites(data);
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudieron obtener tus favoritos.';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const visibleFavorites = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return favorites;

    return favorites.filter((favorite) => {
      return (
        String(favorite.alias || '').toLowerCase().includes(term) ||
        String(favorite.accountNumber || '').toLowerCase().includes(term)
      );
    });
  }, [favorites, search]);

  const isEditing = Boolean(editingFavoriteId);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingFavoriteId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      accountNumber: form.accountNumber.trim(),
      accountType: String(form.accountType || '').toLowerCase().trim(),
      alias: form.alias.trim(),
    };

    if (!payload.accountNumber || !payload.accountType || !payload.alias) {
      showError('Completa accountNumber, accountType y alias.');
      return;
    }

    try {
      setSaving(true);

      if (isEditing) {
        const updated = await clientFavoriteService.updateFavorite(editingFavoriteId, {
          alias: payload.alias,
          accountType: payload.accountType,
        });

        setFavorites((prev) => prev.map((item) => (item.id === editingFavoriteId ? { ...item, ...updated } : item)));
        showSuccess('Favorito actualizado correctamente.');
      } else {
        const created = await clientFavoriteService.createFavorite(payload);
        setFavorites((prev) => [created, ...prev]);
        showSuccess('Favorito agregado correctamente.');
      }

      resetForm();
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudo guardar el favorito.';
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (favorite) => {
    setEditingFavoriteId(favorite.id);
    setForm({
      accountNumber: favorite.accountNumber,
      accountType: favorite.accountType || 'ahorro',
      alias: favorite.alias,
    });
  };

  const handleDelete = async (favoriteId) => {
    try {
      await clientFavoriteService.deleteFavorite(favoriteId);
      setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
      showSuccess('Favorito eliminado correctamente.');

      if (editingFavoriteId === favoriteId) {
        resetForm();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudo eliminar el favorito.';
      showError(message);
    }
  };

  const goToTransfer = (favorite) => {
    navigate('/clientdashboard/transfers', {
      state: {
        prefillDestinationAccountNumber: favorite.accountNumber,
        prefillRecipientType: 'TERCERO',
        prefillDescription: `Transferencia a favorito: ${favorite.alias}`,
      },
    });
  };

  const goToDeposit = (favorite) => {
    navigate('/clientdashboard/deposits', {
      state: {
        prefillDestinationAccountNumber: favorite.accountNumber,
        prefillDescription: `Deposito a favorito: ${favorite.alias}`,
      },
    });
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C8A84B]">Favoritos</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1A2E52]">Gestion de cuentas frecuentes</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">Guarda cuentas de uso recurrente y ejecuta deposito o transferencia rapida.</p>
        </div>

        <div className="glass-panel rounded-2xl px-4 py-3 inline-flex items-center gap-3 self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-700">Ruta protegida</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <h2 className="text-xl font-bold text-[#1A2E52] mb-1">{isEditing ? 'Editar favorito' : 'Agregar favorito'}</h2>
          <p className="text-sm text-gray-500 mb-5">
            {isEditing ? 'Actualiza alias o tipo de cuenta.' : 'Ejemplo backend: accountNumber, accountType, alias'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Numero de cuenta</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                readOnly={isEditing}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none read-only:opacity-80"
                placeholder="Ej: 001-9115890794-1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Tipo de cuenta</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm((prev) => ({ ...prev, accountType: e.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
              >
                <option value="ahorro">ahorro</option>
                <option value="corriente">corriente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Alias</label>
              <input
                type="text"
                value={form.alias}
                onChange={(e) => setForm((prev) => ({ ...prev, alias: e.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                placeholder="Ej: Mama"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-[#2D5899] to-[#1A2E52] px-5 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:opacity-60"
              >
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar favorito'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-[#1D4ED8] px-5 py-3 font-semibold text-[#1D4ED8] transition hover:bg-[#1D4ED8] hover:text-white"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="xl:col-span-2 glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#1A2E52]">Lista de favoritos</h2>
              <p className="text-sm text-gray-500">Edita alias, elimina cuentas y usa acciones rapidas.</p>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 rounded-2xl border border-gray-300 bg-white px-4 py-2.5 focus:border-[#2D5899] focus:outline-none"
              placeholder="Buscar por alias o cuenta"
            />
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-8 text-center text-gray-500">Cargando favoritos...</div>
          ) : visibleFavorites.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No hay favoritos registrados.
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {visibleFavorites.map((favorite) => (
                <article key={favorite.id} className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#2D5899]/50 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-[#1A2E52]">{favorite.alias}</p>
                      <p className="text-sm text-gray-500 mt-1">{favorite.accountNumber}</p>
                    </div>
                    <span className="inline-flex items-center self-start rounded-full bg-[#E8F2FF] px-3 py-1 text-xs font-semibold text-[#1B4A8F] uppercase">
                      {favorite.accountType}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => goToTransfer(favorite)}
                      className="rounded-xl border border-[#2D5899] bg-white px-3 py-2 text-sm font-semibold text-[#2D5899] hover:bg-[#2D5899] hover:text-white transition"
                    >
                      Transferencia rapida
                    </button>
                    <button
                      type="button"
                      onClick={() => goToDeposit(favorite)}
                      className="rounded-xl border border-[#2D5899] bg-white px-3 py-2 text-sm font-semibold text-[#2D5899] hover:bg-[#2D5899] hover:text-white transition"
                    >
                      Deposito rapido
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(favorite)}
                      className="rounded-xl border border-[#1D4ED8] px-3 py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#1D4ED8] hover:text-white transition"
                    >
                      Editar alias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(favorite.id)}
                      className="rounded-xl border border-[#DC2626] px-3 py-2 text-sm font-semibold text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Favorites;
