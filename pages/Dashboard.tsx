import React, { useState, useEffect } from 'react';
import { Users, PawPrint, Calendar, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

const data = [
  { name: 'Lun', turnos: 12, ingresos: 450 },
  { name: 'Mar', turnos: 19, ingresos: 620 },
  { name: 'Mie', turnos: 15, ingresos: 580 },
  { name: 'Jue', turnos: 22, ingresos: 890 },
  { name: 'Vie', turnos: 30, ingresos: 1200 },
  { name: 'Sab', turnos: 10, ingresos: 400 },
];

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className={`${color} p-3 rounded-xl text-white`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const tenant = useTenant();
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (tenant.isDemo) {
        setStats({
          totalPatients: 124,
          appointmentsToday: 8,
          pendingAppointments: 3,
        });
        setRecentAppointments([
          { id: '1', date_time: new Date(Date.now() + 3600000).toISOString(), status: 'CONFIRMED', pets: { name: 'Rocco', species: 'Perro' }, clients: { first_name: 'Juan', last_name: 'Pérez' } },
          { id: '2', date_time: new Date(Date.now() + 7200000).toISOString(), status: 'PENDING', pets: { name: 'Luna', species: 'Gato' }, clients: { first_name: 'Marta', last_name: 'Sánchez' } },
          { id: '3', date_time: new Date(Date.now() + 10800000).toISOString(), status: 'CONFIRMED', pets: { name: 'Simba', species: 'Gato' }, clients: { first_name: 'Carlos', last_name: 'Gómez' } }
        ]);
        setLoading(false);
        return;
      }

      try {
        // Fetch Stats
        const petsCount = await supabase
          .from('pets')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        const today = new Date().toISOString().split('T')[0];
        const appointmentsTodayCount = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .gte('date_time', `${today}T00:00:00`)
          .lte('date_time', `${today}T23:59:59`);

        const pendingCount = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'PENDING');

        setStats({
          totalPatients: petsCount.count || 0,
          appointmentsToday: appointmentsTodayCount.count || 0,
          pendingAppointments: pendingCount.count || 0,
        });

        // Fetch Recent Appointments
        const { data: recentData } = await supabase
          .from('appointments')
          .select(`
            *,
            pets (name, species),
            clients (first_name, last_name)
          `)
          .eq('tenant_id', tenant.id)
          .gte('date_time', new Date().toISOString()) // Future appointments
          .order('date_time', { ascending: true })
          .limit(5);

        setRecentAppointments(recentData || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [tenant.id, tenant.isDemo]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel General</h1>
          <p className="text-slate-500">Bienvenido de nuevo. Aquí tienes el resumen de hoy.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Descargar Reporte
          </button>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2">
            <Calendar size={18} />
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pacientes Totales" value={stats.totalPatients} icon={PawPrint} color="bg-blue-500" trend={12} />
        <StatCard title="Turnos de Hoy" value={stats.appointmentsToday} icon={Calendar} color="bg-emerald-500" />
        <StatCard title="Ingresos (Est.)" value="$12,450" icon={DollarSign} color="bg-violet-500" trend={8} />
        <StatCard title="Consultas Pendientes" value={stats.pendingAppointments} icon={Clock} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Charts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Actividad Semanal</h3>
            <select className="bg-slate-50 border-none text-xs font-semibold rounded-lg focus:ring-emerald-500">
              <option>Últimos 7 días</option>
              <option>Último mes</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="turnos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Ingresos Estimados</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="ingresos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Próximos Turnos</h3>
          <button className="text-emerald-600 text-sm font-semibold hover:underline">Ver todos</button>
        </div>
        <div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando...</div>
          ) : recentAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No hay turnos próximos.</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Dueño</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAppointments.map((row: any) => {
                      const date = new Date(row.date_time);
                      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dateStr = date.toLocaleDateString();
                      return (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {dateStr} {timeStr}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {row.pets?.name || 'Unknown'} <span className="text-slate-400">({row.pets?.species})</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {row.clients ? `${row.clients.first_name} ${row.clients.last_name}` : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{row.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {recentAppointments.map((row: any) => {
                  const date = new Date(row.date_time);
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={row.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                          <Clock size={14} className="text-slate-400" />
                          {timeStr}
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <PawPrint size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{row.pets?.name}</p>
                          <p className="text-xs text-slate-500">{row.pets?.species} • {row.clients?.first_name} {row.clients?.last_name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="font-bold">Motivo:</span> {row.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 inline-flex text-[10px] leading-5 font-bold uppercase tracking-wider rounded-full ${status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
      status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
        status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
    }`}>
    {status === 'CONFIRMED' ? 'Confirmado' : status === 'PENDING' ? 'Pendiente' : status === 'COMPLETED' ? 'Finalizado' : status}
  </span>
);

export default Dashboard;
