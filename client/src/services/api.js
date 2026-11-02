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
    }),
  delete: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE'
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

// Upload API
export const uploadApi = {
  // Uploads go straight from the browser to Supabase Storage via a signed URL,
  // so large files never pass through the API server (Vercel caps bodies at 4.5MB).
  uploadFile: async (file) => {
    const { upload_url, public_url } = await apiRequest('/upload/sign', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, size: file.size, type: file.type })
    });

    const response = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-upsert': 'false'
      },
      body: file
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Upload failed (${response.status})`);
    }

    return { url: public_url, filename: file.name, size: file.size, storage: 'supabase' };
  },

  // Legacy path through the API server; only works for files under ~4MB on Vercel
  uploadFileViaServer: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Upload failed (${response.status})`);
    }
    return data; // { url, filename, size, storage }
  }
};

// Downloadable file libraries (Private Labels, Leaflets) share one REST shape
function createLibraryApi(key) {
  return {
    key,
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'All') query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      const qs = query.toString();
      return apiRequest(`/${key}${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => apiRequest(`/${key}/${id}`),
    create: (data) =>
      apiRequest(`/${key}`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      apiRequest(`/${key}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/${key}/${id}`, {
        method: 'DELETE'
      })
  };
}

export const privateLabelsApi = createLibraryApi('private-labels');
export const leafletsApi = createLibraryApi('leaflets');

