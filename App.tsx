
import React, { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
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

const { Sparkles, Loader2, AlertTriangle, Menu, LayoutDashboard } = LucideIcons;

type AppState = 'BOOTING' | 'UNAUTHORIZED' | 'VERIFYING_FAMILY' | 'READY' | 'SETUP_REQUIRED';

interface HistorySummary {
  budgeted: number;
  income: number;
  spent: number;
  balance: number;
}

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
  const [lastClosureDate, setLastClosureDate] = useState<string | undefined>(undefined);
  const [lastCycleDate, setLastCycleDate] = useState<string | undefined>(undefined);
  const [historySummary, setHistorySummary] = useState<HistorySummary | undefined>(undefined);

  // Estados para Fechamento de Ciclo
  const [isClosureConfirmOpen, setIsClosureConfirmOpen] = useState(false);
  const [isClosingCycle, setIsClosingCycle] = useState(false);

  // Referência para salvar a posição de rolagem do Dashboard
  const dashboardScrollPos = useRef<number>(0);
  
  // Referência para rastrear se o usuário já foi inicializado (evita sync ao trocar abas)
  const lastInitializedUserId = useRef<string | null>(null);

  const navigateTo = (view: 'dashboard' | 'budget' | 'transactions' | 'income') => {
    if (view !== currentView) {
      // Se estamos saindo do dashboard, salvamos a posição atual do scroll
      if (currentView === 'dashboard') {
        dashboardScrollPos.current = window.scrollY;
      }
      
      localStorage.removeItem('novafinance_selected_tx_id');
      localStorage.removeItem('novafinance_is_editing_tx');
      localStorage.removeItem('novafinance_draft_edit_tx');
      setCurrentView(view);
    }
  };

  // Efeito para restaurar ou resetar o scroll ao trocar de visualização interna
  useLayoutEffect(() => {
    if (currentView === 'dashboard') {
      requestAnimationFrame(() => {
        window.scrollTo(0, dashboardScrollPos.current);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentView]);

  // Novo Efeito: Preservar scroll ao sair/voltar para a aba ou app (Visibility Change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (currentView !== 'dashboard') return;

      if (document.visibilityState === 'hidden') {
        // Ao "esconder" a aba, garantimos que a posição atual está salva
        dashboardScrollPos.current = window.scrollY;
      } else if (document.visibilityState === 'visible') {
        // Ao "voltar" para a aba, forçamos a restauração da posição salva
        requestAnimationFrame(() => {
          window.scrollTo(0, dashboardScrollPos.current);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentView]);

  const loadFinancialData = useCallback(async (familyId: string) => {
    try {
      const { count } = await supabase
        .from('monthly_closures')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId);

      if (count === 0) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        await supabase
          .from('monthly_closures')
          .insert([{
            family_id: familyId,
            closed_at: lastMonth.toISOString(),
            closed_by: null,
            created_at: new Date().toISOString()
          }]);
      }

      const { data: allClosures } = await supabase
        .from('monthly_closures')
        .select('*')
        .eq('family_id', familyId)
        .order('closed_at', { ascending: true });
      
      if (allClosures && allClosures.length > 0) {
        let historyChain: { closed_at: string, cycle_date: string, closed_by: string | null }[] = [];
        
        allClosures.forEach((c, index) => {
          if (index === 0) {
            historyChain.push({ ...c, cycle_date: c.closed_at });
          } else {
            const prev = historyChain[index - 1];
            let calculatedCycleDate: string;
            
            if (c.closed_by !== null) {
              const d = new Date(prev.cycle_date);
              d.setMonth(d.getMonth() + 1);
              calculatedCycleDate = d.toISOString();
            } else {
              calculatedCycleDate = c.closed_at;
            }
            historyChain.push({ ...c, cycle_date: calculatedCycleDate });
          }
        });

        const latest = historyChain[historyChain.length - 1];
        const prev = historyChain.length > 1 ? historyChain[historyChain.length - 2] : null;

        setLastClosureDate(latest.closed_at);
        setLastCycleDate(latest.cycle_date);

        let txHistQuery = supabase.from('transactions').select('amount').eq('family_id', familyId).lte('created_at', latest.closed_at);
        let incHistQuery = supabase.from('incomes').select('amount').eq('family_id', familyId).lte('created_at', latest.closed_at);
        let bdgHistQuery = supabase.from('budgets').select('limit_amount, installment_active, created_at').eq('family_id', familyId).lte('created_at', latest.closed_at);

        if (prev) {
          txHistQuery = txHistQuery.gt('created_at', prev.closed_at);
          incHistQuery = incHistQuery.gt('created_at', prev.closed_at);
        }

        const [histTxs, histIncs, histBudgets] = await Promise.all([
          txHistQuery,
          incHistQuery,
          bdgHistQuery
        ]);

        const hSpent = (histTxs.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const hIncome = (histIncs.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const hBudgeted = (histBudgets.data || []).filter(b => {
          if (b.installment_active) return true;
          if (!prev) return true; 
          return b.created_at >= prev.closed_at;
        }).reduce((acc, curr) => acc + (curr.limit_amount || 0), 0);

        setHistorySummary({
          budgeted: hBudgeted,
          income: hIncome,
          spent: hSpent,
          balance: hIncome - hSpent
        });
      }

      const [txs, incs, bdgs] = await Promise.all([
        supabase.from('transactions').select('*').eq('family_id', familyId),
        supabase.from('incomes').select('*').eq('family_id', familyId),
        supabase.from('budgets').select('*').eq('family_id', familyId)
      ]);

      if (txs.data) {
        setTransactions(txs.data.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date,
          category: t.category,
          authorName: t.author_name || 'Membro',
          createdAt: t.created_at
        })));
      }
      
      if (incs.data) {
        setIncomes(incs.data.map(i => ({
          id: i.id,
          description: i.description,
          amount: i.amount,
          date: i.date,
          source: i.source,
          authorName: i.author_name || 'Membro',
          createdAt: i.created_at
        })));
      }
      
      if (bdgs.data) {
        setBudgets(bdgs.data.map(b => ({
          category: b.category,
          limit: b.limit_amount || 0,
          iconKey: b.icon_key || 'more',
          dueDate: b.due_date,
          installmentActive: b.installment_active,
          installmentsTotal: b.installments_total,
          installmentsCurrent: b.installments_current,
          createdAt: b.created_at
        })));
      }
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    }
  }, []);

  const initializeAppData = useCallback(async (userId: string) => {
    // Só muda o estado para carregamento se ainda não estivermos prontos
    setAppState(prev => (prev === 'READY' ? 'READY' : 'VERIFYING_FAMILY'));
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileData) setProfile(profileData);

      const { data: memberData } = await supabase
        .from('family_members')
        .select('family_id, role, families(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (memberData && memberData.families) {
        const { families, role } = memberData;
        setUserRole(role as UserRole);

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

        await loadFinancialData(families.id);
        setAppState('READY');
        lastInitializedUserId.current = userId;
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
        lastInitializedUserId.current = initialSession.user.id;
        initializeAppData(initialSession.user.id);
      } else {
        setAppState('UNAUTHORIZED');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      const currentId = currentSession?.user?.id;
      
      if (event === 'SIGNED_IN' && currentSession) {
        // CRITICAL: Só dispara a inicialização se o usuário for REALMENTE diferente do último inicializado.
        // Isso impede que o foco na aba dispare a tela de "Sincronizando Dados".
        if (currentId !== lastInitializedUserId.current) {
          initializeAppData(currentSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setFamily(null);
        setUserRole('participant');
        setAppState('UNAUTHORIZED');
        lastInitializedUserId.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAppData]);

  const summary = useMemo(() => {
    const budgeted = budgets.filter(b => {
      if (!lastClosureDate || !b.createdAt) return true;
      if (b.installmentActive) return true;
      return b.createdAt >= lastClosureDate;
    }).reduce((acc, curr) => acc + (curr.limit || 0), 0);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredTransactions = transactions.filter(t => {
      if (!lastClosureDate || !t.createdAt) {
        const [year, month] = t.date.split('-').map(Number);
        return year === currentYear && (month - 1) === currentMonth;
      }
      return t.createdAt > lastClosureDate;
    });

    const spent = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    const filteredIncomes = incomes.filter(inc => {
      if (!lastClosureDate || !inc.createdAt) {
        const [year, month] = inc.date.split('-').map(Number);
        return year === currentYear && (month - 1) === currentMonth;
      }
      return inc.createdAt > lastClosureDate;
    });

    const totalIncome = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    
    return {
      budgeted,
      income: totalIncome,
      spent,
      difference: totalIncome - spent,
      filteredTransactions,
      filteredIncomes
    };
  }, [transactions, budgets, incomes, lastClosureDate]);

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'authorName'>) => {
    if (!family || !session) return;
    const authorName = profile?.name || session.user.email;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          description: newTx.description,
          amount: newTx.amount,
          category: newTx.category,
          date: newTx.date,
          family_id: family.id, 
          user_id: session.user.id,
          author_name: authorName,
          created_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (error) {
        console.error("Erro Supabase ao adicionar despesa:", error.message);
        return;
      }

      if (data) {
        setTransactions(prev => [...prev, {
          id: data.id,
          description: data.description,
          amount: data.amount,
          category: data.category,
          date: data.date,
          authorName: data.author_name || authorName,
          createdAt: data.created_at
        }]);
      }
    } catch (err) {
      console.error("Erro inesperado ao registrar despesa:", err);
    }
  };

  const handleUpdateTransaction = async (id: string, updated: Partial<Transaction>) => {
    const { error } = await supabase
      .from('transactions')
      .update({
        description: updated.description,
        amount: updated.amount,
        date: updated.date,
        category: updated.category,
      })
      .eq('id', id);

    if (!error) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    }
  };

  const handleAddIncome = async (newInc: Omit<Income, 'id'>) => {
    if (!family || !session) return;
    
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([{ 
          description: newInc.description,
          amount: newInc.amount,
          source: newInc.source,
          date: newInc.date,
          author_name: newInc.authorName,
          family_id: family.id, 
          user_id: session.user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();
      
      if (error) {
        console.error("Erro Supabase ao adicionar receita:", error.message);
        return;
      }

      if (data) {
        setIncomes(prev => [...prev, {
          id: data.id,
          description: data.description,
          amount: data.amount,
          source: data.source,
          date: data.date,
          authorName: data.author_name || newInc.authorName,
          createdAt: data.created_at
        }]);
      }
    } catch (err) {
      console.error("Erro inesperado ao registrar receita:", err);
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
    const now = new Date().toISOString();
    await supabase.from('budgets').delete().eq('family_id', family.id);
    const { data, error } = await supabase
      .from('budgets')
      .insert(newBudgets.map(b => ({ 
        family_id: family.id,
        category: b.category,
        limit_amount: b.limit,
        icon_key: b.iconKey,
        due_date: b.dueDate || null,
        // Fix: Use camelCase properties from CategoryBudget type (installmentActive, installmentsTotal, installmentsCurrent)
        installment_active: b.installmentActive || false,
        installments_total: b.installmentsTotal || null,
        installments_current: b.installmentsCurrent || null,
        created_at: b.createdAt || now
      })))
      .select();
    
    if (data) {
      setBudgets(data.map(b => ({
        category: b.category,
        limit: b.limit_amount,
        iconKey: b.icon_key,
        dueDate: b.due_date,
        installmentActive: b.installment_active,
        installmentsTotal: b.installments_total,
        installmentsCurrent: b.installments_current,
        createdAt: b.created_at
      })));
    }
  };

  const handleConfirmClosure = async () => {
    if (!family || !session) return;
    setIsClosingCycle(true);
    try {
      const now = new Date().toISOString();
      const { error: closureError } = await supabase
        .from('monthly_closures')
        .insert([{
          family_id: family.id,
          closed_at: now,
          closed_by: session.user.id,
          created_at: now
        }]);

      if (closureError) throw closureError;

      const updatedBudgetsForCycle = budgets.map(b => {
        if (b.installmentActive) {
          const nextInstallment = (b.installmentsCurrent || 0) + 1;
          const totalInstallments = b.installmentsTotal || 1;
          return {
            ...b,
            installmentsCurrent: Math.min(nextInstallment, totalInstallments),
            createdAt: now 
          };
        }
        return b; 
      });

      await handleUpdateBudgets(updatedBudgetsForCycle);
      await loadFinancialData(family.id);
      setIsClosureConfirmOpen(false);
    } catch (err) {
      console.error("Erro ao fechar ciclo:", err);
    } finally {
      setIsClosingCycle(false);
    }
  };

  const getMonthNames = () => {
    const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const now = new Date();
    const current = months[now.getMonth()];
    const nextDate = new Date();
    nextDate.setMonth(now.getMonth() + 1);
    const next = months[nextDate.getMonth()];
    return { current, next };
  };
  const { current: currentMonthName, next: nextMonthName } = getMonthNames();

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

      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5 mb-8">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('dashboard')}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">NovaFinance</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold leading-none">{family.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentView !== 'dashboard' && (
            <button 
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all group active:scale-95"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Dashboard</span>
            </button>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all group active:scale-95"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
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
              lastClosureDate={lastClosureDate}
              lastCycleDate={lastCycleDate}
              historySummary={historySummary}
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
          <BudgetPage initialBudgets={budgets} transactions={summary.filteredTransactions} onSave={handleUpdateBudgets} onBack={() => navigateTo('dashboard')} currency={currency} lastClosureDate={lastClosureDate} />
        ) : currentView === 'income' ? (
          <IncomePage incomes={summary.filteredIncomes} userName={profile?.name || session.user.email} onAddIncome={handleAddIncome} onRemoveIncome={handleRemoveIncome} onBack={() => navigateTo('dashboard')} currency={currency} />
        ) : (
          <TransactionsPage transactions={summary.filteredTransactions} budgets={budgets} onRemove={handleRemoveTransaction} onUpdate={handleUpdateTransaction} onAddTransaction={handleAddTransaction} onBack={() => navigateTo('dashboard')} currency={currency} />
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
          onRequestCloseCycle={() => setIsClosureConfirmOpen(true)}
        />
      )}

      {/* Pop-up de Confirmação de Fechamento de Ciclo (Global e Centralizado) */}
      {isClosureConfirmOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
          <div className="relative w-full max-w-md bg-[#0a0f18] border border-rose-500/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">ATENÇÃO</h3>
              <div className="space-y-4 text-slate-400 text-sm leading-relaxed mb-10 text-left">
                <p>Você está prestes a fechar o ciclo financeiro atual.</p>
                <p className="font-bold text-rose-400">Esta ação não pode ser desfeita.</p>
                <p>Depois que o ciclo for fechado, os dados já registrados não poderão mais ser alterados ou realocados para outro período.</p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <p>Ao confirmar esta ação:</p>
                  <ul className="space-y-2 list-disc list-inside text-xs">
                    <li>Tudo o que foi registrado até este momento será considerado como ciclo encerrado e passará a compor o histórico do mês de <span className="text-white font-bold">{currentMonthName}</span>.</li>
                    <li>A partir deste momento, todos os novos registros (despesas, receitas e orçamento) passarão a valer para o ciclo do mês de <span className="text-blue-400 font-bold">{nextMonthName}</span>.</li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => setIsClosureConfirmOpen(false)}
                  className="py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/10"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmClosure}
                  disabled={isClosingCycle}
                  className="py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl shadow-rose-900/30 flex items-center justify-center gap-2"
                >
                  {isClosingCycle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar fechamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
