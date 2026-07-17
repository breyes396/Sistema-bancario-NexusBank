const BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3007/api/v1";
const MONGO_BASE = process.env.EXPO_PUBLIC_MONGO_API_URL || "http://10.0.2.2:3006/api/v1";

export const ENDPOINTS = {
    BASE,
    MONGO_BASE,
    AUTH: `${BASE}/auth`,
    ACCOUNTS: `${BASE}/accounts`,
    DEPOSITS: `${BASE}/accounts/deposit-requests`,
    FAVORITES: `${MONGO_BASE}/favorites`,
    CATALOG: `${MONGO_BASE}/catalog`,
};
