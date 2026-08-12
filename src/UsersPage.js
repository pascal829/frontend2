import { useState, useEffect } from 'react';
import { api } from './api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'technicien' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createUser(formData.email, formData.password, formData.name, formData.role);
      setSuccess(`Compte créé pour ${formData.name}`);
      setFormData({ email: '', password: '', name: '', role: 'technicien' });
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Supprimer le compte de ${userName} ?`)) {
      try {
        await api.deleteUser(userId);
        setSuccess(`Compte de ${userName} supprimé`);
        setError('');
        loadUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>Gestion des utilisateurs</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nouvel utilisateur</button>
      </div>

      {success && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className="table-container">
        <div className="table-header">Utilisateurs ({users.length})</div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className={u.role === 'admin' ? 'badge badge-blue' : 'badge badge-green'}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  <button
                    className="btn-secondary"
                    style={{ color: 'red', borderColor: 'red', fontSize: '13px' }}
                    onClick={() => handleDelete(u.id, u.name)}
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Créer un utilisateur</h2>

            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom complet *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Mot de passe *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
                </div>
                <div className="form-group">
                  <label>Rôle</label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="technicien">Technicien</option>
                    <option value="admin">Administrateur</option>
                    <option value="bureau">Bureau</option>
                  </select>
                </div>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setError(''); }}>Annuler</button>
                <button type="submit" className="btn-primary">Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}