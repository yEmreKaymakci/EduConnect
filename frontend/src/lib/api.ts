import axios, { AxiosInstance, AxiosError } from 'axios';
import { auth } from './auth';

// ── Service URL Defaults (fallback to localhost for dev) ──────
const SERVICE_URLS = {
  auth:   process.env.NEXT_PUBLIC_AUTH_SERVICE_URL   || 'http://127.0.0.1:8001',
  user:   process.env.NEXT_PUBLIC_USER_SERVICE_URL   || 'http://127.0.0.1:8002',
  file:   process.env.NEXT_PUBLIC_FILE_SERVICE_URL   || 'http://127.0.0.1:8003',
  ai:     process.env.NEXT_PUBLIC_AI_SERVICE_URL     || 'http://127.0.0.1:8004',
  health: process.env.NEXT_PUBLIC_HEALTH_SERVICE_URL || 'http://127.0.0.1:8007',
};

// ── Axios instance factory ───────────────────────────────────
function createApiClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach JWT token on every request
  instance.interceptors.request.use(
    (config) => {
      const token = auth.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle 401 globally — redirect to login
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        auth.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// ── Named API clients ─────────────────────────────────────────
export const authApi   = createApiClient(SERVICE_URLS.auth);
export const userApi   = createApiClient(SERVICE_URLS.user);
export const fileApi   = createApiClient(SERVICE_URLS.file);
export const aiApi     = createApiClient(SERVICE_URLS.ai);
export const healthApi = createApiClient(SERVICE_URLS.health);

// ── File upload helper (multipart/form-data) ──────────────────
export const uploadFile = async (file: File, userId: number) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = auth.getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  return axios.post(
    `${SERVICE_URLS.file}/api/v1/files/upload?user_id=${userId}`,
    formData,
    { headers, timeout: 60000 }
  );
};

// ── Error message extractor ───────────────────────────────────
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail))      return data.detail[0]?.msg ?? 'Hata oluştu.';
    if (err.code === 'ECONNABORTED')      return 'Sunucu zaman aşımına uğradı. Lütfen tekrar deneyin.';
    if (!err.response)                    return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    if (err.response.status === 500)      return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    if (err.response.status === 403)      return 'Bu işlem için yetkiniz yok.';
    if (err.response.status === 404)      return 'İstenen kaynak bulunamadı.';
  }
  return 'Beklenmeyen bir hata oluştu.';
}
