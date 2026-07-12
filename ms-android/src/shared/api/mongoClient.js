import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";
import { ENDPOINTS } from "../constants/endpoints";

const mongoClient = axios.create({
    baseURL: ENDPOINTS.MONGO_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

mongoClient.interceptors.request.use(async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Igual que userClient.js: ms-mongo no emite/renueva tokens, así que el
// refresh sigue apuntando al auth de ms-postgres (fuente única del JWT).
mongoClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return mongoClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync("refreshToken");
                if (!refreshToken) throw new Error("No refresh token");

                const { data } = await axios.post(`${ENDPOINTS.BASE}/auth/refresh`, {
                    refreshToken,
                });

                if (data?.accessToken) {
                    useAuthStore.getState().setAccessToken(data.accessToken);
                    if (data.refreshToken) {
                        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
                    }
                    processQueue(null, data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return mongoClient(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                await SecureStore.deleteItemAsync("refreshToken");
                await useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default mongoClient;
