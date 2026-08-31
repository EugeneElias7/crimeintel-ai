import axios from "axios";
import { getToken, setTokenValue } from "../store/authStore";

// Determine the correct API base URL
function getApiBaseUrl(): string {
  // In development, use relative path to go through Vite proxy
  if (import.meta.env.DEV) {
    return "/api/v1";
  }
  // In production, use the configured URL
  return import.meta.env.VITE_API_URL || "/api/v1";
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 405 Method Not Allowed - likely wrong server or missing proxy
    if (error.response?.status === 405) {
      console.error(
        "API 405: The request went to a server that doesn't have this endpoint. " +
          "In development, ensure you're using 'npm run dev' on port 5173. " +
          "In production, ensure the backend is running and accessible."
      );
    }
    if (error.response?.status === 403) {
      console.error(
        "API 403: Request blocked by CSRF/CORS. " +
          "Ensure the frontend origin matches ALLOWED_ORIGINS in backend .env"
      );
    }
    if (error.response?.status === 401) {
      const url = (error.config as any)?.url ?? "";
      const isPublicAuthEndpoint = [
        "/auth/login",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/reset-password/direct",
        "/auth/register",
        "/auth/verify-identity",
      ].some((p) => url.includes(p));
      if (isPublicAuthEndpoint) {
        return Promise.reject(error);
      }
      setTokenValue(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;