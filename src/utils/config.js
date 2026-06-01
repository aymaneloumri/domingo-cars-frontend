export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const imgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) return API_BASE + url;
  return url;
};
