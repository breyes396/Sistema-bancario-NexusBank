import { randomBytes } from 'crypto';

export const generateShortUUID = () => {
  const alphabet = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const bytes = randomBytes(12);
  let result = '';

  for (let i = 0; i < 12; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }

  return result;
};

export const generateUserId = () => {
  return `usr_${generateShortUUID()}`;
};

export const generateProfileId = () => {
  return `prf_${generateShortUUID()}`;
};

export const generateEmailId = () => {
  return `eml_${generateShortUUID()}`;
};

export const generateRoleId = () => {
  return `rol_${generateShortUUID()}`;
};

export const generateAccountId = () => {
  return `acc_${generateShortUUID()}`;
};

export const generateResetId = () => {
  return `rst_${generateShortUUID()}`;
};

export const generateCatalogId = () => {
  return `cat_${generateShortUUID()}`;
};

export const generateTransactionId = () => {
  return `trx_${generateShortUUID()}`;
};

export const generateAuditId = () => {
  return `aud_${generateShortUUID()}`;
};

export const generateAccountLimitAuditId = () => {
  return `ala_${generateShortUUID()}`;
};

export const generateFavoriteId = () => {
  return `fav_${generateShortUUID()}`;
};

export const isValidUserId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const pattern = /^usr_[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{12}$/;
  return pattern.test(id);
};
