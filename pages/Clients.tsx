import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, MoreHorizontal, X, Loader2, Trash2, Pencil, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface ClientWithStats {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  pets: { count: number }[];
}

const Clients: React.FC = () => {
  const tenant = useTenant();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (tenant.isDemo) {
      const stored = localStorage.getItem(`clients_demo_v10_${tenant.id}`);
      if (stored) {
        setClients(JSON.parse(stored));
        setLoading(false);
      } else {
        // Initial mock data if empty
        const initialMock = [
          { id: 'demo-1', first_name: 'Juan', last_name: 'Pérez', email: 'juan.perez@email.com', phone: '+54 11 5555-0101', address: 'Av. Santa Fe 1234, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-2', first_name: 'Marta', last_name: 'Sánchez', email: 'marta.s@gmail.com', phone: '+54 11 5555-0202', address: 'Pueyrredón 456, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-3', first_name: 'Carlos', last_name: 'Gómez', email: 'carlos.g@outlook.com', phone: '+54 11 5555-0303', address: 'Av. Cabildo 2200, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-4', first_name: 'Elena', last_name: 'Rodríguez', email: 'elena.rod@speedy.com', phone: '+54 11 5555-0404', address: 'Juramento 1500, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-5', first_name: 'Roberto', last_name: 'Martínez', email: 'roberto.m@gmail.com', phone: '+54 11 5555-0505', address: 'Av. Corrientes 3800, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-6', first_name: 'Lucía', last_name: 'Fernández', email: 'lucia.f@hotmail.com', phone: '+54 11 5555-0606', address: 'Scalabrini Ortiz 1200, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-7', first_name: 'Diego', last_name: 'López', email: 'dlopez@empresa.com', phone: '+54 11 5555-0707', address: 'Av. Rivadavia 5100, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-8', first_name: 'Carmen', last_name: 'Ruiz', email: 'carmen.ruiz@gmail.com', phone: '+54 11 5555-0808', address: 'Yerbal 800, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-9', first_name: 'Alberto', last_name: 'Torres', email: 'atorres@gmail.com', phone: '+54 11 5555-0909', address: 'Gurruchaga 2100, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] },
          { id: 'demo-10', first_name: 'Sofia', last_name: 'Castro', email: 'sofia.castro@icloud.com', phone: '+54 11 5555-1010', address: 'Malabia 1500, CABA', created_at: new Date().toISOString(), pets: [{ count: 1 }] }
        ];
        setClients(initialMock);
        // Force save to local storage immediately so they persist
        localStorage.setItem(`clients_demo_v10_${tenant.id}`, JSON.stringify(initialMock));
        setLoading(false);
      }
    } else {
      fetchClients();
    }
  }, [tenant.id, tenant.isDemo]);

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          pets (count)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    if (tenant.isDemo) {
      const newClient = {
        id: `demo-${Date.now()}`,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        created_at: new Date().toISOString(),
        pets: [{ count: 0 }]
      };
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      localStorage.setItem(`clients_demo_v10_${tenant.id}`, JSON.stringify(updatedClients));
      setIsCreateModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          tenant_id: tenant.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null
        }]);

      if (error) throw error;

      setIsCreateModalOpen(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear cliente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClient) return;
    setIsSubmitting(true);

    if (tenant.isDemo) {
      const updatedClients = clients.map(c =>
        c.id === editingClient.id
          ? { ...c, first_name: formData.firstName, last_name: formData.lastName, email: formData.email, phone: formData.phone, address: formData.address }
          : c
      );
      setClients(updatedClients);
      localStorage.setItem(`clients_demo_v10_${tenant.id}`, JSON.stringify(updatedClients));
      setIsEditModalOpen(false);
      setEditingClient(null);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteClient(id: string) {
    if (!confirm('¿Estás seguro de eliminar este cliente? Se eliminarán todas sus mascotas y registros asociados.')) return;

    if (tenant.isDemo) {
      const updatedClients = clients.filter(c => c.id !== id);
      setClients(updatedClients);
      localStorage.setItem(`clients_demo_v10_${tenant.id}`, JSON.stringify(updatedClients));
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar cliente.');
    }
  }

  const openEditModal = (client: ClientWithStats) => {
    setEditingClient(client);
    setFormData({
      firstName: client.first_name,
      lastName: client.last_name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || ''
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  };

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm">Gestiona la base de datos de propietarios.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-lg transition-all"
        >
          <Plus size={18} /> Registrar Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold animate-pulse flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="font-medium">Cargando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center">
            <Users size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">No se encontraron clientes.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Mascotas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registrado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm uppercase font-bold border border-emerald-100">
                            {client.first_name[0]}{client.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{client.first_name} {client.last_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">#{client.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {client.phone && <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium"><Phone size={12} className="text-slate-400" /> {client.phone}</p>}
                          {client.email && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {client.email}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                          {client.pets && client.pets[0] ? (client.pets[0] as any).count : 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right transition-all">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all active:scale-90"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all active:scale-90"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm ring-1 ring-emerald-100">
                        {client.first_name[0]}{client.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{client.first_name} {client.last_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ref: {client.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-2 text-emerald-600 bg-emerald-50/50 rounded-xl active:scale-90 transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-2 text-rose-600 bg-rose-50/50 rounded-xl active:scale-90 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                      <p className="text-slate-400 font-bold uppercase tracking-tighter mb-1.5 flex items-center gap-1.5"><Phone size={10} /> Teléfono</p>
                      <p className="text-slate-700 font-bold truncate">{client.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                      <p className="text-slate-400 font-bold uppercase tracking-tighter mb-1.5 flex items-center gap-1.5"><Users size={10} /> Mascotas</p>
                      <p className="text-blue-600 font-bold">{client.pets && client.pets[0] ? (client.pets[0] as any).count : 0} registradas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals Container */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {isEditModalOpen ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateClient : handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ej: Juan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="+54 11 ..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Dirección</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Av. Salud 123"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
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
                    isEditModalOpen ? 'Actualizar Cliente' : 'Guardar Cliente'
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

export default Clients;
