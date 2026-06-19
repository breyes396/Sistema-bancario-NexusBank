const BLOCKING_THRESHOLDS = {
  failedAttempts: 3,
  blockingDuration: 30 * 60 * 1000,
  timeWindow: 60 * 60 * 1000,
  rapidTransactionWindow: 5 * 60 * 1000,
  rapidTransactionLimit: 3,
  unusualAmountThreshold: 1.5
};

export const recordFailedTransaction = async () => {
  return { blocked: false };
};

export const isUserBlocked = async () => {
  return { blocked: false };
};

export const detectFraudPatterns = async () => {
  return [];
};

export const createFraudAlert = async () => {
  return null;
};

export const getUserFraudAlerts = async () => {
  return [];
};

export const getUserFailedAttempts = async () => {
  return [];
};

export const unblockUser = async () => {
  return true;
};

export const resolveFraudAlert = async () => {
  return true;
};

export default {
  recordFailedTransaction,
  isUserBlocked,
  detectFraudPatterns,
  createFraudAlert,
  getUserFraudAlerts,
  getUserFailedAttempts,
  unblockUser,
  resolveFraudAlert,
  BLOCKING_THRESHOLDS
};
