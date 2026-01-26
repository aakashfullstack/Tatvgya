const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper function for public API calls (no credentials)
const publicApiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
};

// Helper function for authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
};

// Public APIs (no auth required)
export const getStats = () => publicApiCall('/stats');
export const getSubjects = () => publicApiCall('/subjects');
export const getSubject = (id) => publicApiCall(`/subjects/${id}`);

// Article APIs
export const getArticles = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/articles/?${query}`);
};

export const getArticle = (idOrSlug) => apiCall(`/articles/${idOrSlug}`);
export const getRelatedArticles = (articleId, limit = 4) => apiCall(`/articles/related/${articleId}?limit=${limit}`);
export const likeArticle = (articleId) => apiCall(`/articles/${articleId}/like`, { method: 'POST' });
export const bookmarkArticle = (articleId) => apiCall(`/articles/${articleId}/bookmark`, { method: 'POST' });

// Educator APIs
export const getEducators = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/educators/?${query}`);
};

export const getEducator = (id) => apiCall(`/educators/${id}`);
export const getEducatorArticles = (educatorId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/educators/${educatorId}/articles?${query}`);
};

// Educator CMS APIs
export const getMyProfile = () => apiCall('/educators/me/profile');
export const updateMyProfile = (data) => apiCall('/educators/me/profile', {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const getMyArticles = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/educators/me/articles?${query}`);
};
export const createArticle = (data) => apiCall('/educators/me/articles', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateArticle = (articleId, data) => apiCall(`/educators/me/articles/${articleId}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteArticle = (articleId) => apiCall(`/educators/me/articles/${articleId}`, {
  method: 'DELETE',
});
export const getMyStats = () => apiCall('/educators/me/stats');

// Student APIs
export const getStudentProfile = () => apiCall('/students/me/profile');
export const updateInterests = (subjectIds) => apiCall('/students/me/interests', {
  method: 'PUT',
  body: JSON.stringify(subjectIds),
});
export const getLikedArticles = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/students/me/liked?${query}`);
};
export const getBookmarkedArticles = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/students/me/bookmarked?${query}`);
};
export const getReadingHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/students/me/history?${query}`);
};
export const reportArticle = (data) => apiCall('/students/report', {
  method: 'POST',
  body: JSON.stringify(data),
});

// Admin APIs
export const getAdminStats = () => apiCall('/admin/stats');
export const getAdminDashboard = () => apiCall('/admin/dashboard');

export const getAdminEducators = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/admin/educators?${query}`);
};
export const createEducator = (data) => apiCall('/admin/educators', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateEducator = (educatorId, data) => apiCall(`/admin/educators/${educatorId}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteEducator = (educatorId) => apiCall(`/admin/educators/${educatorId}`, {
  method: 'DELETE',
});

export const getAdminArticles = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/admin/articles?${query}`);
};
export const articleAction = (articleId, action, reason = null) => apiCall(`/admin/articles/${articleId}/action`, {
  method: 'POST',
  body: JSON.stringify({ action, reason }),
});

export const getReports = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/admin/reports?${query}`);
};
export const reportAction = (reportId, action, note = null) => apiCall(`/admin/reports/${reportId}/action`, {
  method: 'POST',
  body: JSON.stringify({ action, note }),
});

export const getContactQueries = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/admin/contact-queries?${query}`);
};
export const updateContactQuery = (queryId, status) => apiCall(`/admin/contact-queries/${queryId}?status=${status}`, {
  method: 'PUT',
});

export const getModerationLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/admin/moderation-logs?${query}`);
};

// Contact API
export const submitContact = (data) => apiCall('/contact', {
  method: 'POST',
  body: JSON.stringify(data),
});
