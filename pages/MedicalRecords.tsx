import React, { useState, useEffect } from 'react';
import { Stethoscope, Sparkles, Plus, Search, ChevronRight, FileText, Calendar, X, Loader2, Save } from 'lucide-react';
// Removed AI Import
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface PetWithClient {
  id: string;
  name: string;
  species: string;
  breed: string;
  clients: {
    first_name: string;
    last_name: string;
  };
}

interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  symptoms: string;
  created_at: string;
}

const MedicalRecords: React.FC = () => {
  const tenant = useTenant();
  const [selectedPet, setSelectedPet] = useState<PetWithClient | null>(null);
  const [pets, setPets] = useState<PetWithClient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchPet, setSearchPet] = useState('');
  // AI Insights removed

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    symptoms: ''
  });

  useEffect(() => {
    if (tenant.isDemo) {
      // Load Pets
      const storedPets = localStorage.getItem(`pets_demo_v10_${tenant.id}`);
      const demoPets = storedPets ? JSON.parse(storedPets) : [
        { id: 'pet-1', name: 'Rocco', species: 'Perro', breed: 'Golden Retriever', clients: { first_name: 'Juan', last_name: 'Pérez' } },
        { id: 'pet-2', name: 'Luna', species: 'Gato', breed: 'Siamés', clients: { first_name: 'Marta', last_name: 'Sánchez' } }
      ];
      setPets(demoPets);
    } else {
      fetchPets();
    }
  }, [tenant.id, tenant.isDemo]);

  useEffect(() => {
    if (selectedPet) {
      if (tenant.isDemo) {
        const storedRecords = localStorage.getItem(`records_demo_v10_${selectedPet.id}`);
        if (storedRecords) {
          setRecords(JSON.parse(storedRecords));
        } else {
          const initialRecords = [
            { id: 'rec-1', date: new Date().toISOString(), diagnosis: 'Vacunación Anual', treatment: 'Séxtuple + Rabia', symptoms: 'Ninguno, control de rutina', created_at: new Date().toISOString() }
          ];
          setRecords(initialRecords);
          localStorage.setItem(`records_demo_v10_${selectedPet.id}`, JSON.stringify(initialRecords));
        }
      } else {
        fetchRecords(selectedPet.id);
      }
    }
  }, [selectedPet, tenant.isDemo]);

  async function fetchPets() {
    try {
      const { data } = await supabase
        .from('pets')
        .select(`
          id, name, species, breed,
          clients (first_name, last_name)
        `)
        .eq('tenant_id', tenant.id)
        .order('name');
      setPets((data as any) || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  }

  async function fetchRecords(petId: string) {
    try {
      const { data } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .eq('tenant_id', tenant.id)
        .order('date', { ascending: false });
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  }

  const resetForm = () => {
    setFormData({ diagnosis: '', treatment: '', symptoms: '' });
    setEditingRecordId(null);
    setIsEditMode(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPet) return;

    setIsSubmitting(true);

    if (tenant.isDemo) {
      const recordPayload = {
        id: isEditMode && editingRecordId ? editingRecordId : `rec-${Date.now()}`,
        date: isEditMode ? records.find(r => r.id === editingRecordId)?.date : new Date().toISOString(),
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        symptoms: formData.symptoms,
        created_at: new Date().toISOString()
      };

      let updatedRecords;
      if (isEditMode && editingRecordId) {
        updatedRecords = records.map(r => r.id === editingRecordId ? recordPayload : r);
      } else {
        updatedRecords = [recordPayload as any, ...records];
      }

      setRecords(updatedRecords);
      localStorage.setItem(`records_demo_v10_${selectedPet.id}`, JSON.stringify(updatedRecords));
      setIsModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const recordPayload = {
        tenant_id: tenant.id,
        pet_id: selectedPet.id,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        symptoms: formData.symptoms
      };

      if (isEditMode && editingRecordId) {
        const { error } = await supabase
          .from('medical_records')
          .update(recordPayload)
          .eq('id', editingRecordId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_records')
          .insert([{
            ...recordPayload,
            date: new Date().toISOString()
          }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchRecords(selectedPet.id);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Error saving record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRecord(id: string) {
    if (!confirm('¿Estás seguro de eliminar este registro médico?')) return;

    if (tenant.isDemo) {
      const updatedRecords = records.filter(r => r.id !== id);
      setRecords(updatedRecords);
      if (selectedPet) localStorage.setItem(`records_demo_v10_${selectedPet.id}`, JSON.stringify(updatedRecords));
      return;
    }

    try {
      const { error } = await supabase.from('medical_records').delete().eq('id', id);
      if (error) throw error;
      if (selectedPet) fetchRecords(selectedPet.id);
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  }

  const openEditModal = (record: MedicalRecord) => {
    setFormData({
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      symptoms: record.symptoms
    });
    setEditingRecordId(record.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // AI Insights handler removed

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchPet.toLowerCase()) ||
    (pet.clients?.first_name + ' ' + pet.clients?.last_name).toLowerCase().includes(searchPet.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[500px] animate-in slide-in-from-bottom-4 duration-500 relative">
      {/* Sidebar - Pet List */}
      <div className={`lg:col-span-4 flex flex-col space-y-4 ${selectedPet && 'hidden lg:flex'}`}>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Search size={18} className="text-slate-400" />
              Pacientes
            </h2>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o dueño..."
              value={searchPet}
              onChange={e => setSearchPet(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-250px)] md:max-h-none">
            {filteredPets.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center gap-2">
                <Search size={32} className="opacity-10" />
                No se encontraron pacientes
              </div>
            ) : filteredPets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPet(pet)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedPet?.id === pet.id
                  ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                  : 'border-transparent hover:bg-slate-50'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${pet.species === 'Gato' ? 'bg-indigo-500' : pet.species === 'Perro' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}>
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{pet.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {pet.clients ? `${pet.clients.first_name} ${pet.clients.last_name}` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={selectedPet?.id === pet.id ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - History */}
      <div className={`lg:col-span-8 flex flex-col space-y-6 ${!selectedPet && 'hidden lg:flex'}`}>
        {selectedPet ? (
          <>
            {/* Medical Timeline */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden relative">
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPet(null)}
                    className="lg:hidden p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-500 hidden xs:block" />
                    <span className="truncate">Historial: {selectedPet.name}</span>
                  </h3>
                </div>
                <button
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                >
                  <Plus size={16} /> Nueva Evolución
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                {records.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <FileText size={32} />
                    </div>
                    <p className="text-slate-400 font-medium">No hay registros médicos para este paciente.</p>
                  </div>
                ) : records.map((record) => (
                  <div key={record.id} className="relative pl-10 border-l-2 border-slate-100 last:border-l-0 pb-10">
                    <div className="absolute -left-3 top-0 bg-white border-2 border-emerald-500 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1.5">
                          <Calendar size={14} className="text-emerald-500" />
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Vet: Dr. Pérez
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-slate-800 text-base mb-2">{record.diagnosis}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">{record.treatment}</p>
                      {record.symptoms && (
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Observaciones / Síntomas</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{record.symptoms}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Stethoscope size={48} strokeWidth={1} className="opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-slate-500 mb-2">Visor de Historial Clínico</h3>
            <p className="text-center max-w-xs text-sm">Selecciona un paciente del menú lateral para gestionar su historial médico.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {isEditMode ? 'Editar Evolución' : 'Nueva Evolución Clínica'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnóstico / Motivo</label>
                <input
                  type="text"
                  required
                  value={formData.diagnosis}
                  onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ej: Control post-quirúrgico"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Síntomas / Observaciones</label>
                <textarea
                  value={formData.symptoms}
                  onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none transition-all"
                  placeholder="Detalle los síntomas observados..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tratamiento Realizado</label>
                <textarea
                  required
                  value={formData.treatment}
                  onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-32 resize-none transition-all"
                  placeholder="Plan de tratamiento y medicación aplicada..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar Evolución' : 'Guardar Evolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
