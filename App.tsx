
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Stethoscope,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Bell,
  MessageSquare,
  Loader2
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/Clients';
import PetsPage from './pages/Pets';
import AppointmentsPage from './pages/Appointments';
import MedicalRecordsPage from './pages/MedicalRecords';
import SettingsPage from './pages/Settings';

// Removed MOCK_TENANT
import { supabase } from './lib/supabase';
import { Tenant } from './types';
import { TenantContext } from './contexts/TenantContext';

import Login from './pages/Login';
import { Session } from '@supabase/supabase-js';

const MOCK_TENANT: Tenant = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Veterinaria San Roque',
  slug: 'san-roque',
  logoUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop',
  plan: 'PRO',
  phone: '+54 11 4444-5555',
  address: 'Calle Ficticia 123, Buenos Aires',
  settings: {
    primaryColor: '#10b981',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  isDemo: true
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchDataForUser(session.user.id);
      } else {
        // Bypassing login for Demo Mode as requested
        setTenant(MOCK_TENANT);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        fetchDataForUser(session.user.id);
      } else {
        setSession(null);
        setTenant(MOCK_TENANT);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchDataForUser(userId: string) {
    setLoading(true);
    try {
      // 1. Get user profile to find tenant
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile?.tenant_id) {
        // 2. Get tenant details
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single();

        if (tenantError) throw tenantError;

        if (tenantData) {
          const loadedTenant: Tenant = {
            id: tenantData.id,
            name: tenantData.name,
            slug: tenantData.slug,
            logoUrl: tenantData.logo_url,
            plan: tenantData.plan,
            phone: tenantData.phone,
            address: tenantData.address,
            settings: {
              primaryColor: tenantData.primary_color || '#10b981',
              currency: tenantData.currency || 'USD',
              timezone: tenantData.timezone || 'UTC'
            }
          };
          setTenant(loadedTenant);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${isActive
          ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'
          : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
          }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
        <span className={`${!isSidebarOpen && 'hidden'} font-bold text-sm tracking-tight`}>{label}</span>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f172a] text-slate-400 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="font-outfit animate-pulse">Sincronizando con VetPro...</p>
      </div>
    );
  }

  // No mandatory session check to allow Demo Mode

  return (
    <TenantContext.Provider value={tenant}>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-outfit">

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 
            ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                <PawPrint size={24} />
              </div>
              <span className={`font-extrabold text-xl text-slate-800 tracking-tighter transition-opacity duration-300 ${!isSidebarOpen && 'lg:opacity-0'}`}>
                Veterinaria
              </span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/appointments" icon={Calendar} label="Turnos" />
            <NavItem to="/clients" icon={Users} label="Clientes" />
            <NavItem to="/pets" icon={PawPrint} label="Pacientes" />
            <NavItem to="/medical-records" icon={Stethoscope} label="Historias Clínicas" />
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-1.5">
            <NavItem to="/settings" icon={Settings} label="Configuración" />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 p-3 w-full rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
            >
              <LogOut size={20} className="group-hover:text-rose-600" />
              <span className={`${!isSidebarOpen && 'lg:hidden'} font-bold text-sm text-left`}>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Navbar */}
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="text-slate-400 hover:bg-slate-50 p-2.5 rounded-xl transition-all border border-transparent hover:border-slate-100"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none truncate max-w-[150px] md:max-w-none">
                  {tenant.name}
                </h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sede Central</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 md:space-x-6">
              <div className="relative hidden xl:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar pacientes o dueños..."
                  className="pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-full text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all w-64 xl:w-80 outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pl-3 md:pl-6 border-l border-slate-200">
                <div className="text-right hidden xs:block sm:block">
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[100px]">
                    {session?.user?.email?.split('@')[0] || 'Admin Demo'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase">Especialista</p>
                </div>
                <div className="relative group cursor-pointer flex-shrink-0">
                  <img src="https://picsum.photos/id/64/40/40" alt="Profile" className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-cover ring-2 ring-emerald-500/20 shadow-md transition-all" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/medical-records" element={<MedicalRecordsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </TenantContext.Provider>
  );
};

export default App;
