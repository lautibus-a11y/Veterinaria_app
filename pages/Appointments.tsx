import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, PawPrint, MessageCircle, MoreVertical, Filter, Plus, X, Loader2 } from 'lucide-react';
import { generateWhatsAppLink, createAppointmentMessage } from '../lib/whatsapp';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface AppointmentWithDetails {
  id: string;
  date_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  reason: string;
  notes: string;
  pets: {
    id: string;
    name: string;
    species: string;
  };
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface ClientForSelect {
  id: string;
  first_name: string;
  last_name: string;
}

interface PetForSelect {
  id: string;
  name: string;
}


const Appointments: React.FC = () => {
  const tenant = useTenant();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientForSelect[]>([]);
  const [pets, setPets] = useState<PetForSelect[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    petId: '',
    date: '',
    time: '',
    reason: '',
    notes: '',
    status: 'PENDING' as AppointmentWithDetails['status']
  });

  useEffect(() => {
    if (tenant.isDemo) {
      // Load Clients & Pets for dropdowns
      const storedClients = localStorage.getItem(`clients_demo_v10_${tenant.id}`);
      const demoClients = storedClients ? JSON.parse(storedClients) : [
        { id: 'demo-1', first_name: 'Juan', last_name: 'Pérez' },
        { id: 'demo-2', first_name: 'Marta', last_name: 'Sánchez' },
        { id: 'demo-3', first_name: 'Carlos', last_name: 'Gómez' },
        { id: 'demo-4', first_name: 'Elena', last_name: 'Rodríguez' },
        { id: 'demo-5', first_name: 'Roberto', last_name: 'Martínez' },
        { id: 'demo-6', first_name: 'Lucía', last_name: 'Fernández' },
        { id: 'demo-7', first_name: 'Diego', last_name: 'López' },
        { id: 'demo-8', first_name: 'Carmen', last_name: 'Ruiz' },
        { id: 'demo-9', first_name: 'Alberto', last_name: 'Torres' },
        { id: 'demo-10', first_name: 'Sofia', last_name: 'Castro' }
      ];
      setClients(demoClients);

      // Load Appointments
      const storedApps = localStorage.getItem(`appointments_demo_v10_${tenant.id}`);
      if (storedApps) {
        setAppointments(JSON.parse(storedApps));
        setLoading(false);
      } else {
        const initialMockApps = [
          { id: 'app-1', date_time: new Date(Date.now() + 3600000).toISOString(), status: 'CONFIRMED', reason: 'Control', notes: '', pets: { id: 'pet-1', name: 'Rocco', species: 'Perro' }, clients: { ...demoClients[0], phone: '+541155550101' } },
          { id: 'app-2', date_time: new Date(Date.now() + 7200000).toISOString(), status: 'PENDING', reason: 'Vacunación', notes: '', pets: { id: 'pet-2', name: 'Luna', species: 'Gato' }, clients: { ...demoClients[1], phone: '+541155550202' } },
          { id: 'app-3', date_time: new Date(Date.now() + 10800000).toISOString(), status: 'CONFIRMED', reason: 'Consulta General', notes: '', pets: { id: 'pet-3', name: 'Max', species: 'Perro' }, clients: { ...demoClients[2], phone: '+541155550303' } },
          { id: 'app-4', date_time: new Date(Date.now() + 14400000).toISOString(), status: 'PENDING', reason: 'Desparasitación', notes: '', pets: { id: 'pet-4', name: 'Bella', species: 'Perro' }, clients: { ...demoClients[3], phone: '+541155550404' } },
          { id: 'app-5', date_time: new Date(Date.now() + 18000000).toISOString(), status: 'CONFIRMED', reason: 'Control Post-Operatorio', notes: '', pets: { id: 'pet-5', name: 'Thor', species: 'Perro' }, clients: { ...demoClients[4], phone: '+541155550505' } },
          { id: 'app-6', date_time: new Date(Date.now() + 86400000).toISOString(), status: 'PENDING', reason: 'Ecografía', notes: '', pets: { id: 'pet-6', name: 'Mia', species: 'Gato' }, clients: { ...demoClients[5], phone: '+541155550606' } },
          { id: 'app-7', date_time: new Date(Date.now() + 90000000).toISOString(), status: 'CONFIRMED', reason: 'Análisis de Sangre', notes: '', pets: { id: 'pet-7', name: 'Toby', species: 'Perro' }, clients: { ...demoClients[6], phone: '+541155550707' } },
          { id: 'app-8', date_time: new Date(Date.now() + 93600000).toISOString(), status: 'PENDING', reason: 'Consulta Piel', notes: '', pets: { id: 'pet-8', name: 'Kira', species: 'Perro' }, clients: { ...demoClients[7], phone: '+541155550808' } },
          { id: 'app-9', date_time: new Date(Date.now() + 97200000).toISOString(), status: 'CONFIRMED', reason: 'Vacuna Antirrábica', notes: '', pets: { id: 'pet-9', name: 'Oliver', species: 'Gato' }, clients: { ...demoClients[8], phone: '+541155550909' } },
          { id: 'app-10', date_time: new Date(Date.now() + 100800000).toISOString(), status: 'PENDING', reason: 'Corte de Uñas', notes: '', pets: { id: 'pet-10', name: 'Nala', species: 'Perro' }, clients: { ...demoClients[9], phone: '+541155551010' } }
        ];
        setAppointments(initialMockApps as any);
        localStorage.setItem(`appointments_demo_v10_${tenant.id}`, JSON.stringify(initialMockApps));
        setLoading(false);
      }
    } else {
      fetchAppointments();
      fetchClients();
    }
  }, [tenant.id, tenant.isDemo]);

  useEffect(() => {
    if (formData.clientId) {
      if (tenant.isDemo) {
        const storedPets = localStorage.getItem(`pets_demo_v10_${tenant.id}`);
        const demoPets = storedPets ? JSON.parse(storedPets) : [];
        setPets(demoPets.filter((p: any) => p.clients?.id === formData.clientId));
      } else {
        fetchPetsForClient(formData.clientId);
      }
    } else {
      setPets([]);
    }
  }, [formData.clientId, tenant.isDemo]);

  async function fetchAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          pets (id, name, species),
          clients (id, first_name, last_name, phone)
        `)
        .eq('tenant_id', tenant.id)
        .order('date_time', { ascending: true });

      if (error) throw error;
      setAppointments((data as any) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('tenant_id', tenant.id)
      .order('first_name');
    setClients(data || []);
  }

  async function fetchPetsForClient(clientId: string) {
    const { data } = await supabase
      .from('pets')
      .select('id, name')
      .eq('client_id', clientId)
      .eq('tenant_id', tenant.id);
    setPets(data || []);
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      petId: '',
      date: '',
      time: '',
      reason: '',
      notes: '',
      status: 'PENDING'
    });
    setEditingAppointmentId(null);
    setIsEditMode(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.clientId || !formData.petId || !formData.date || !formData.time) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);

    if (tenant.isDemo) {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const selectedPet = pets.find(p => p.id === formData.petId);
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const payload = {
        id: isEditMode && editingAppointmentId ? editingAppointmentId : `app-${Date.now()}`,
        date_time: dateTime,
        reason: formData.reason,
        notes: formData.notes,
        status: formData.status,
        pets: selectedPet,
        clients: { ...selectedClient, phone: (selectedClient as any).phone || '+541100000000' }
      };

      let updatedApps;
      if (isEditMode && editingAppointmentId) {
        updatedApps = appointments.map(a => a.id === editingAppointmentId ? payload : a);
      } else {
        updatedApps = [...appointments, payload as any].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
      }

      setAppointments(updatedApps);
      localStorage.setItem(`appointments_demo_v10_${tenant.id}`, JSON.stringify(updatedApps));
      setIsModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const payload = {
        tenant_id: tenant.id,
        client_id: formData.clientId,
        pet_id: formData.petId,
        date_time: dateTime,
        reason: formData.reason,
        notes: formData.notes,
        status: formData.status
      };

      if (isEditMode && editingAppointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', editingAppointmentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Error saving appointment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: AppointmentWithDetails['status']) {
    if (tenant.isDemo) {
      const updatedApps = appointments.map(a => a.id === id ? { ...a, status } : a);
      setAppointments(updatedApps);
      localStorage.setItem(`appointments_demo_v10_${tenant.id}`, JSON.stringify(updatedApps));
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function handleDeleteAppointment(id: string) {
    if (!confirm('¿Estás seguro de eliminar este turno?')) return;

    if (tenant.isDemo) {
      const updatedApps = appointments.filter(a => a.id !== id);
      setAppointments(updatedApps);
      localStorage.setItem(`appointments_demo_v10_${tenant.id}`, JSON.stringify(updatedApps));
      return;
    }

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  }

  const openEditModal = (app: AppointmentWithDetails) => {
    const date = new Date(app.date_time);
    setFormData({
      clientId: app.clients?.id || '',
      petId: app.pets?.id || '',
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
      reason: app.reason,
      notes: app.notes || '',
      status: app.status
    });
    setEditingAppointmentId(app.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSendWhatsApp = (app: AppointmentWithDetails) => {
    if (!app.clients?.phone) {
      alert('El cliente no tiene teléfono registrado.');
      return;
    }
    const date = new Date(app.date_time);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = createAppointmentMessage(app.pets?.name || 'Mascota', app.reason, 'el día del turno', timeStr, tenant.name);
    const link = generateWhatsAppLink(app.clients.phone, msg);
    window.open(link, '_blank');
  };

  const filteredAppointments = appointments.filter(app => {
    if (filter === 'all') return true;
    return app.status.toLowerCase() === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda de Turnos</h1>
          <p className="text-slate-500">Gestión de consultas diarias y recordatorios.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={18} /> Nuevo Turno
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filter === f ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
              {f === 'all' ? 'Todos' : f === 'confirmed' ? 'Confirmados' : f === 'pending' ? 'Pendientes' : f === 'completed' ? 'Atendidos' : 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="font-medium">Cargando turnos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <CalendarIcon size={48} className="text-slate-100 mb-2" />
          <p className="font-medium">No hay turnos registrados en esta sección.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((app) => {
            const date = new Date(app.date_time);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();

            return (
              <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-200 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${app.status === 'CONFIRMED' ? 'bg-emerald-500' :
                  app.status === 'PENDING' ? 'bg-amber-400' :
                    app.status === 'CANCELLED' ? 'bg-rose-400' : 'bg-slate-300'
                  }`}></div>

                <div className="flex items-center gap-6">
                  <div className="text-center min-w-[80px]">
                    <p className="text-lg font-bold text-slate-800 tracking-tight">{timeStr}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dateStr}</p>
                  </div>
                  <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">{app.pets?.name || 'Mascota eliminada'}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${app.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                        app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          app.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {app.status === 'CONFIRMED' ? 'Confirmado' : app.status === 'PENDING' ? 'Pendiente' : app.status === 'CANCELLED' ? 'Cancelado' : 'Finalizado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={14} className="text-slate-300" />
                        {app.clients ? `${app.clients.first_name} ${app.clients.last_name}` : 'Sin cliente'}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                        <PawPrint size={14} /> {app.reason}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-5 md:mt-0">
                  <button
                    onClick={() => handleSendWhatsApp(app)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <MessageCircle size={16} />
                    Avisar WhatsApp
                  </button>

                  <div className="flex items-center justify-around bg-slate-50 rounded-xl p-1 border border-slate-100 min-w-[120px]">
                    <button
                      onClick={() => updateStatus(app.id, 'CONFIRMED')}
                      className={`flex-1 sm:p-1.5 p-2.5 rounded-lg transition-all flex justify-center ${app.status === 'CONFIRMED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Confirmar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button
                      onClick={() => openEditModal(app)}
                      className="flex-1 sm:p-1.5 p-2.5 text-slate-400 hover:text-blue-600 rounded-lg flex justify-center"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(app.id)}
                      className="flex-1 sm:p-1.5 p-2.5 text-slate-400 hover:text-rose-600 rounded-lg flex justify-center"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {isEditMode ? 'Editar Turno' : 'Nuevo Turno'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Cliente</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value, petId: '' })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="">Seleccionar Cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Mascota</label>
                <select
                  required
                  disabled={!formData.clientId}
                  value={formData.petId}
                  onChange={e => setFormData({ ...formData, petId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 transition-all"
                >
                  <option value="">Seleccionar Mascota</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Hora</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Motivo</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Vacunación, Control..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Estado</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="COMPLETED">Atendido</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    isEditMode ? 'Actualizar Turno' : 'Agendar Turno'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
