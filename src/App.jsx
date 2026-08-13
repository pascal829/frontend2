import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './index.css';
import { api } from './api';
import LoginPage from './LoginPage';
import UsersPage from './UsersPage';

const COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b'];

function TechnicienSelect({ value, onChange }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="form-group">
      <label>Technicien responsable</label>
      <select name="technicienId" value={value} onChange={onChange}>
        <option value="">— Aucun assigné —</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
        ))}
      </select>
    </div>
  );
}

function NewMachineForm({ onAddMachine, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    installationDate: '',
    status: 'opérationnel',
    notes: '',
    technicienId: '',
    maintenanceInterval: '30'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const interval = parseInt(formData.maintenanceInterval, 10);

    if (!interval || interval <= 0) {
      alert('Veuillez saisir une périodicité de maintenance valide.');
      return;
    }

    const today = new Date();

    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + interval);

    const newMachine = {
      ...formData,
      maintenanceInterval: interval,
      lastMaintenance: today.toISOString().split('T')[0],
      nextMaintenance: nextDate.toISOString().split('T')[0],
      incidents: 0
    };

    onAddMachine(newMachine);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Ajouter une nouvelle machine</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label>Nom de la machine *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Type de machine</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Emplacement</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Date d'installation</label>
              <input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleChange}
              />
            </div>

            {/* NOUVEAU : périodicité */}
            <div className="form-group">
              <label>Périodicité de maintenance *</label>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="number"
                  name="maintenanceInterval"
                  value={formData.maintenanceInterval}
                  onChange={handleChange}
                  min="1"
                  required
                  style={{ width: '120px' }}
                />

                <span>jours</span>
              </div>

              <small style={{
                color: '#6b7280',
                display: 'block',
                marginTop: '5px'
              }}>
                Exemple : 30, 60, 90, 180 ou 365 jours
              </small>
            </div>

            <div className="form-group">
              <label>État initial</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="opérationnel">Opérationnel</option>
                <option value="maintenance">En maintenance</option>
                <option value="défaillant">Défaillant</option>
              </select>
            </div>

            <TechnicienSelect
              value={formData.technicienId}
              onChange={handleChange}
            />

            <div className="form-group form-group-full">
              <label>Notes additionnelles</label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>

          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              Ajouter la machine
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

function InterventionForm({ machine, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'maintenance',
    technicien: '',
    duree: '',
    description: '',
    resultat: 'résolu',
    prochaineMaintenance: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, machineId: machine.id });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Nouvelle intervention — {machine.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Type d'intervention *</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="maintenance">Maintenance préventive</option>
                <option value="réparation">Réparation</option>
                <option value="inspection">Inspection</option>
                <option value="incident">Incident</option>
              </select>
            </div>
            <div className="form-group">
              <label>Technicien</label>
              <input type="text" name="technicien" value={formData.technicien} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Durée (heures)</label>
              <input type="number" name="duree" value={formData.duree} onChange={handleChange} min="0" step="0.5" />
            </div>
            <div className="form-group">
              <label>Résultat</label>
              <select name="resultat" value={formData.resultat} onChange={handleChange}>
                <option value="résolu">Résolu</option>
                <option value="en cours">En cours</option>
                <option value="partiel">Partiellement résolu</option>
              </select>
            </div>
            <div className="form-group">
  <label>Prochaine maintenance</label>

  <div style={{
    padding: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px'
  }}>
    Calculée automatiquement :

    <strong style={{ marginLeft: '8px' }}>
      {(() => {
        const interval =
          Number(machine.maintenanceInterval) || 30;

        const nextDate = new Date(formData.date);

        nextDate.setDate(
          nextDate.getDate() + interval
        );

        return nextDate.toLocaleDateString('fr-FR');
      })()}
    </strong>
  </div>

  <small style={{
    color: '#6b7280',
    display: 'block',
    marginTop: '5px'
  }}>
    Selon la périodicité de cette machine :
    {' '}
    {machine.maintenanceInterval || 30} jours.
  </small>
</div>
            <div className="form-group form-group-full">
              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" required />
            </div>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer l'intervention</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CalendrierPage({ machines, interventions }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const allEvents = [
    ...machines.map(m => ({
      date: m.nextMaintenance,
      title: 'Maintenance planifiée',
      machine: m.name,
      type: 'planifiée'
    })),
    ...interventions.map(i => {
      const machine = machines.find(m => m.id === i.machineId || m.id === i.machineid);
      return {
        date: i.date,
        title: i.type ? i.type.charAt(0).toUpperCase() + i.type.slice(1) : 'Intervention',
        machine: machine ? machine.name : '—',
        type: 'passée'
      };
    })
  ];

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const eventsOnSelectedDate = allEvents.filter(e => e.date === selectedDateStr);

  const today = new Date().toISOString().split('T')[0];
  const upcomingMaintenances = machines
    .filter(m => m.nextMaintenance >= today)
    .sort((a, b) => new Date(a.nextMaintenance) - new Date(b.nextMaintenance));

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');

  const getUrgencyClass = (dateStr) => {
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) return 'event-item urgent';
    if (diff <= 30) return 'event-item warning';
    return 'event-item';
  };

  const getUrgencyBadge = (dateStr) => {
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) return 'badge badge-red';
    if (diff <= 30) return 'badge badge-yellow';
    return 'badge badge-green';
  };

  const getUrgencyLabel = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'En retard !';
    if (diff === 1) return 'Demain';
    return `Dans ${diff} jours`;
  };

  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const hasEvent = allEvents.some(e => e.date === dateStr);
    return hasEvent ? <div className="event-dot"></div> : null;
  };

  return (
    <div>
      <h2 style={{fontSize: '22px', fontWeight: 'bold', marginBottom: '24px'}}>Calendrier des maintenances</h2>

      <div className="calendar-container">
        <div>
          <div className="card" style={{marginBottom: '16px'}}>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              locale="fr-FR"
            />
          </div>

          <div className="card">
            <h2 style={{marginBottom: '12px'}}>
              📅 {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            {eventsOnSelectedDate.length === 0 ? (
              <p style={{color: '#9ca3af', fontSize: '14px'}}>Aucun événement ce jour.</p>
            ) : (
              eventsOnSelectedDate.map((event, index) => (
                <div key={index} className={event.type === 'planifiée' ? 'event-item' : 'event-item warning'} style={{marginBottom: '8px'}}>
                  <div className="event-title">{event.title}</div>
                  <div className="event-machine">🔧 {event.machine}</div>
                  <span className={event.type === 'planifiée' ? 'badge badge-blue' : 'badge badge-green'} style={{marginTop: '6px', display: 'inline-block'}}>
                    {event.type === 'planifiée' ? 'Planifiée' : 'Passée'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h2 style={{marginBottom: '16px'}}>⏰ Prochaines maintenances</h2>
            {upcomingMaintenances.length === 0 ? (
              <p style={{color: '#9ca3af', fontSize: '14px'}}>Aucune maintenance planifiée.</p>
            ) : (
              <div className="calendar-events">
                {upcomingMaintenances.map(machine => (
                  <div key={machine.id} className={getUrgencyClass(machine.nextMaintenance)}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div>
                        <div className="event-title">{machine.name}</div>
                        <div className="event-machine">{machine.type || 'Machine'} — {machine.location || '—'}</div>
                        <div className="event-date" style={{marginTop: '4px'}}>📅 {formatDate(machine.nextMaintenance)}</div>
                      </div>
                      <span className={getUrgencyBadge(machine.nextMaintenance)}>
                        {getUrgencyLabel(machine.nextMaintenance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RapportsPage({ machines, interventions }) {
  // Fonction utilitaire pour comparer les IDs de manière sécurisée
  const isMatch = (intervention, machineId) => {
    const intMachineId = intervention.machineId ?? intervention.machineid;
    return String(intMachineId) === String(machineId);
  };

  const interventionsParMachine = machines.map(machine => ({
    name: machine.name,
    interventions: interventions.filter(i => isMatch(i, machine.id)).length,
    incidents: interventions.filter(i => isMatch(i, machine.id) && i.type === 'incident').length,
    heures: interventions.filter(i => isMatch(i, machine.id)).reduce((acc, i) => acc + (parseFloat(i.duree) || 0), 0)
  }));

  const statutData = [
    { name: 'Opérationnelles', value: machines.filter(m => m.status === 'opérationnel').length },
    { name: 'En maintenance', value: machines.filter(m => m.status === 'maintenance').length },
    { name: 'Défaillantes', value: machines.filter(m => m.status === 'défaillant').length },
  ].filter(d => d.value > 0);

  const typesData = [
    { name: 'Maintenance', value: interventions.filter(i => i.type === 'maintenance').length },
    { name: 'Réparation', value: interventions.filter(i => i.type === 'réparation').length },
    { name: 'Inspection', value: interventions.filter(i => i.type === 'inspection').length },
    { name: 'Incident', value: interventions.filter(i => i.type === 'incident').length },
  ].filter(d => d.value > 0);

  const totalHeures = interventions.reduce((acc, i) => acc + (parseFloat(i.duree) || 0), 0);

  return (
    <div>
      <div className="cards-grid" style={{marginBottom: '24px'}}>
        <div className="card" style={{textAlign: 'center'}}>
          <h2>Total interventions</h2>
          <div style={{fontSize: '48px', fontWeight: 'bold', color: '#2563eb', margin: '16px 0'}}>{interventions.length}</div>
          <p style={{color: '#6b7280', fontSize: '14px'}}>depuis le début</p>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <h2>Heures d'arrêt</h2>
          <div style={{fontSize: '48px', fontWeight: 'bold', color: '#f59e0b', margin: '16px 0'}}>{totalHeures}h</div>
          <p style={{color: '#6b7280', fontSize: '14px'}}>temps total d'intervention</p>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <h2>Total incidents</h2>
          <div style={{fontSize: '48px', fontWeight: 'bold', color: '#ef4444', margin: '16px 0'}}>
            {interventions.filter(i => i.type === 'incident').length}
          </div>
          <p style={{color: '#6b7280', fontSize: '14px'}}>incidents enregistrés</p>
        </div>
      </div>

      <div className="card" style={{marginBottom: '24px'}}>
        <h2 style={{marginBottom: '16px'}}>Interventions par machine</h2>
        {interventions.length === 0 ? (
          <p style={{textAlign: 'center', color: '#9ca3af', padding: '32px'}}>Aucune intervention enregistrée.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interventionsParMachine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="interventions" name="Interventions" fill="#3b82f6" />
              <Bar dataKey="incidents" name="Incidents" fill="#ef4444" />
              <Bar dataKey="heures" name="Heures" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
        <div className="card">
          <h2 style={{marginBottom: '16px'}}>Répartition des statuts</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statutData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                {statutData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 style={{marginBottom: '16px'}}>Types d'interventions</h2>
          {typesData.length === 0 ? (
            <p style={{textAlign: 'center', color: '#9ca3af', padding: '32px'}}>Aucune intervention enregistrée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typesData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                  {typesData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function MachinePage({ machine, interventions, onBack, onUpdateMachine, onAddIntervention, onDeleteMachine }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...machine });
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  // 1. Ajouter un state pour stocker la liste des utilisateurs/techniciens
  const [users, setUsers] = useState([]);

  // 2. Charger les utilisateurs au montage du composant
  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  // 3. Trouver le technicien assigné à cette machine
  const currentTechnicien = users.find(u => String(u.id) === String(machine.technicienId));

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');

  const getStatusBadge = (status) => {
    switch(status) {
      case 'opérationnel': return 'badge badge-green';
      case 'maintenance': return 'badge badge-blue';
      case 'défaillant': return 'badge badge-red';
      default: return 'badge';
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'maintenance': return 'badge badge-blue';
      case 'réparation': return 'badge badge-red';
      case 'inspection': return 'badge badge-green';
      case 'incident': return 'badge badge-yellow';
      default: return 'badge';
    }
  };

  const getResultatBadge = (resultat) => {
    switch(resultat) {
      case 'résolu': return 'badge badge-green';
      case 'en cours': return 'badge badge-blue';
      case 'partiel': return 'badge badge-yellow';
      default: return 'badge';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
  // Trouver le technicien sélectionné pour conserver son nom dans le state
  const selectedUser = users.find(u => String(u.id) === String(formData.technicienId));
  
  const updatedData = {
    ...formData,
    technicienName: selectedUser ? selectedUser.name : ''
  };

  onUpdateMachine(updatedData);
  setEditMode(false);
  };

  const handleSaveIntervention = (intervention) => {

  const interval =
    Number(machine.maintenanceInterval) || 30;

  const nextDate = new Date(intervention.date);

  nextDate.setDate(
    nextDate.getDate() + interval
  );

  const nextMaintenance =
    nextDate.toISOString().split('T')[0];

  const updatedMachine = {
    ...machine,

    lastMaintenance: intervention.date,

    nextMaintenance: nextMaintenance,

    ...(intervention.type === 'incident' && {
      incidents: (machine.incidents || 0) + 1
    })
  };

  onUpdateMachine(updatedMachine);

  onAddIntervention(intervention);

  setShowInterventionForm(false);
};

  const machineInterventions = interventions.filter(i => (i.machineId || i.machineid) === machine.id);

  return (
    <div>
      <div className="header">
        <h1>Maintenance CCGQ</h1>
      </div>

      <div className="main">
        <button className="btn-secondary" style={{marginBottom: '20px'}} onClick={onBack}>
          ← Retour au tableau de bord
        </button>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold'}}>{machine.name}</h2>
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn-primary" onClick={() => setShowInterventionForm(true)}>+ Nouvelle intervention</button>
            {editMode ? (
              <>
                <button className="btn-secondary" onClick={() => setEditMode(false)}>Annuler</button>
                <button className="btn-primary" onClick={handleSave}>Sauvegarder</button>
              </>
            ) : (
              <button className="btn-secondary" onClick={() => setEditMode(true)}>✏️ Modifier</button>
            )}
            <button
              className="btn-secondary"
              style={{color: 'red', borderColor: 'red'}}
              onClick={() => { onDeleteMachine(machine.id); onBack(); }}
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>

        <div className="cards-grid">
          <div className="card">
            <h2>Informations générales</h2>
            {editMode ? (
              <>
                <div className="form-group" style={{marginBottom: '12px'}}>
                  <label>Nom</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="form-group" style={{marginBottom: '12px'}}>
                  <label>Type</label>
                  <input type="text" name="type" value={formData.type} onChange={handleChange} />
                </div>
                <div className="form-group" style={{marginBottom: '12px'}}>
                  <label>Emplacement</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} />
                </div>
                <div className="form-group" style={{marginBottom: '12px'}}>
                  <label>État</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="opérationnel">Opérationnel</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="défaillant">Défaillant</option>
                  </select>
                </div>
                <TechnicienSelect
                  value={formData.technicienId || ''}
                  onChange={handleChange}
                />
              </>
            ) : (
              <>
                <div className="stat-row"><span>Nom</span><span>{machine.name}</span></div>
                <div className="stat-row"><span>Type</span><span>{machine.type || '—'}</span></div>
                <div className="stat-row"><span>Emplacement</span><span>{machine.location || '—'}</span></div>
                <div className="stat-row">
                  <span>État</span>
                  <span className={getStatusBadge(machine.status)}>{machine.status}</span>
                </div>          
                <div className="stat-row">
                  <span>Technicien</span>
                  <span>{currentTechnicien ? `${currentTechnicien.name} (${currentTechnicien.role})` : '—'}</span>
                </div>
                <div className="stat-row"><span>Incidents</span><span>{machine.incidents || 0}</span></div>
              </>
            )}
          </div>

          <div className="card">
            <h2>Maintenance</h2>
            {editMode ? (
              <>
                <div className="form-group" style={{marginBottom: '12px'}}>
                  <label>Dernière maintenance</label>
                  <input type="date" name="lastMaintenance" value={formData.lastMaintenance} onChange={handleChange} />
                </div>
                <div className="form-group" style={{marginBottom: '12px'}}>
  <label>Périodicité de maintenance</label>

  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <input
      type="number"
      name="maintenanceInterval"
      value={formData.maintenanceInterval || 30}
      onChange={handleChange}
      min="1"
      required
    />

    <span>jours</span>
  </div>
</div>

                <div className="form-group" style={{marginBottom: '12px'}}>
                  <label>Prochaine maintenance</label>
                  <input type="date" name="nextMaintenance" value={formData.nextMaintenance} onChange={handleChange} />
                </div>
              </>
            ) : (
              <>
                <div className="stat-row"><span>Dernière maintenance</span><span>{machine.lastMaintenance ? formatDate(machine.lastMaintenance) : '—'}</span></div>
                <div className="stat-row"><span>Prochaine maintenance</span><span>{machine.nextMaintenance ? formatDate(machine.nextMaintenance) : '—'}</span></div>
                <div className="stat-row"><span>Nombre d'interventions</span><span>{machineInterventions.length}</span></div>
              </>
            )}
          </div>

          <div className="card">
            <h2>Notes</h2>
            {editMode ? (
              <div className="form-group">
                <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows="5" style={{width: '100%'}} />
              </div>
            ) : (
              <p style={{fontSize: '14px', color: machine.notes ? '#374151' : '#9ca3af'}}>
                {machine.notes || 'Aucune note disponible.'}
              </p>
            )}
          </div>
        </div>

        <div className="table-container" style={{marginTop: '24px'}}>
          <div className="table-header">Historique des interventions ({machineInterventions.length})</div>
          {machineInterventions.length === 0 ? (
            <div style={{padding: '32px', textAlign: 'center', color: '#9ca3af'}}>
              Aucune intervention enregistrée pour cette machine.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Technicien</th>
                  <th>Durée</th>
                  <th>Description</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                {machineInterventions
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(intervention => (
                  <tr key={intervention.id}>
                    <td>{formatDate(intervention.date)}</td>
                    <td><span className={getTypeBadge(intervention.type)}>{intervention.type}</span></td>
                    <td>{intervention.technicien || '—'}</td>
                    <td>{intervention.duree ? `${intervention.duree}h` : '—'}</td>
                    <td style={{maxWidth: '250px'}}>{intervention.description}</td>
                    <td><span className={getResultatBadge(intervention.resultat)}>{intervention.resultat}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showInterventionForm && (
        <InterventionForm
          machine={machine}
          onSave={handleSaveIntervention}
          onCancel={() => setShowInterventionForm(false)}
        />
      )}
    </div>
  );
}

export default function MaintenanceDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [machinesData, setMachinesData] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [collapsedLocations, setCollapsedLocations] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadData();
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loadData = async () => {
    try {
      const [machines, ints] = await Promise.all([
        api.getMachines(),
        api.getInterventions()
      ]);

      const fixedMachines = machines.map(m => ({
  ...m,

  lastMaintenance:
    m.lastmaintenance || m.lastMaintenance,

  nextMaintenance:
    m.nextmaintenance || m.nextMaintenance,

  technicienId:
    m.technicienid || m.technicienId,

  maintenanceInterval:
    m.maintenanceinterval ||
    m.maintenanceInterval ||
    30
}));

      setMachinesData(fixedMachines);
      setInterventions(ints);
    } catch (err) {
      console.error('Erreur de chargement', err);
      handleLogout();
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMachinesData([]);
    setInterventions([]);
  };

  const statusCounts = {
    operational: machinesData.filter(m => m.status === "opérationnel").length,
    maintenance: machinesData.filter(m => m.status === "maintenance").length,
    failure: machinesData.filter(m => m.status === "défaillant").length
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR') : '—';

  const groupMachinesByLocation = (machines) => {
    return machines.reduce((groups, machine) => {
      const location = machine.location?.trim() || 'Sans emplacement';

      if (!groups[location]) {
        groups[location] = [];
      }

      groups[location].push(machine);
      return groups;
    }, {});
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'opérationnel': return 'badge badge-green';
      case 'maintenance': return 'badge badge-blue';
      case 'défaillant': return 'badge badge-red';
      default: return 'badge';
    }
  };

  const handleAddMachine = async (newMachine) => {
    try {
      const created = await api.createMachine(newMachine);
      setMachinesData(prev => [...prev, created]);
      setShowForm(false);
    } catch (err) {
      alert('Erreur lors de la création : ' + err.message);
    }
  };

  const handleUpdateMachine = async (updatedMachine) => {
    try {
      await api.updateMachine(updatedMachine.id, updatedMachine);
      setMachinesData(prev => prev.map(m => m.id === updatedMachine.id ? updatedMachine : m));
      setSelectedMachine(updatedMachine);
    } catch (err) {
      alert('Erreur lors de la mise à jour : ' + err.message);
    }
  };

  const handleAddIntervention = async (intervention) => {
    try {
      const created = await api.createIntervention(intervention);
      setInterventions(prev => [...prev, created]);
    } catch (err) {
      alert('Erreur lors de l\'enregistrement : ' + err.message);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette machine ?')) {
      try {
        await api.deleteMachine(machineId);
        setMachinesData(prev => prev.filter(m => m.id !== machineId));
        setInterventions(prev => prev.filter(i => (i.machineId || i.machineid) !== machineId));
      } catch (err) {
        alert('Erreur lors de la suppression : ' + err.message);
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (selectedMachine) {
    return (
      <MachinePage
        machine={selectedMachine}
        interventions={interventions}
        onBack={() => setSelectedMachine(null)}
        onUpdateMachine={handleUpdateMachine}
        onAddIntervention={handleAddIntervention}
        onDeleteMachine={handleDeleteMachine}
      />
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Maintenance CCGQ</h1>
        <div className="header-buttons">
          <span style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>
            👤 {user.name}
          </span>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Nouvelle machine</button>
          <button className="btn-secondary" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="nav">
        {['dashboard', 'machines', 'schedule', 'reports', ...(user.role === 'admin' ? ['users'] : [])].map(tab => (
          <button
            key={tab}
            className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' ? 'Tableau de bord' :
             tab === 'machines' ? 'Machines' :
             tab === 'schedule' ? 'Calendrier' :
             tab === 'users' ? 'Utilisateurs' : 'Rapports'}
          </button>
        ))}
      </div>

      <div className="main">
        {/* ONGLET 1: TABLEAU DE BORD */}
{activeTab === 'dashboard' && (() => {
  // Calcul des maintenances prévues dans les 7 prochains jours
  const today = new Date();
  const in7Days = new Date();
  in7Days.setDate(today.getDate() + 7);

  const upcoming7Days = machinesData.filter(m => {
    if (!m.nextMaintenance) return false;
    const nextDate = new Date(m.nextMaintenance);
    return nextDate >= today && nextDate <= in7Days;
  }).sort((a, b) => new Date(a.nextMaintenance) - new Date(b.nextMaintenance));

  return (
    <div>
      {/* Passage à 4 cartes dans la grille */}
      <div className="cards-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card">
          <h2>Opérationnelles</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#22c55e', margin: '12px 0' }}>
            {statusCounts.operational}
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>sur {machinesData.length} machines</p>
        </div>

        <div className="card">
          <h2>En maintenance</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', margin: '12px 0' }}>
            {statusCounts.maintenance}
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>interventions en cours</p>
        </div>

        <div className="card">
          <h2>Défaillantes</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444', margin: '12px 0' }}>
            {statusCounts.failure}
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>action requise</p>
        </div>

        {/* 🆕 NOUVELLE CARTE : Entretiens à venir à 7 jours */}
        <div className="card" style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
          <h2 style={{ color: '#b45309' }}>⏰ Prévus sous 7 jours</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#d97706', margin: '8px 0' }}>
            {upcoming7Days.length}
          </div>
          
          {upcoming7Days.length === 0 ? (
            <p style={{ color: '#92400e', fontSize: '13px' }}>Aucun entretien prévu cette semaine.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', maxHeight: '120px', overflowY: 'auto' }}>
              {upcoming7Days.map(m => (
                <li key={m.id} style={{ fontSize: '13px', color: '#78350f', marginBottom: '6px', borderBottom: '1px dashed #fde68a', paddingBottom: '4px' }}>
                  <strong>{m.name}</strong> — {formatDate(m.nextMaintenance)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">Aperçu rapide des machines</div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Emplacement</th>
              <th>État</th>
              <th>Prochaine maintenance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {machinesData.map(machine => (
              <tr key={machine.id}>
                <td><strong>{machine.name}</strong></td>
                <td>{machine.location || '—'}</td>
                <td><span className={getStatusBadge(machine.status)}>{machine.status}</span></td>
                <td>{formatDate(machine.nextMaintenance)}</td>
                <td>
                  <button className="btn-secondary" onClick={() => setSelectedMachine(machine)}>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
})()}

        {/* ONGLET 2: MACHINES */}
        {activeTab === 'machines' && (
          <div className="table-container">
            <div className="table-header">Liste complète des machines ({machinesData.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>État</th>
                  <th>Dernière maintenance</th>
                  <th>Prochaine maintenance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
  {Object.entries(groupMachinesByLocation(machinesData))
    .sort(([locationA], [locationB]) =>
      locationA.localeCompare(locationB, 'fr', { sensitivity: 'base' })
    )
    .map(([location, machines]) => {
      const isCollapsed = collapsedLocations[location];

      return (
        <React.Fragment key={location}>

          {/* ===== EN-TÊTE DE L'EMPLACEMENT ===== */}
          <tr
            onClick={() =>
              setCollapsedLocations(prev => ({
                ...prev,
                [location]: !prev[location]
              }))
            }
            style={{ cursor: 'pointer' }}
          >
            <td
              colSpan="6"
              style={{
                backgroundColor: '#f3f4f6',
                fontWeight: 'bold',
                fontSize: '15px',
                padding: '10px 12px',
                borderTop: '2px solid #d1d5db',
                userSelect: 'none'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '22px',
                  fontSize: '13px'
                }}
              >
                {isCollapsed ? '▶' : '▼'}
              </span>

              📍 {location}

              <span
                style={{
                  marginLeft: '10px',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  color: '#6b7280'
                }}
              >
                ({machines.length} machine
                {machines.length > 1 ? 's' : ''})
              </span>

              <span
                style={{
                  float: 'right',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  color: '#6b7280'
                }}
              >
                {isCollapsed ? 'Cliquer pour afficher' : 'Cliquer pour réduire'}
              </span>
            </td>
          </tr>

          {/* ===== MACHINES DE L'EMPLACEMENT ===== */}
          {!isCollapsed &&
            machines
              .sort((a, b) =>
                (a.name || '').localeCompare(
                  b.name || '',
                  'fr',
                  { sensitivity: 'base' }
                )
              )
              .map(machine => (
                <tr key={machine.id}>
                  <td>
                    <strong>{machine.name}</strong>
                  </td>

                  <td>
                    {machine.type || '—'}
                  </td>

                  <td>
                    <span className={getStatusBadge(machine.status)}>
                      {machine.status}
                    </span>
                  </td>

                  <td>
                    {formatDate(machine.lastMaintenance)}
                  </td>

                  <td>
                    {formatDate(machine.nextMaintenance)}
                  </td>

                  <td>
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMachine(machine);
                      }}
                    >
                      ⚙️ Gérer
                    </button>
                  </td>
                </tr>
              ))}
        </React.Fragment>
      );
    })}
</tbody>
            </table>
          </div>
        )}

        {/* ONGLET 3: CALENDRIER */}
        {activeTab === 'schedule' && (
          <CalendrierPage machines={machinesData} interventions={interventions} />
        )}

        {/* ONGLET 4: RAPPORTS */}
        {activeTab === 'reports' && (
          <RapportsPage machines={machinesData} interventions={interventions} />
        )}

        {/* ONGLET 5: UTILISATEURS */}
        {activeTab === 'users' && (
          <UsersPage />
        )}
      </div>

      {showForm && (
        <NewMachineForm
          onAddMachine={handleAddMachine}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}