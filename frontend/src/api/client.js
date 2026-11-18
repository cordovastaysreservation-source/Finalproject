import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isLocalhost ? 'http://localhost:8000/api/v1' : '/api/v1');
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || (isLocalhost ? 'http://localhost:8000' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

// Fast in-memory + sessionStorage cache for instant 0ms page transitions
const memoryCache = new Map();

export const cachedGet = async (url, config = {}, ttlMs = 60000) => {
  const key = url + JSON.stringify(config.params || {});
  const now = Date.now();

  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (now - entry.time < ttlMs) {
      return entry.data;
    }
  }

  try {
    const saved = sessionStorage.getItem('cs_cache_' + key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (now - parsed.time < ttlMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // ignore storage errors
  }

  const res = await api.get(url, config);
  const entry = { time: now, data: res.data };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem('cs_cache_' + key, JSON.stringify(entry));
  } catch {
    // ignore quota errors
  }
  return res.data;
};

export const clearApiCache = () => {
  memoryCache.clear();
  Object.keys(sessionStorage).forEach((k) => {
    if (k.startsWith('cs_cache_')) sessionStorage.removeItem(k);
  });
};

// Preload critical resort images into browser memory immediately on startup
const PRELOAD_IMAGES = [
  '/images/resorts/eventesia-garden.jpg',
  '/images/resorts/casa-ragina.jpg',
  '/images/resorts/cordova-home-village.jpg',
  '/images/resorts/cordova-reef-village.jpg',
  '/images/resorts/villa-asela.jpg',
  '/images/resorts/flores-villa.jpg',
  '/images/resorts/alta-resort.jpg',
  '/images/resorts/solea-resort.jpg',
  '/images/resorts/gitika-resort.jpg',
  '/images/resorts/qr-code.jpg',
];

if (typeof window !== 'undefined') {
  setTimeout(() => {
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, 100);
}

api.interceptors.request.use((config) => {
  const isAdminRoute = config.url?.startsWith('/admin') || window.location.pathname.startsWith('/admin');
  const token = isAdminRoute
    ? localStorage.getItem('cs_admin_token') || localStorage.getItem('cs_token')
    : localStorage.getItem('cs_token') || localStorage.getItem('cs_admin_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (['post', 'put', 'delete'].includes(response.config?.method?.toLowerCase())) {
      clearApiCache();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin/login') {
        localStorage.removeItem('cs_admin_token');
        localStorage.removeItem('cs_admin_user');
        window.location.href = '/admin/login';
      } else if (!path.startsWith('/admin') && !path.startsWith('/auth')) {
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${BACKEND_URL}${path}`;
  return path;
};

export default api;
