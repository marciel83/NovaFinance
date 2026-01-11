
import React, { useState } from 'react';
import { Family, FamilyMember, UserRole } from '../types';
import { Users, PlusCircle, LogIn, Sparkles, ArrowRight, ShieldCheck, Key, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface FamilySetupPageProps {
  userName: string;
  userEmail: string;
  onComplete: (family: Family, role: UserRole) => void;
}

const FamilySetupPage: React.FC<FamilySetupPageProps> = ({ userName, userEmail, onComplete }) => {
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFullFamilyData = async (familyId: string, userId: string) => {
    // Busca os detalhes da família
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (familyError || !family) throw familyError || new Error("Família não encontrada.");

    // Busca os membros e seus perfis
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('user_id, role, profiles(name, email)')
      .eq('family_id', familyId);

    const mappedMembers: FamilyMember[] = (members || []).map(m => ({
      id: m.user_id,
      name: (m.profiles as any)?.name || 'Membro sem nome',
      email: (m.profiles as any)?.email || '',
      role: m.role as UserRole,
      isMe: m.user_id === userId
    }));

    return {
      id: family.id,
      name: family.name,
      adminId: family.admin_id,
      members: mappedMembers,
      invites: []
    } as Family;
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Criar família
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{ name: familyName.trim(), admin_id: user.id }])
        .select()
        .single();

      if (familyError) throw familyError;

      // 2. Adicionar criador como membro admin
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([{ family_id: family.id, user_id: user.id, role: 'admin' }]);

      if (memberError) throw memberError;

      // 3. Buscar dados completos e completar o fluxo
      const fullFamily = await fetchFullFamilyData(family.id, user.id);
      onComplete(fullFamily, 'admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code || loading) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Erro de autenticação.");

      // 1. Validar convite
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (inviteError) throw inviteError;
      if (!invite) throw new Error("Código de convite não encontrado.");
      if (invite.used_at) throw new Error("Este convite já foi utilizado.");
      
      const now = new Date();
      const expiration = new Date(invite.expires_at);
      if (now > expiration) throw new Error("Este convite expirou.");

      // 2. Adicionar como membro
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([{ family_id: invite.family_id, user_id: user.id, role: 'participant' }]);

      if (memberError) {
        if (memberError.code === '23505') throw new Error("Você já faz parte desta família.");
        throw memberError;
      }

      // 3. Marcar convite como usado
      await supabase
        .from('invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invite.id);

      const fullFamily = await fetchFullFamilyData(invite.family_id, user.id);
      onComplete(fullFamily, 'participant');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#05070a] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="relative w-full max-w-4xl animate-in fade-in slide-in-from-bottom-12 duration-700">
        <div className="text-center mb-16">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] mb-6 shadow-2xl shadow-blue-500/20">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
            Olá, <span className="text-blue-500">{userName}</span>.<br />
            Qual o próximo passo?
          </h1>
          <p className="text-slate-500 uppercase tracking-[0.3em] text-xs font-black">Escolha como deseja gerenciar seu orçamento</p>
        </div>

        {mode === 'selection' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => setMode('create')}
              className="glass group p-10 rounded-[3rem] border border-white/5 hover:border-blue-500/50 hover:bg-white/5 transition-all text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                <PlusCircle className="w-32 h-32 text-blue-500" />
              </div>
              <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
                <PlusCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Criar uma Família</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Inicie um novo grupo financeiro. Você será o <span className="text-blue-400 font-bold">Administrador</span> e poderá convidar membros.
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-[10px]">
                Começar Agora <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>

            <button 
              onClick={() => setMode('join')}
              className="glass group p-10 rounded-[3rem] border border-white/5 hover:border-indigo-500/50 hover:bg-white/5 transition-all text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                <LogIn className="w-32 h-32 text-indigo-500" />
              </div>
              <div className="p-4 bg-indigo-500/10 rounded-2xl w-fit mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <LogIn className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Entrar com Convite</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Já possui um código? Digite-o para entrar em uma família existente como <span className="text-indigo-400 font-bold">Participante</span>.
              </p>
              <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                Usar Código <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
            <div className="glass border border-white/10 rounded-[3rem] p-10">
              <button 
                onClick={() => {
                  setMode('selection');
                  setError('');
                }} 
                className="text-slate-500 hover:text-white mb-6 flex items-center gap-2 uppercase font-black text-[10px] tracking-widest transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl ${mode === 'create' ? 'bg-blue-500/10' : 'bg-indigo-500/10'}`}>
                  {mode === 'create' ? <ShieldCheck className="w-8 h-8 text-blue-500" /> : <Key className="w-8 h-8 text-indigo-500" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {mode === 'create' ? 'Nova Família' : 'Entrar via Código'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {mode === 'create' ? 'Dê um nome ao seu clã financeiro.' : 'Digite o código de 8 caracteres.'}
                  </p>
                </div>
              </div>
              <form onSubmit={mode === 'create' ? handleCreateFamily : handleJoinFamily} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest ml-1">
                    {mode === 'create' ? 'Nome da Família' : 'Código de Convite'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={mode === 'create' ? familyName : inviteCode}
                    onChange={(e) => {
                      if (mode === 'create') setFamilyName(e.target.value);
                      else setInviteCode(e.target.value);
                      setError('');
                    }}
                    placeholder={mode === 'create' ? "Ex: Família Silva" : "X7Y2Z9W1"}
                    className={`w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all font-medium placeholder:text-slate-700 ${
                      mode === 'join' ? 'text-center text-xl font-black tracking-widest focus:border-indigo-500/50 uppercase' : 'focus:border-blue-500/50'
                    }`}
                  />
                  {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center mt-2 leading-relaxed">{error}</p>}
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
                    mode === 'create' 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                  }`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'create' ? 'Fundar Família' : 'Validar Código')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilySetupPage;
