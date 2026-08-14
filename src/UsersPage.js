import { useState, useEffect } from 'react';
import { api } from './api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Formulaire création utilisateur
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'technicien'
  });

  // Réinitialisation mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // ==============================
  // FORMULAIRE CRÉATION UTILISATEUR
  // ==============================

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    try {
      await api.createUser(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      );

      setSuccess(`Compte créé pour ${formData.name}`);

      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'technicien'
      });

      setShowForm(false);

      loadUsers();

    } catch (err) {
      setError(err.message);
    }
  };

  // ==============================
  // SUPPRESSION UTILISATEUR
  // ==============================

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

  // ==============================
  // OUVERTURE RÉINITIALISATION
  // ==============================

  const openPasswordReset = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowPasswordForm(true);
  };

  // ==============================
  // RÉINITIALISATION MOT DE PASSE
  // ==============================

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      await api.resetUserPassword(
        selectedUser.id,
        newPassword
      );

      setSuccess(
        `Mot de passe de ${selectedUser.name} réinitialisé avec succès.`
      );

      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setSelectedUser(null);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>

      {/* ==============================
          EN-TÊTE
      ============================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 'bold'
          }}
        >
          Gestion des utilisateurs
        </h2>

        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(true);
            setError('');
          }}
        >
          + Nouvel utilisateur
        </button>
      </div>


      {/* ==============================
          MESSAGE SUCCÈS
      ============================== */}

      {success && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          {success}
        </div>
      )}


      {/* ==============================
          MESSAGE ERREUR
      ============================== */}

      {error && !showForm && !showPasswordForm && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          {error}
        </div>
      )}


      {/* ==============================
          LISTE DES UTILISATEURS
      ============================== */}

      <div className="table-container">

        <div className="table-header">
          Utilisateurs ({users.length})
        </div>

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

                <td>
                  <strong>{u.name}</strong>
                </td>

                <td>
                  {u.email}
                </td>

                <td>

                  <span
                    className={
                      u.role === 'admin'
                        ? 'badge badge-blue'
                        : u.role === 'bureau'
                        ? 'badge badge-yellow'
                        : 'badge badge-green'
                    }
                  >
                    {u.role}
                  </span>

                </td>

                <td>
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>

                <td>

                  {/* BOUTON RÉINITIALISATION */}

                  <button
                    className="btn-secondary"
                    style={{
                      marginRight: '8px',
                      fontSize: '13px'
                    }}
                    onClick={() => openPasswordReset(u)}
                  >
                    🔑 Mot de passe
                  </button>


                  {/* BOUTON SUPPRESSION */}

                  <button
                    className="btn-secondary"
                    style={{
                      color: 'red',
                      borderColor: 'red',
                      fontSize: '13px'
                    }}
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


      {/* ==================================================
          FENÊTRE CRÉATION UTILISATEUR
      ================================================== */}

      {showForm && (

        <div className="modal-overlay">

          <div className="modal">

            <h2>
              Créer un utilisateur
            </h2>


            {error && (

              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>

            )}


            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Nom complet *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Mot de passe *
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Rôle
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="technicien">
                      Technicien
                    </option>

                    <option value="admin">
                      Administrateur
                    </option>

                    <option value="bureau">
                      Bureau
                    </option>

                  </select>

                </div>

              </div>


              <div className="modal-buttons">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                >
                  Créer le compte
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          FENÊTRE RÉINITIALISATION MOT DE PASSE
      ================================================== */}

      {showPasswordForm && selectedUser && (

        <div className="modal-overlay">

          <div className="modal">

            <h2>
              🔑 Réinitialiser le mot de passe
            </h2>

            <p
              style={{
                marginBottom: '20px',
                color: '#4b5563'
              }}
            >
              Utilisateur : <strong>{selectedUser.name}</strong>
              <br />
              Email : {selectedUser.email}
            </p>


            {error && (

              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>

            )}


            <form onSubmit={handlePasswordReset}>

              <div className="form-group">

                <label>
                  Nouveau mot de passe *
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="6"
                  autoFocus
                  placeholder="Minimum 6 caractères"
                />

              </div>


              <div
                className="form-group"
                style={{ marginTop: '15px' }}
              >

                <label>
                  Confirmer le mot de passe *
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                  placeholder="Retapez le mot de passe"
                />

              </div>


              <div className="modal-buttons">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setSelectedUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                >
                  🔑 Modifier le mot de passe
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}