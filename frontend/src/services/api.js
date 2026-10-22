const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('serp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (name, email, password, role) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role })
  }),
  getMe: () => request('/api/auth/me'),
  getDemoAccounts: () => request('/api/auth/demo-accounts'),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/events${query ? `?${query}` : ''}`);
  },
  getEventById: (id) => request(`/api/events/${id}`),
  createEvent: (eventData) => request('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }),
  deleteEvent: (id) => request(`/api/events/${id}`, {
    method: 'DELETE'
  }),
  getAttendees: (eventId) => request(`/api/events/${eventId}/attendees`),
  getExportUrl: (eventId) => `${API_BASE}/api/events/${eventId}/export`,

  // Registrations
  bookTicket: (eventId) => request('/api/registrations', {
    method: 'POST',
    body: JSON.stringify({ eventId })
  }),
  getMyRegistrations: () => request('/api/registrations/my'),
  verifyTicket: ({ qrToken, ticketCode }) => request('/api/registrations/verify', {
    method: 'POST',
    body: JSON.stringify({ qrToken, ticketCode })
  }),
  cancelTicket: (registrationId) => request(`/api/registrations/${registrationId}`, {
    method: 'DELETE'
  }),

  // Telemetry & Benchmark
  getTelemetry: () => request('/api/metrics'),
  runStressTest: (concurrency = 25, seats = 3) => request('/api/stress-test/run', {
    method: 'POST',
    body: JSON.stringify({ concurrency, seats })
  })
};
