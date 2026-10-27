const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('spar_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('spar_token', token);
  } else {
    localStorage.removeItem('spar_token');
  }
}

export function getStoredUser() {
  const data = localStorage.getItem('spar_user');
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('spar_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('spar_user');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    if (endpoint !== '/auth/login') {
      // Token might be expired or invalid
      // setToken(null);
      // setStoredUser(null);
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

// Authentication API
export const authApi = {
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  getMe: () => apiRequest('/auth/me'),
  getDemoUsers: () => apiRequest('/auth/demo-users'),
  quickSwitch: (userId) =>
    apiRequest('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
};

// Issues API
export const issuesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/issues${qs ? `?${qs}` : ''}`);
  },
  getSummary: (branchId) => {
    const qs = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/issues/summary${qs}`);
  },
  getById: (id) => apiRequest(`/issues/${id}`),
  create: (data) =>
    apiRequest('/issues', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateStatus: (id, status, note) =>
    apiRequest(`/issues/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    }),
  confirmReceive: (id, data) =>
    apiRequest(`/issues/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  reportProblem: (id, data) =>
    apiRequest(`/issues/${id}/problem`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

// Branches API
export const branchesApi = {
  getAll: () => apiRequest('/branches'),
  getById: (id) => apiRequest(`/branches/${id}`),
  create: (data) =>
    apiRequest('/branches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    apiRequest(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  addSlot: (branchId, slotData) =>
    apiRequest(`/branches/${branchId}/slots`, {
      method: 'POST',
      body: JSON.stringify(slotData)
    }),
  deleteSlot: (branchId, slotId) =>
    apiRequest(`/branches/${branchId}/slots/${slotId}`, {
      method: 'DELETE'
    })
};

// Types & Sizes API
export const typesAndSizesApi = {
  getItemTypes: () => apiRequest('/item-types'),
  createItemType: (data) =>
    apiRequest('/item-types', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateItemType: (id, data) =>
    apiRequest(`/item-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getHoardingSizes: () => apiRequest('/hoarding-sizes'),
  createHoardingSize: (data) =>
    apiRequest('/hoarding-sizes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateHoardingSize: (id, data) =>
    apiRequest(`/hoarding-sizes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};

// Reports API
export const reportsApi = {
  getOutstanding: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/reports/outstanding${qs ? `?${qs}` : ''}`);
  },
  getBranchHistory: () => apiRequest('/reports/branch-history'),
  getCampaignHistory: () => apiRequest('/reports/campaign-history'),
  exportCsvUrl: (type = 'all', month = '', branchId = '') =>
    `/api/reports/export?type=${type}&month=${month}&branch_id=${branchId}`
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'POST' })
};

// Users API
export const usersApi = {
  getAll: () => apiRequest('/users'),
  create: (data) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};

// Settings API
export const settingsApi = {
  get: () => apiRequest('/settings'),
  save: (data) =>
    apiRequest('/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
