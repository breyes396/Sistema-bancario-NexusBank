export const getAccountTypeLabel = (type) => {
    const rawType = String(type || '').trim().toLowerCase();
    if (rawType.includes('corrient') || rawType.includes('monetar')) return 'Cuenta Monetaria';
    if (rawType.includes('ahor')) return 'Cuenta de Ahorros';
    return 'Cuenta Monetaria';
};

export const formatBalance = (balance) => {
    return `Q${parseFloat(balance || 0).toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export const accountStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'FROZEN') return 'Congelada';
    if (s === 'SUSPENDED') return 'Suspendida';
    if (s === 'BLOCKED') return 'Bloqueada';
    if (s === 'CLOSED') return 'Cerrada';
    if (s === 'UNDER_REVIEW') return 'En revisión';
    return 'Activa';
};

export const getStatusBadgeStyle = (status, styles) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE') return styles.statusActive;
    if (['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(s)) return styles.statusBlocked;
    return styles.statusReview;
};
