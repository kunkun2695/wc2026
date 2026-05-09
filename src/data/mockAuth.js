import API_URL from '../config';
const API_URL_FULL = `${API_URL}/api`;

export const mockAuth = {
  register: async (userData) => {
    const response = await fetch(`${API_URL_FULL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  login: async (username, password) => {
    const response = await fetch(`${API_URL_FULL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    // Lưu token vào localStorage
    localStorage.setItem('wc2026_token', data.token);
    localStorage.setItem('wc2026_session', JSON.stringify(data.user));
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('wc2026_token');
    localStorage.removeItem('wc2026_session');
  },

  getCurrentUser: () => {
    const session = localStorage.getItem('wc2026_session');
    return session ? JSON.parse(session) : null;
  },

  setToken: (token) => {
    localStorage.setItem('wc2026_token', token);
  },

  setUser: (user) => {
    localStorage.setItem('wc2026_session', JSON.stringify(user));
  },

  getToken: () => localStorage.getItem('wc2026_token')
};
