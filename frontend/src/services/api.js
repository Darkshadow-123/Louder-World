import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://louder-world-backend-cgmk.onrender.com/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  googleLogin: () => `${API_BASE_URL}/api/auth/google`,
  getMe: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

export const eventsAPI = {
  getEvents: (params) => api.get('/api/events', { params }),
  getFeaturedEvents: () => api.get('/api/events/featured'),
  getEvent: (id) => api.get(`/api/events/${id}`),
  getCategories: () => api.get('/api/events/categories'),
  getStats: () => api.get('/api/events/stats'),
  importEvent: (eventId, notes) => api.post('/api/events/import', { eventId, notes }),
  createLead: (email, consent, eventId) => api.post('/api/events/leads', { email, consent, eventId }),
  filterEvents: (filters) => api.get('/api/events/dashboard/filter', { params: filters }),
};

export const adminAPI = {
  getScrapingStatus: () => api.get('/api/admin/status'),
  runScraper: (scraper) => api.post('/api/admin/run', { scraper }),
  runCleanup: () => api.post('/api/admin/cleanup'),
};

export default api;
