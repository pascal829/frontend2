import { useState, useEffect } from 'react';
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
  name: '', type: '', location: '', installationDate: '', 
  status: 'opérationnel', notes: '', technicienId: ''
});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + 30);
    const newMachine = {
      id: Date.now(),
      ...formData,
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
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Type de machine</label>
              <input type="text" name="type" value={formData.type} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Emplacement</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Date d'installation</label>
              <input type="date" name="installationDate" value={formData.installationDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>État initial</label>
              <select name="status" value={formData.status} onChange={handleChange}>
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
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
            </div>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
            <button type="submit" className="btn-primary">Ajouter la machine</button>
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
    onSave({ ...formData, id: Date.now(), machineId: machine.id });
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
              <input type="date" name="prochaineMaintenance" value={formData.prochaineMaintenance} onChange={handleChange} />
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

  // Construit la liste de tous les événements (maintenances planifiées + interventions passées)
  const allEvents = [
    ...machines.map(m => ({
      date: m.nextMaintenance,
      title: 'Maintenance planifiée',
      machine: m.name,
      type: 'planifiée'
    })),
    ...interventions.map(i => {
      const machine = machines.find(m => m.id === i.machineId);
      return {
        date: i.date,
        title: i.type.charAt(0).toUpperCase() + i.type.slice(1),
        machine: machine ? machine.name : '—',
        type: 'passée'
      };
    })
  ];

  // Événements du jour sélectionné
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const eventsOnSelectedDate = allEvents.filter(e => e.date === selectedDateStr);

  // Prochaines maintenances triées par date
  const today = new Date().toISOString().split('T')[0];
  const upcomingMaintenances = machines
    .filter(m => m.nextMaintenance >= today)
    .sort((a, b) => new Date(a.nextMaintenance) - new Date(b.nextMaintenance));

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');

  // Calcule urgence de la maintenance
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

  // Ajoute un point sous les dates avec des événements
  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const hasEvent = allEvents.some(e => e.date === dateStr);
    return hasEvent ? <div className="event-dot"></div> : null;
  };

  return (
    <div>
      <h2 style={{fontSize: '22px', fontWeight: 'bold', marginBottom: '24px'}}>Calendrier des maintenances</h2>

      <div className="calendar-container">
        {/* Calendrier */}
        <div>
          <div className="card" style={{marginBottom: '16px'}}>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              locale="fr-FR"
            />
          </div>

          {/* Événements du jour sélectionné */}
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

        {/* Liste des prochaines maintenances */}
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
  const interventionsParMachine = machines.map(machine => ({
    name: machine.name,
    interventions: interventions.filter(i => i.machineId === machine.id).length,
    incidents: interventions.filter(i => i.machineId === machine.id && i.type === 'incident').length,
    heures: interventions.filter(i => i.machineId === machine.id).reduce((acc, i) => acc + (parseFloat(i.duree) || 0), 0)
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
    onUpdateMachine(formData);
    setEditMode(false);
  };

  const handleSaveIntervention = (intervention) => {
    const updatedMachine = {
      ...machine,
      lastMaintenance: intervention.date,
      ...(intervention.prochaineMaintenance && { nextMaintenance: intervention.prochaineMaintenance }),
      ...(intervention.type === 'incident' && { incidents: machine.incidents + 1 })
    };
    onUpdateMachine(updatedMachine);
    onAddIntervention(intervention);
    setShowInterventionForm(false);
  };

  const machineInterventions = interventions.filter(i => i.machineId === machine.id);

  return (
    <div>
      <div className="header">
        <h1>MaintenancePro</h1>
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
                  <span>{machine.technicienName || '—'}</span>
                </div>
                <div className="stat-row"><span>Incidents</span><span>{machine.incidents}</span></div>
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
                  <label>Prochaine maintenance</label>
                  <input type="date" name="nextMaintenance" value={formData.nextMaintenance} onChange={handleChange} />
                </div>
              </>
            ) : (
              <>
                <div className="stat-row"><span>Dernière maintenance</span><span>{formatDate(machine.lastMaintenance)}</span></div>
                <div className="stat-row"><span>Prochaine maintenance</span><span>{formatDate(machine.nextMaintenance)}</span></div>
                <div className="stat-row"><span>Nombre d'interventions</span><span>{machineInterventions.length}</span></div>
              </>
            )}
          </div>

          <div className="card">
            <h2>Notes</h2>
            {editMode ? (
              <div className="form-group">
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="5" style={{width: '100%'}} />
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

  // Vérifie si l'utilisateur est déjà connecté au chargement de l'app
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // On a un token, on récupère les données
      loadData();
      // On considère l'utilisateur connecté (token présent)
      // On pourrait aussi vérifier sa validité via /api/auth/me
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
      lastMaintenance: m.lastmaintenance,
      nextMaintenance: m.nextmaintenance,
      technicienId: m.technicienid
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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'élevée': return 'badge badge-red';
      case 'normale': return 'badge badge-blue';
      case 'faible': return 'badge badge-green';
      default: return 'badge';
    }
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
        setInterventions(prev => prev.filter(i => i.machineId !== machineId));
      } catch (err) {
        alert('Erreur lors de la suppression : ' + err.message);
      }
    }
  };

  // Affichage pendant la vérification initiale
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;
  }

  // Pas connecté -> page de connexion
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
        {activeTab === 'reports' && (
          <RapportsPage machines={machinesData} interventions={interventions} />
        )}
        {activeTab === 'users' && (
          <UsersPage />
        )}
        {activeTab === 'schedule' && (
          <CalendrierPage machines={machinesData} interventions={interventions} />
        )}
        {(activeTab === 'dashboard' || activeTab === 'machines') && (
          <>
            <div className="cards-grid">
              <div className="card">
                <h2>État du parc machines</h2>
                <div className="status-item">
                  <div className="status-label">
                    <div className="status-dot dot-green"></div>
                    <span>Opérationnelles</span>
                  </div>
                  <span className="badge badge-green">{statusCounts.operational}</span>
                </div>
                <div className="status-item">
                  <div className="status-label">
                    <div className="status-dot dot-blue"></div>
                    <span>En maintenance</span>
                  </div>
                  <span className="badge badge-blue">{statusCounts.maintenance}</span>
                </div>
                <div className="status-item">
                  <div className="status-label">
                    <div className="status-dot dot-red"></div>
                    <span>Défaillantes</span>
                  </div>
                  <span className="badge badge-red">{statusCounts.failure}</span>
                </div>
              </div>

              <div className="card">
                <h2>Statistiques</h2>
                <div className="stat-row"><span>Total interventions</span><span>{interventions.length}</span></div>
                <div className="stat-row"><span>Incidents</span><span>{interventions.filter(i => i.type === 'incident').length}</span></div>
                <div className="stat-row">
                  <span>Heures d'arrêt total</span>
                  <span>{interventions.reduce((acc, i) => acc + (parseFloat(i.duree) || 0), 0)}h</span>
                </div>
                <div className="stat-row"><span>Total machines</span><span>{machinesData.length}</span></div>
              </div>

              <div className="card">
                <h2>Tâches à venir</h2>
                {machinesData
                  .filter(m => m.nextMaintenance)
                  .sort((a, b) => new Date(a.nextMaintenance) - new Date(b.nextMaintenance))
                  .slice(0, 5)
                  .map(machine => {
                     const diff = Math.ceil((new Date(machine.nextMaintenance) - new Date()) / (1000 * 60 * 60 * 24));
                     return (
                      <div key={machine.id} className="task-item">
                        <div>
                         <div className="task-name">{machine.name}</div>
                         <div className="task-type">Maintenance planifiée</div>
                        </div>
                      <div>
                         <span className={diff <= 3 ? 'badge badge-red' : diff <= 7 ? 'badge badge-yellow' : 'badge badge-green'}>
                          {diff <= 0 ? 'En retard !' : diff === 1 ? 'Demain' : `Dans ${diff} jours`}
                         </span>
                         <div className="task-date">📅 {formatDate(machine.nextMaintenance)}</div>
                      </div>
               </div>
              );
            })
          }
          {machinesData.filter(m => m.nextMaintenance).length === 0 && (
            <p style={{color: '#9ca3af', fontSize: '14px'}}>Aucune maintenance planifiée.</p>
          )}
        </div>
               
                <button className="btn-link">Voir toutes les tâches</button>
              </div>
            </div>

            <div className="table-container">
              <div className="table-header">Machines ({machinesData.length})</div>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>État</th>
                    <th>Dernière maintenance</th>
                    <th>Prochaine maintenance</th>
                    <th>Incidents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machinesData.map(machine => (
                    <tr key={machine.id}>
                      <td><strong>{machine.name}</strong></td>
                      <td><span className={getStatusBadge(machine.status)}>{machine.status}</span></td>
                      <td>{formatDate(machine.lastMaintenance)}</td>
                      <td>{formatDate(machine.nextMaintenance)}</td>
                      <td>{machine.incidents}</td>
                      <td>
                        <button className="btn-table-blue" onClick={() => setSelectedMachine(machine)}>Détails</button>
                        <button className="btn-table-green" onClick={() => setSelectedMachine(machine)}>Maintenance</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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