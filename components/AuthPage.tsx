
import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthPageProps {
  onAuthenticated: (email: string, name: string) => void;
}

type AuthMode = 'login' | 'register' | 'confirm';

const AuthPage: React.FC<AuthPageProps> = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });

        if (signUpError) throw signUpError;
        
        // Criar perfil no DB
        if (data.user) {
          await supabase.from('profiles').insert([
            { id: data.user.id, name, email }
          ]);
        }
        
        setMode('confirm');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setShowPassword(false);
    setError('');
  };

  if (mode === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#05070a] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

        <div className="relative w-full max-w-md glass border border-white/10 rounded-[3rem] p-10 text-center animate-in zoom-in-95 duration-500 shadow-2xl">
          <div className="inline-flex p-5 bg-emerald-500/10 rounded-3xl mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Verifique seu E-mail</h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            Enviamos um link de confirmação para <span className="text-blue-400 font-bold">{email}</span>. 
            Por favor, verifique sua caixa de entrada para ativar sua conta.
          </p>
          <button
            onClick={() => setMode('login')}
            className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all border border-white/10"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#05070a] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/15 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/15 blur-[120px] rounded-full"></div>
      
      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-12 duration-700">
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">NovaFinance</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black mt-2">Smart Family Protocol</p>
          </div>
        </div>

        <div className="glass border border-white/10 rounded-[3rem] p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'login' ? 'Acesse seu painel futurista.' : 'Inicie sua jornada financeira hoje.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-14 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {mode === 'login' ? 'Entrar no Dashboard' : 'Finalizar Cadastro'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button
              onClick={toggleMode}
              className="text-xs uppercase font-black tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
            >
              {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Faça Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
