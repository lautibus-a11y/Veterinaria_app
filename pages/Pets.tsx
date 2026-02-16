import React, { useState, useEffect } from 'react';
import { PawPrint, Heart, Activity, Info, Plus, ChevronRight, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface PetWithOwner {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number;
  weight: number;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface SimpleClient {
  id: string;
  first_name: string;
  last_name: string;
}

const Pets: React.FC = () => {
  const tenant = useTenant();
  const [pets, setPets] = useState<PetWithOwner[]>([]);
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    species: 'Perro',
    breed: '',
    gender: 'M',
    age: '',
    weight: '',
    clientId: ''
  });

  useEffect(() => {
    if (tenant.isDemo) {
      // Load Clients for dropdown
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

      // Load Pets
      const storedPets = localStorage.getItem(`pets_demo_v10_${tenant.id}`);
      if (storedPets) {
        setPets(JSON.parse(storedPets));
        setLoading(false);
      } else {
        const initialMockPets = [
          { id: 'pet-1', name: 'Rocco', species: 'Perro', breed: 'Golden Retriever', gender: 'M', age: 4, weight: 32, clients: demoClients[0] },
          { id: 'pet-2', name: 'Luna', species: 'Gato', breed: 'Siamés', gender: 'F', age: 2, weight: 4.5, clients: demoClients[1] },
          { id: 'pet-3', name: 'Max', species: 'Perro', breed: 'Labrador', gender: 'M', age: 5, weight: 28, clients: demoClients[2] },
          { id: 'pet-4', name: 'Bella', species: 'Perro', breed: 'Poodle', gender: 'F', age: 3, weight: 6, clients: demoClients[3] },
          { id: 'pet-5', name: 'Thor', species: 'Perro', breed: 'Pastor Alemán', gender: 'M', age: 6, weight: 35, clients: demoClients[4] },
          { id: 'pet-6', name: 'Mia', species: 'Gato', breed: 'Persa', gender: 'F', age: 1, weight: 3.8, clients: demoClients[5] },
          { id: 'pet-7', name: 'Toby', species: 'Perro', breed: 'Beagle', gender: 'M', age: 2, weight: 12, clients: demoClients[6] },
          { id: 'pet-8', name: 'Kira', species: 'Perro', breed: 'Boxer', gender: 'F', age: 4, weight: 25, clients: demoClients[7] },
          { id: 'pet-9', name: 'Oliver', species: 'Gato', breed: 'Maine Coon', gender: 'M', age: 3, weight: 8.2, clients: demoClients[8] },
          { id: 'pet-10', name: 'Nala', species: 'Perro', breed: 'Cocker Spaniel', gender: 'F', age: 5, weight: 14, clients: demoClients[9] }
        ];
        setPets(initialMockPets as any);
        localStorage.setItem(`pets_demo_v10_${tenant.id}`, JSON.stringify(initialMockPets));
        setLoading(false);
      }
    } else {
      fetchPets();
      fetchClients();
    }
  }, [tenant.id, tenant.isDemo]);

  async function fetchPets() {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          clients (id, first_name, last_name)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets((data as any) || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
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

  const resetForm = () => {
    setFormData({
      name: '',
      species: 'Perro',
      breed: '',
      gender: 'M',
      age: '',
      weight: '',
      clientId: ''
    });
    setEditingPetId(null);
    setIsEditMode(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.clientId) {
      alert('Por favor seleccione un dueño.');
      return;
    }
    setIsSubmitting(true);

    if (tenant.isDemo) {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const petPayload = {
        id: isEditMode && editingPetId ? editingPetId : `pet-${Date.now()}`,
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        gender: formData.gender,
        age: parseFloat(formData.age) || 0,
        weight: parseFloat(formData.weight) || 0,
        clients: selectedClient
      };

      let updatedPets;
      if (isEditMode && editingPetId) {
        updatedPets = pets.map(p => p.id === editingPetId ? petPayload : p);
      } else {
        updatedPets = [petPayload, ...pets];
      }

      setPets(updatedPets as any);
      localStorage.setItem(`pets_demo_v10_${tenant.id}`, JSON.stringify(updatedPets));
      setIsModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const petPayload = {
        tenant_id: tenant.id,
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        gender: formData.gender,
        age: parseFloat(formData.age) || 0,
        weight: parseFloat(formData.weight) || 0,
        client_id: formData.clientId
      };

      if (isEditMode && editingPetId) {
        const { error } = await supabase
          .from('pets')
          .update(petPayload)
          .eq('id', editingPetId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pets')
          .insert([petPayload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchPets();
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Error saving pet.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeletePet(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta mascota? Se eliminarán también sus historiales clínicos.')) return;

    if (tenant.isDemo) {
      const updatedPets = pets.filter(p => p.id !== id);
      setPets(updatedPets);
      localStorage.setItem(`pets_demo_v10_${tenant.id}`, JSON.stringify(updatedPets));
      return;
    }

    try {
      const { error } = await supabase.from('pets').delete().eq('id', id);
      if (error) throw error;
      fetchPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Error al eliminar mascota.');
    }
  }

  const openEditModal = (pet: PetWithOwner) => {
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender || 'M',
      age: pet.age.toString(),
      weight: pet.weight.toString(),
      clientId: pet.clients?.id || ''
    });
    setEditingPetId(pet.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-slate-500">Directorio completo de mascotas registradas.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} /> Nueva Mascota
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="font-medium">Cargando pacientes...</p>
        </div>
      ) : pets.length === 0 ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <PawPrint size={48} className="text-slate-200" />
          <p className="font-medium">No hay mascotas registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group relative">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner transition-transform group-hover:scale-110 ${pet.species === 'Gato' ? 'bg-indigo-500' : pet.species === 'Perro' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}>
                      <PawPrint size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xl">{pet.name}</h3>
                      <p className="text-sm text-slate-500">{pet.breed || 'Mestizo'} • {pet.gender === 'H' ? 'Hembra' : 'Macho'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(pet)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg size={16} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeletePet(pet.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg size={16} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Edad</p>
                    <p className="text-sm font-bold text-slate-700">{pet.age} años</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Peso</p>
                    <p className="text-sm font-bold text-slate-700">{pet.weight} kg</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Especie</p>
                    <p className="text-sm font-bold text-slate-700">{pet.species}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Propietario</span>
                    <span className="text-sm font-bold text-slate-700">
                      {pet.clients ? `${pet.clients.first_name} ${pet.clients.last_name}` : 'Sin dueño'}
                    </span>
                  </div>
                  <button className="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                    Ver ficha
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50/50 px-6 py-3 flex gap-4 text-slate-400 border-t border-slate-100">
                <Heart size={16} className="cursor-pointer hover:text-rose-500 transition-colors" />
                <Activity size={16} className="cursor-pointer hover:text-blue-500 transition-colors" />
                <Info size={16} className="cursor-pointer hover:text-slate-600 ml-auto transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {isEditMode ? 'Editar Mascota' : 'Nueva Mascota'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Bobby"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Especie</label>
                  <select
                    value={formData.species}
                    onChange={e => setFormData({ ...formData, species: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Raza</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={e => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Labrador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Edad (años)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Dueño</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Seleccionar Dueño</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-bold"
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
                    isEditMode ? 'Actualizar Ficha' : 'Guardar Mascota'
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

export default Pets;
