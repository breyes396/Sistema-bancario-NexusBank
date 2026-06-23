const BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3007/api/v1";

export const ENDPOINTS = {
    BASE,
    AUTH: `${BASE}/auth`,
    ACCOUNTS: `${BASE}/accounts`,
    DEPOSITS: `${BASE}/accounts/deposit-requests`,
};
