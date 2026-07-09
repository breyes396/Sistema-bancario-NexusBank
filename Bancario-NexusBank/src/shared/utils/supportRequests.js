const STORAGE_KEY = 'nexusbank_support_requests';

const safeRead = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (items) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `sr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const getSupportRequests = () => safeRead();

export const addSupportRequest = (payload) => {
  const nextRequest = {
    id: makeId(),
    email: String(payload.email || '').trim().toLowerCase(),
    description: String(payload.description || '').trim(),
    userId: payload.userId || null,
    userName: payload.userName || null,
    createdAt: new Date().toISOString(),
    status: 'OPEN',
    source: 'CONTACT_FORM',
  };

  const current = safeRead();
  const next = [nextRequest, ...current];
  safeWrite(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexusbank-support-updated'));
  }

  return nextRequest;
};

export const updateSupportRequest = (requestId, updates) => {
  const current = safeRead();
  const next = current.map((item) => (
    item.id === requestId ? { ...item, ...updates } : item
  ));
  safeWrite(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexusbank-support-updated'));
  }

  return next;
};
