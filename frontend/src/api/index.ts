import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (data: URLSearchParams) => api.post('/users/login', data),
  register: (data: any) => api.post('/users/register', data),
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  listUsers: () => api.get('/users'),
  updateUserRole: (userId: string, role: string) => api.put(`/users/${userId}/role`, null, { params: { role } }),
};

export const documentApi = {
  list: (params?: any) => api.get('/documents', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  create: (data: any) => api.post('/documents', data),
  update: (id: string, data: any) => api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  getStats: () => api.get('/documents/stats'),
  toggleArchive: (id: string) => api.post(`/documents/${id}/toggle-archive`),
};

export const loanApi = {
  list: () => api.get('/loans'),
  create: (data: any) => api.post('/loans', data),
  return: (id: string) => api.put(`/loans/${id}/return`),
  myLoans: () => api.get('/loans/my-loans'),
};

export const aiApi = {
  query: (question: string, top_k: number = 5) => 
    api.post('/ai/query', { question, top_k }, { responseType: 'stream' }),
  getRecommendations: (userId: string) => api.get(`/ai/recommendations/${userId}`),
  getSummary: (docId: string) => api.post(`/ai/summary/${docId}`),
};

export default api;
