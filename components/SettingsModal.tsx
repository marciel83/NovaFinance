
import React, { useState, useEffect } from 'react';
import { Family, UserRole, InviteCode, CurrencyCode, FamilyMember } from '../types';
import { X, Users, ShieldCheck, User as UserIcon, Plus, Copy, Check, Clock, AlertTriangle, Coins, Settings, Loader2, PowerOff, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SettingsModalProps {
  family: Family;
  userId: string;
  role: UserRole;
  currency: CurrencyCode;
  onUpdateCurrency: (code: CurrencyCode) => void;
  onClose: () => void;
  onUpdateFamily: (family: Family) => void;
  onRequestCloseCycle: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  family, 
  userId, 
  role, 
  currency, 
  onUpdateCurrency, 
  onClose, 
  onUpdateFamily,
  onRequestCloseCycle
}) => {
  const [activeInvite, setActiveInvite] = useState<InviteCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Busca os membros reais da família
  useEffect(() => {
    const fetchMembers = async () => {
      if (!family?.id) return;
      
      setLoadingMembers(true);
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('family_members')
          .select('user_id, role')
          .eq('family_id', family.id);

        if (membersError) throw membersError;

        if (membersData && membersData.length > 0) {
          const userIds = membersData.map(m => m.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);

          if (profilesError) throw profilesError;

          const mappedMembers: FamilyMember[] = membersData.map(m => {
            const prof = profilesData?.find(p => p.id === m.user_id);
            return {
              id: m.user_id,
              name: prof?.name || 'Membro sem nome',
              email: prof?.email || '',
              role: m.role as UserRole,
              isMe: m.user_id === userId
            };
          });
          
          const sortedMembers = mappedMembers.sort((a, b) => {
            if (a.isMe) return -1;
            if (b.isMe) return 1;
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return a.name.localeCompare(b.name);
          });

          setMembers(sortedMembers);
        } else {
          setMembers([]);
        }
      } catch (err: any) {
        console.error("Falha ao sincronizar membros:", err.message || err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [family?.id, userId]);

  const generateInvite = async () => {
    setLoadingInvite(true);
    try {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('invites')
        .insert([{
          family_id: family.id,
          code,
          expires_at: expiresAt,
          created_by: userId
        }])
        .select()
        .single();

      if (error) throw error;

      const newInvite: InviteCode = {
        code: data.code,
        family_id: data.family_id,
        created_at: data.created_at,
        expires_at: data.expires_at,
        created_by: data.created_by,
        used_at: null
      };

      setActiveInvite(newInvite);
    } catch (err: any) {
      console.error("Erro ao gerar convite:", err.message || err);
      alert("Falha ao gerar convite. Tente novamente.");
    } finally {
      setLoadingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currencies: { code: CurrencyCode, label: string, symbol: string }[] = [
    { code: 'BRL', label: 'Real', symbol: 'R$' },
    { code: 'USD', label: 'Dólar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' }
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/5 rounded-2xl">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Configurações</h3>
              <p className="text-slate-400 text-sm">{family.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-12">
          {/* Seção: Moeda */}
          <section>
            <div className="flex items-center gap-2 mb-6 ml-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">Moeda do Sistema</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => onUpdateCurrency(curr.code)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all ${
                    currency === curr.code
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className={`text-xl font-black ${currency === curr.code ? 'text-amber-500' : 'text-slate-400'}`}>
                    {curr.symbol}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{curr.label}</span>
                  {currency === curr.code && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1"></div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Seção: Membros da Família */}
          <section>
            <div className="flex items-center gap-2 mb-6 ml-1">
              <Users className="w-4 h-4 text-blue-500" />
              <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">Membros da Família</h4>
            </div>
            
            {loadingMembers ? (
              <div className="flex items-center justify-center py-10 bg-white/5 rounded-3xl border border-white/5">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {members.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-xs italic uppercase tracking-widest">Nenhum membro encontrado</p>
                ) : (
                  members.map((member) => (
                    <div 
                      key={member.id} 
                      className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/10"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${member.role === 'admin' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                          {member.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-bold text-white text-sm truncate">
                            {member.name}
                          </p>
                          {member.role === 'admin' && (
                            <span className="text-[9px] font-black bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md tracking-widest uppercase ml-1">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {member.isMe && (
                        <span className="text-[8px] bg-white/10 px-2 py-1 rounded-md text-slate-400 font-black tracking-widest uppercase shrink-0">
                          Você
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Seção: Convites (Apenas Admin) */}
          {role === 'admin' && (
            <section className="pt-10 border-t border-white/5">
              <div className="flex items-center justify-between mb-6 ml-1">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">Expansão de Família</h4>
                </div>
              </div>

              {!activeInvite ? (
                <div className="glass p-8 rounded-3xl border border-dashed border-white/10 text-center">
                  <p className="text-slate-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                    Gere um código de convite seguro para adicionar novos participantes.
                  </p>
                  <button 
                    onClick={generateInvite}
                    disabled={loadingInvite}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all mx-auto shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {loadingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
                    Gerar Novo Convite
                  </button>
                </div>
              ) : (
                <div className="bg-white/5 border border-emerald-500/20 p-8 rounded-3xl text-center animate-in zoom-in-95 duration-300">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest mb-4">
                    <Clock className="w-3 h-3" /> Válido por 24 horas
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-slate-900 border border-white/10 px-8 py-5 rounded-2xl text-3xl font-black text-white tracking-[0.3em] uppercase shadow-inner">
                      {activeInvite.code}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(activeInvite.code)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Seção: Controle de Ciclo (Apenas Admin) */}
          {role === 'admin' && (
            <section className="pt-10 border-t border-white/5">
              <div className="flex items-center gap-2 mb-6 ml-1">
                <PowerOff className="w-4 h-4 text-rose-500" />
                <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">Gestão de Ciclo</h4>
              </div>
              <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                  Finalize o período atual para iniciar um novo planejamento. Os dados serão arquivados no histórico.
                </p>
                <button 
                  onClick={onRequestCloseCycle}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-rose-500/10 active:scale-95"
                >
                  <PowerOff className="w-4 h-4" />
                  Fechar ciclo
                </button>
              </div>
            </section>
          )}

          {/* Seção de Logout / Encerramento de Sessão */}
          <section className="pt-10 border-t border-white/5">
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center justify-center gap-3 py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] transition-all border border-rose-500/20 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Encerrar Sessão
            </button>
          </section>

          {role === 'participant' && (
            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
              <div>
                <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-1">Restrição de Acesso</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Apenas o <span className="text-white font-bold">Administrador</span> pode gerenciar membros e ciclos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 pt-10 border-t border-white/5">
          <button onClick={onClose} className="w-full py-4 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
