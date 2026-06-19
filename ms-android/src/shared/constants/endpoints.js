export const ENDPOINTS = {
    BASE: process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3007/api/v1",
    AUTH: process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/auth` : "http://10.0.2.2:3007/api/v1/auth",
};
