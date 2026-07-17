export const formatUpdatedAt = (date) => {
    if (!date) return '';
    const time = date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    const day = date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
    return `Actualizado ${day}, ${time}`;
};

export const formatMovementDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit' });
    const time = date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
};
