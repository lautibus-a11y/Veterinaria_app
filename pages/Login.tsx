import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PawPrint, Mail, Lock, Loader2, ArrowRight, ShieldCheck, X, Users } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                // Sign Up Flow
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name }
                    }
                });

                if (signUpError) throw signUpError;

                if (authData.user) {
                    setSuccess('¡Cuenta creada! Revisa tu correo o intenta iniciar sesión.');
                    setIsSignUp(false);
                }
            } else {
                // Login Flow
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;
                onLoginSuccess();
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Error en la autenticación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-outfit">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative z-10">

                {/* Left Side: Branding/Visual */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border-r border-white/5 relative text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <PawPrint className="text-white" size={28} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">VetPro<span className="text-emerald-400">SaaS</span></span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-black leading-tight">
                            {isSignUp ? 'Empieza tu' : 'Gestiona tu'} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Veterinaria</span> <br />
                            con Inteligencia.
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                            La plataforma integrada para el cuidado animal que combina eficiencia administrativa con diagnóstico avanzado por IA.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#1e293b] bg-slate-800 flex items-center justify-center overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-slate-500 text-sm font-medium">+500 veterinarias confían en nosotros</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-slate-500 text-sm">
                        <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> Seguridad SSL</span>
                        <span>© 2024 VetPro. All rights reserved.</span>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 lg:p-16 flex flex-col justify-center bg-slate-900/40">
                    <div className="lg:hidden flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <PawPrint className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold text-white">VetPro</span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white mb-3">
                            {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
                        </h2>
                        <p className="text-slate-400">
                            {isSignUp ? 'Únete a la red más avanzada de cuidado animal.' : 'Ingresa tus credenciales para acceder al panel.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3 animate-in fade-in zoom-in-95">
                                <div className="w-8 h-8 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <X size={16} />
                                </div>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in zoom-in-95">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <ShieldCheck size={16} />
                                </div>
                                {success}
                            </div>
                        )}

                        {isSignUp && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-500">
                                        <Users size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Dr. Juan Pérez"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="admin@veterinaria.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
                                {!isSignUp && (
                                    <a href="#" className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">¿Olvidaste tu contraseña?</a>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-emerald-400 transition-colors text-slate-500">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-slate-400 text-sm font-medium hover:text-emerald-400 transition-colors"
                        >
                            {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
