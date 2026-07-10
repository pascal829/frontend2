const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur serveur');
  }

  return data;
}

export const api = {
  // Authentification
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Gestion des utilisateurs (admin uniquement)
  createUser: (email, password, name, role) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),
  getAdminUsers: () => request('/auth/users'),

  // Liste simplifiée pour tous (sélecteur technicien)
  getUsers: () => request('/users'),

  // Machines
  getMachines: () => request('/machines'),
  createMachine: (machine) =>
    request('/machines', { method: 'POST', body: JSON.stringify(machine) }),
  updateMachine: (id, machine) =>
    request(`/machines/${id}`, { method: 'PUT', body: JSON.stringify(machine) }),
  deleteMachine: (id) =>
    request(`/machines/${id}`, { method: 'DELETE' }),

  // Interventions
  getInterventions: () => request('/interventions'),
  createIntervention: (intervention) =>
    request('/interventions', { method: 'POST', body: JSON.stringify(intervention) }),

    // >Suppression
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),

};

