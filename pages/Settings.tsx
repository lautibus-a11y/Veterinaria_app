import React, { useState } from 'react';
import { Camera, Save, Bell, Shield, Palette, Layout, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const tenant = useTenant();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    phone: tenant?.phone || '',
    address: tenant?.address || '',
    currency: tenant?.settings?.currency || 'USD',
    timezone: tenant?.settings?.timezone || 'UTC'
  });

  const handleSave = async () => {
    if (!tenant) return;
    setLoading(true);
    setSuccess(false);

    if (tenant.isDemo) {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          settings: {
            ...tenant.settings,
            currency: formData.currency,
            timezone: formData.timezone
          }
        })
        .eq('id', tenant.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error al actualizar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración</h1>
        <p className="text-slate-500 mt-1">Gestiona los detalles de tu clínica veterinaria y preferencias del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-1">
          {[
            { id: 'profile', label: 'Clínica', icon: Layout },
            { id: 'branding', label: 'Branding', icon: Palette },
            { id: 'notifications', label: 'Notificaciones', icon: Bell },
            { id: 'security', label: 'Seguridad', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${tab.id === 'profile'
                ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-600/5'
                : 'text-slate-400 hover:bg-white hover:text-slate-600'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8 relative overflow-hidden">
            {success && (
              <div className="absolute top-0 left-0 right-0 bg-emerald-50 text-emerald-600 px-6 py-3 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 font-bold text-sm border-b border-emerald-100 uppercase tracking-widest">
                <CheckCircle2 size={16} /> Configuración actualizada correctamente
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-slate-100 mt-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-[32px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden transition-all group-hover:border-emerald-200">
                  {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Layout size={40} className="text-slate-200" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2.5 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
                  <Camera size={18} />
                </button>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{tenant.name}</h3>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Plan {tenant.plan || 'Free'}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none border-l pl-2 border-slate-200">ACTIVO</span>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors mt-2 uppercase tracking-widest underline underline-offset-4 decoration-slate-200 decoration-2">Cambiar logo corporativo</button>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Nombre de la Clínica</label>
                <div className="relative group">
                  <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Teléfono de Contacto</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 ..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Dirección Física</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Libertador, Buenos Aires..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Moneda del Sistema</label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 appearance-none"
                >
                  <option value="ARS">ARS ($) - Peso Argentino</option>
                  <option value="USD">USD ($) - Dólar Estadounidense</option>
                  <option value="MXN">MXN ($) - Peso Mexicano</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Zona Horaria</label>
                <select
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 appearance-none"
                >
                  <option value="America/Argentina/Buenos_Aires">GMT-3 (Buenos Aires)</option>
                  <option value="America/Mexico_City">GMT-6 (Mexico City)</option>
                  <option value="America/Santiago">GMT-4 (Santiago)</option>
                  <option value="UTC">UTC (Tiempo Universal)</option>
                </select>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? 'Sincronizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
