
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, Income, CategoryBudget, Family, FamilyMember, UserRole, CurrencyCode } from './types';
import DashboardCards from './components/DashboardCards';
import BudgetPage from './components/BudgetPage';
import TransactionsPage from './components/TransactionsPage';
import IncomePage from './components/IncomePage';
import AuthPage from './components/AuthPage';
import FamilySetupPage from './components/FamilySetupPage';
import SettingsModal from './components/SettingsModal';
import * as LucideIcons from 'lucide-react';
import { supabase } from './supabaseClient';

const { LayoutDashboard: DashIcon, Sparkles, LogOut, Settings: SettingsIcon, Loader2 } = LucideIcons;

// Estados possíveis da aplicação para controle de fluxo determinístico
type AppState = 'BOOTING' | 'UNAUTHORIZED' | 'VERIFYING_FAMILY' | 'READY' | 'SETUP_REQUIRED';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('BOOTING');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('participant');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'budget' | 'transactions' | 'income'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);

  // Limpa rascunhos ao navegar internamente
  const navigateTo = (view: 'dashboard' | 'budget' | 'transactions' | 'income') => {
    if (view !== currentView) {
      localStorage.removeItem('novafinance_draft_expense');
      localStorage.removeItem('novafinance_draft_income');
      localStorage.removeItem('novafinance_draft_budget');
      localStorage.removeItem('novafinance_modal_expense');
      localStorage.removeItem('novafinance_modal_income');
      localStorage.removeItem('novafinance_modal_budget');
      // Limpeza específica das transações recentes
      localStorage.removeItem('novafinance_selected_tx_id');
      localStorage.removeItem('novafinance_is_editing_tx');
      localStorage.removeItem('novafinance_draft_edit_tx');
      setCurrentView(view);
    }
  };

  // Carrega dados financeiros em segundo plano
  const loadFinancialData = useCallback(async (familyId: string) => {
    try {
      const [txs, incs, bdgs] = await Promise.all([
        supabase.from('transactions').select('*').eq('family_id', familyId),
        supabase.from('incomes').select('*').eq('family_id', familyId),
        supabase.from('budgets').select('*').eq('family_id', familyId)
      ]);

      if (txs.data) {
        const mappedTxs: Transaction[] = txs.data.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date,
          category: t.category,
          authorName: t.author_name || 'Membro'
        }));
        setTransactions(mappedTxs);
      }
      
      if (incs.data) {
        const mappedIncomes: Income[] = incs.data.map(i => ({
          id: i.id,
          description: i.description,
          amount: i.amount,
          date: i.date,
          source: i.source,
          authorName: i.author_name || 'Membro'
        }));
        setIncomes(mappedIncomes);
      }
      
      if (bdgs.data) {
        const mappedBudgets: CategoryBudget[] = bdgs.data.map(b => ({
          category: b.category,
          limit: b.limit_amount || 0,
          iconKey: b.icon_key || 'more'
        }));
        setBudgets(mappedBudgets);
      }
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    }
  }, []);

  // Verifica se o usuário tem uma família e carrega perfil
  const initializeAppData = useCallback(async (userId: string) => {
    setAppState('VERIFYING_FAMILY');
    try {
      // 1. Perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileData) setProfile(profileData);

      // 2. Família e Cargo do Usuário Atual
      const { data: memberData } = await supabase
        .from('family_members')
        .select('family_id, role, families(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (memberData && memberData.families) {
        const { families, role } = memberData;
        setUserRole(role as UserRole);

        // 3. Membros (Busca separada de perfis para evitar erro de relacionamento)
        const { data: membersList, error: membersError } = await supabase
          .from('family_members')
          .select('user_id, role')
          .eq('family_id', families.id);

        if (membersError) throw membersError;

        const userIds = membersList?.map(m => m.user_id) || [];
        const { data: profilesList } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        const mappedMembers: FamilyMember[] = (membersList || []).map(m => {
          const prof = profilesList?.find(p => p.id === m.user_id);
          return {
            id: m.user_id,
            name: prof?.name || 'Membro sem nome',
            email: prof?.email || '',
            role: m.role as UserRole,
            isMe: m.user_id === userId
          };
        });

        setFamily({
          id: families.id,
          name: families.name,
          adminId: families.admin_id,
          members: mappedMembers,
          invites: []
        });

        setAppState('READY');
        loadFinancialData(families.id);
      } else {
        setAppState('SETUP_REQUIRED');
      }
    } catch (err) {
      console.error("Erro na inicialização de dados:", err);
      setAppState('SETUP_REQUIRED');
    }
  }, [loadFinancialData]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        initializeAppData(initialSession.user.id);
      } else {
        setAppState('UNAUTHORIZED');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      if (event === 'SIGNED_IN' && currentSession) {
        initializeAppData(currentSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setFamily(null);
        setUserRole('participant');
        setAppState('UNAUTHORIZED');
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAppData]);

  const summary = useMemo(() => {
    const budgeted = budgets.reduce((acc, curr) => acc + curr.limit, 0);
    const spent = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    
    return {
      budgeted,
      income: totalIncome,
      spent,
      difference: totalIncome > 0 ? totalIncome - spent : budgeted - spent
    };
  }, [transactions, budgets, incomes]);

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'authorName'>) => {
    if (!family || !session) return;
    const authorName = profile?.name || session.user.email;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        description: newTx.description,
        amount: newTx.amount,
        category: newTx.category,
        date: newTx.date,
        family_id: family.id, 
        user_id: session.user.id,
        author_name: authorName
      }])
      .select()
      .single();

    if (data) {
      const mapped: Transaction = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date,
        authorName: data.author_name
      };
      setTransactions(prev => [...prev, mapped]);
    } else if (error) {
      console.error("Erro ao adicionar transação:", error);
    }
  };

  /**
   * Atualiza uma transação existente no Supabase e no estado local.
   */
  const handleUpdateTransaction = async (id: string, updated: Partial<Transaction>) => {
    if (!family || !session) return;
    
    const { error } = await supabase
      .from('transactions')
      .update({
        description: updated.description,
        amount: updated.amount,
        date: updated.date,
        category: updated.category,
      })
      .eq('id', id);

    if (error) {
      console.error("Erro ao atualizar transação:", error);
    } else {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    }
  };

  const handleAddIncome = async (newInc: Omit<Income, 'id'>) => {
    if (!family || !session) return;
    const { data, error } = await supabase
      .from('incomes')
      .insert([{ 
        description: newInc.description,
        amount: newInc.amount,
        source: newInc.source,
        date: newInc.date,
        author_name: newInc.authorName,
        family_id: family.id, 
        user_id: session.user.id 
      }])
      .select()
      .single();
    
    if (data) {
      const mapped: Income = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        source: data.source,
        date: data.date,
        authorName: data.author_name
      };
      setIncomes(prev => [...prev, mapped]);
    } else if (error) {
      console.error("Erro ao adicionar receita:", error);
    }
  };

  const handleRemoveTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleRemoveIncome = async (id: string) => {
    await supabase.from('incomes').delete().eq('id', id);
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateBudgets = async (newBudgets: CategoryBudget[]) => {
    if (!family) return;
    await supabase.from('budgets').delete().eq('family_id', family.id);
    const { data, error } = await supabase
      .from('budgets')
      .insert(newBudgets.map(b => ({ 
        family_id: family.id,
        category: b.category,
        limit_amount: b.limit,
        // FIX: Use 'iconKey' instead of 'icon_key' to align with CategoryBudget interface
        icon_key: b.iconKey
      })))
      .select();
    
    if (data) {
      const mapped: CategoryBudget[] = data.map(b => ({
        category: b.category,
        limit: b.limit_amount,
        iconKey: b.icon_key
      }));
      setBudgets(mapped);
    } else if (error) {
      console.error("Erro ao salvar orçamentos:", error);
    }
  };

  if (appState === 'BOOTING' || appState === 'VERIFYING_FAMILY') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070a] gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">
          {appState === 'BOOTING' ? 'Iniciando Protocolo' : 'Sincronizando Dados'}
        </p>
      </div>
    );
  }

  if (appState === 'UNAUTHORIZED' || !session) {
    return <AuthPage onAuthenticated={() => {}} />;
  }

  if (appState === 'SETUP_REQUIRED' || !family) {
    return (
      <FamilySetupPage 
        userName={profile?.name || session.user.email}
        userEmail={session.user.email}
        onComplete={(newFamily, role) => {
          setFamily(newFamily);
          setUserRole(role);
          setAppState('READY');
          loadFinancialData(newFamily.id);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-b border-white/5 mb-8 gap-6">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigateTo('dashboard')}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">NovaFinance</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{family.name}</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => navigateTo('dashboard')}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl ${currentView === 'dashboard' ? 'text-white bg-white/10' : 'text-slate-500 hover:text-white'}`}
          >
            <DashIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2" />

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-all p-2 rounded-xl bg-white/5 group"
            title="Configurações"
          >
            <SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-all px-4 py-2"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </header>

      <main className="container mx-auto px-6">
        {currentView === 'dashboard' ? (
          <div className="animate-in fade-in slide-in-from-left-8 duration-500 max-w-5xl mx-auto">
            <DashboardCards 
              budgeted={summary.budgeted}
              income={summary.income}
              spent={summary.spent}
              difference={summary.difference}
              currency={currency}
              onBudgetClick={() => navigateTo('budget')}
              onIncomeClick={() => navigateTo('income')}
              onSpentClick={() => navigateTo('transactions')}
            />

            <div className="mt-16 text-center space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Inteligente</span>
              </h2>
              <p className="text-slate-500 text-sm font-medium max-w-lg mx-auto leading-relaxed">
                Bem-vindo(a), {profile?.name || session.user.email}! Gerencie o orçamento de {family.name} em tempo real.
              </p>
            </div>
          </div>
        ) : currentView === 'budget' ? (
          <BudgetPage 
            initialBudgets={budgets} 
            onSave={handleUpdateBudgets}
            onBack={() => navigateTo('dashboard')}
            currency={currency}
          />
        ) : currentView === 'income' ? (
          <IncomePage
            incomes={incomes}
            userName={profile?.name || session.user.email}
            onAddIncome={handleAddIncome}
            onRemoveIncome={handleRemoveIncome}
            onBack={() => navigateTo('dashboard')}
            currency={currency}
          />
        ) : (
          <TransactionsPage
            transactions={transactions}
            budgets={budgets}
            onRemove={handleRemoveTransaction}
            onUpdate={handleUpdateTransaction}
            onAddTransaction={handleAddTransaction}
            onBack={() => navigateTo('dashboard')}
            currency={currency}
          />
        )}
      </main>

      <footer className="mt-20 py-10 text-center border-t border-white/5">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">
          Powered by <span className="text-slate-400">NovaFinance Protocol</span>
        </p>
      </footer>

      {isSettingsOpen && (
        <SettingsModal 
          family={family} 
          userId={session.user.id}
          role={userRole} 
          currency={currency}
          onUpdateCurrency={setCurrency}
          onClose={() => setIsSettingsOpen(false)} 
          onUpdateFamily={(updated) => setFamily(updated)}
        />
      )}
    </div>
  );
};

export default App;
