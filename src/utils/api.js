import axios from 'axios';
import { getToken } from './auth';
import { API_BASE } from './config';

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers['x-admin-token'] = token;
  return config;
});

export default api;
