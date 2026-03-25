import axios from 'axios';
import type { AuthResponse, LoginData, RegisterData, User, Category, Bookmark } from '../types';
import { isAuthError, logError } from '../utils/error-handler';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 添加设备指纹到请求头
    const fingerprint = localStorage.getItem('device_fingerprint');
    if (fingerprint) {
      config.headers['x-fingerprint'] = fingerprint;
    }
    return config;
  },
  (error) => {
    logError(error, '请求拦截器');
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 记录错误
    logError(error, 'API 响应');

    // 认证错误处理
    if (error.response?.status === 401) {
      console.log('认证失败，清除token');
      // 清除过期的 token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 不要强制跳转，让 AuthContext 重新尝试自动登录
    } else if (error.response?.status === 403) {
      console.log('设备指纹不匹配');
      // 设备指纹不匹配，清除认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

// 认证相关API
export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  autoLogin: async (): Promise<AuthResponse> => {
    const response = await api.post('/auth/auto-login');
    return response.data;
  },
  
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// 设备同步相关API
export const syncApi = {
  getSyncCode: async (): Promise<{ fingerprint: string; syncCode: string }> => {
    const response = await api.get('/sync/code');
    return response.data;
  },
  
  bindDevice: async (syncCode: string): Promise<{ message: string; device: any }> => {
    const response = await api.post('/sync/bind', { syncCode });
    return response.data;
  },
  
  regenerateSyncCode: async (): Promise<{ message: string; syncCode: string }> => {
    const response = await api.post('/sync/regenerate');
    return response.data;
  },
  
  getLinkedDevices: async (): Promise<{ mainDevice: any; linkedDevices: any[] }> => {
    const response = await api.get('/sync/devices');
    return response.data;
  },
  
  unbindDevice: async (deviceFingerprint: string): Promise<void> => {
    await api.delete(`/sync/unbind/${deviceFingerprint}`);
  },
};

// 分类相关API
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  create: async (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// 收藏相关API
export const bookmarkApi = {
  getAll: async (params?: { categoryId?: string; search?: string }): Promise<Bookmark[]> => {
    const response = await api.get('/bookmarks', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<Bookmark> => {
    const response = await api.get(`/bookmarks/${id}`);
    return response.data;
  },
  
  create: async (data: Omit<Bookmark, 'id' | 'userId' | 'visitCount' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> => {
    const response = await api.post('/bookmarks', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Bookmark>): Promise<Bookmark> => {
    const response = await api.put(`/bookmarks/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/bookmarks/${id}`);
  },
  
  incrementVisit: async (id: string): Promise<void> => {
    await api.post(`/bookmarks/${id}/visit`);
  },
  
  search: async (query: string): Promise<Bookmark[]> => {
    const response = await api.get('/bookmarks/search', { params: { q: query } });
    return response.data;
  },
  
  export: async (): Promise<Blob> => {
    const response = await api.get('/bookmarks/export', { responseType: 'blob' });
    return new Blob([response.data], { type: 'application/json' });
  },
  
  import: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/bookmarks/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default {
  authApi,
  syncApi,
  categoryApi,
  bookmarkApi,
};