import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";
import { ENDPOINTS } from "../constants/endpoints";

const authClient = axios.create({
    baseURL: ENDPOINTS.BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: attach accessToken from Zustand store
authClient.interceptors.request.use(async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401 and refresh token automatically
authClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";

        const isAuthEndpoint =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/verify-email");

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync("refreshToken");
                if (!refreshToken) {
                    throw new Error("No refresh token stored");
                }

                // Call refresh endpoint on ms-postgres
                const { data } = await axios.post(`${ENDPOINTS.BASE}/auth/refresh`, {
                    refreshToken,
                });

                if (data && data.accessToken) {
                    useAuthStore.getState().setAccessToken(data.accessToken);
                    if (data.refreshToken) {
                        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
                    }
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return authClient(originalRequest);
                }
            } catch (refreshError) {
                // If refreshing fails, log out the user
                await SecureStore.deleteItemAsync("refreshToken");
                await useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default authClient;
