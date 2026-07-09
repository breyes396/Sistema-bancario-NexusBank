const STORAGE_KEY = 'nexusbank_reversal_requests';

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

  return `rv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const emitUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexusbank-reversals-updated'));
  }
};

const normalizeType = (type) => {
  const normalized = String(type || '').toUpperCase();
  if (normalized.includes('DEPOS')) return 'DEPOSITO';
  return 'TRANSFERENCIA';
};

export const getReversalRequests = () => safeRead();

export const getReversalRequestsByUser = ({ userId, email }) => {
  const normalizedUserId = String(userId || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  return safeRead().filter((item) => {
    if (normalizedUserId && String(item.userId || '') === normalizedUserId) return true;
    if (normalizedEmail && String(item.userEmail || '').toLowerCase() === normalizedEmail) return true;
    return false;
  });
};

export const addReversalRequest = (payload) => {
  const type = normalizeType(payload.type);
  const operationId = String(payload.operationId || payload.reference || '').trim();
  const amount = Number(payload.amount || 0);
  const reason = String(payload.reason || '').trim();

  if (!operationId) {
    throw new Error('No se pudo identificar la operación a revertir.');
  }

  if (!reason) {
    throw new Error('Debes indicar un motivo de reversión.');
  }

  const current = safeRead();
  const duplicatedPending = current.find((item) => (
    String(item.operationId) === operationId
    && String(item.type) === type
    && String(item.status) === 'PENDING'
  ));

  if (duplicatedPending) {
    throw new Error('Ya existe una solicitud pendiente para esta operación.');
  }

  const nextRequest = {
    id: makeId(),
    type,
    operationId,
    reference: String(payload.reference || operationId),
    amount: Number.isFinite(amount) ? amount : 0,
    accountNumber: String(payload.accountNumber || ''),
    sourceAccountNumber: String(payload.sourceAccountNumber || ''),
    destinationAccountNumber: String(payload.destinationAccountNumber || ''),
    operationDate: payload.operationDate || new Date().toISOString(),
    operationDescription: String(payload.operationDescription || ''),
    reason,
    userId: payload.userId || null,
    userEmail: String(payload.userEmail || '').toLowerCase(),
    userName: payload.userName || null,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    adminComment: null,
    source: 'CLIENT_ACTION'
  };

  const next = [nextRequest, ...current];
  safeWrite(next);
  emitUpdated();

  return nextRequest;
};

export const updateReversalRequest = (requestId, updates) => {
  const current = safeRead();
  const next = current.map((item) => {
    if (item.id !== requestId) return item;

    const nextStatus = updates.status ? String(updates.status).toUpperCase() : item.status;

    return {
      ...item,
      ...updates,
      status: nextStatus,
      resolvedAt: ['APPROVED', 'REJECTED'].includes(nextStatus)
        ? (updates.resolvedAt || new Date().toISOString())
        : (updates.resolvedAt || item.resolvedAt),
    };
  });

  safeWrite(next);
  emitUpdated();

  return next;
};

export const getLatestReversibleTransaction = (transactions = []) => {
  const candidates = Array.isArray(transactions)
    ? transactions.filter((tx) => {
        const type = String(tx?.type || tx?.kind || tx?.operationType || '').toUpperCase();
        return type === 'DEPOSITO' || type.includes('TRANSFERENCIA');
      })
    : [];

  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || left?.date || left?.updatedAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || right?.date || right?.updatedAt || 0).getTime();

    return rightTime - leftTime;
  })[0] || null;
};

export const isReversalApproved = (operationIdOrReference) => {
  const target = String(operationIdOrReference || '').trim();
  if (!target || target === 'undefined' || target === 'null') return false;

  const requests = safeRead();
  if (!Array.isArray(requests)) return false;

  return requests.some((item) => {
    const opId = String(item.operationId || '').trim();
    const ref = String(item.reference || '').trim();
    const status = String(item.status || '').toUpperCase();

    // Check if the target matches either the internal operationId or the public reference
    return (opId === target || ref === target) && status === 'APPROVED';
  });
};

export const hasReversalRequest = (operationIdOrReference) => {
  const target = String(operationIdOrReference || '').trim();
  if (!target || target === 'undefined' || target === 'null') return false;

  const requests = safeRead();
  if (!Array.isArray(requests)) return false;

  return requests.some((item) => {
    const opId = String(item.operationId || '').trim();
    const ref = String(item.reference || '').trim();
    const status = String(item.status || '').toUpperCase();

    // Any request that is not rejected counts as an existing reversal attempt
    return (opId === target || ref === target) && (status === 'PENDING' || status === 'APPROVED');
  });
};
