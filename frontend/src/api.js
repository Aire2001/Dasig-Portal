const BASE = 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('dasig_token');
}

function headers(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (body) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    updateProfile: (body) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
    changePassword: (body) =>
      request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
    myRegistrations: () => request('/auth/my-registrations'),
    myEnrollments: () => request('/auth/my-enrollments'),
    forgotPassword: (email) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, new_password) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  },
  events: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/events${q.toString() ? '?' + q : ''}`);
    },
    get: (id) => request(`/events/${id}`),
    create: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/events/${id}`, { method: 'DELETE' }),
    register: (id) => request(`/events/${id}/register`, { method: 'POST' }),
    unregister: (id) => request(`/events/${id}/register`, { method: 'DELETE' }),
    registrations: (id) => request(`/events/${id}/registrations`),
    markAttendance: (eventId, userId, attended) =>
      request(`/events/${eventId}/attend/${userId}`, { method: 'POST', body: JSON.stringify({ attended }) }),
    markAttendSelf: (id) => request(`/events/${id}/attend-self`, { method: 'POST' }),
  },
  news: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/news${q.toString() ? '?' + q : ''}`);
    },
    get: (id) => request(`/news/${id}`),
    create: (body) => request('/news', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/news/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/news/${id}`, { method: 'DELETE' }),
  },
  training: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/training${q.toString() ? '?' + q : ''}`);
    },
    get: (id) => request(`/training/${id}`),
    create: (body) => request('/training', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/training/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/training/${id}`, { method: 'DELETE' }),
    enroll: (id) => request(`/training/${id}/enroll`, { method: 'POST' }),
    unenroll: (id) => request(`/training/${id}/enroll`, { method: 'DELETE' }),
    enrollments: (id) => request(`/training/${id}/enrollments`),
  },
  members: {
    list: () => request('/members'),
    get: (id) => request(`/members/${id}`),
  },
  membership: {
    status: () => request('/membership/status'),
    apply: (body) => request('/membership/apply', { method: 'POST', body: JSON.stringify(body) }),
    applications: () => request('/membership/applications'),
    approve: (id) => request(`/membership/applications/${id}/approve`, { method: 'PATCH' }),
    reject: (id) => request(`/membership/applications/${id}/reject`, { method: 'PATCH' }),
  },
  policies: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/policies${q.toString() ? '?' + q : ''}`);
    },
    get: (id) => request(`/policies/${id}`),
    create: (body) => request('/policies', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    archive: (id, archived) => request(`/policies/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
    delete: (id) => request(`/policies/${id}`, { method: 'DELETE' }),
  },
  funding: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/funding${q.toString() ? '?' + q : ''}`);
    },
    get: (id) => request(`/funding/${id}`),
    create: (body) => request('/funding', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/funding/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/funding/${id}`, { method: 'DELETE' }),
  },
  partnerships: {
    list: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/partnerships${q.toString() ? '?' + q : ''}`);
    },
    get: (id) => request(`/partnerships/${id}`),
    create: (body) => request('/partnerships', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/partnerships/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/partnerships/${id}`, { method: 'DELETE' }),
  },
  admin: {
    stats: () => request('/admin/stats'),
    users: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v && v !== 'All')));
      return request(`/admin/users${q.toString() ? '?' + q : ''}`);
    },
    getUser: (id) => request(`/admin/users/${id}`),
    changeRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    suspend: (id) => request(`/admin/users/${id}/suspend`, { method: 'PATCH' }),
    activate: (id) => request(`/admin/users/${id}/activate`, { method: 'PATCH' }),
    renewMembership: (id) => request(`/admin/users/${id}/renew`, { method: 'PATCH' }),
    renewals: () => request('/admin/renewals'),
    reportEvents: () => request('/admin/reports/events'),
    reportTraining: () => request('/admin/reports/training'),
    reportChatbot: () => request('/admin/reports/chatbot'),
  },
  chatbot: {
    send: (message) => request('/chatbot/message', { method: 'POST', body: JSON.stringify({ message }) }),
    intents: () => request('/chatbot/intents'),
  },
};
