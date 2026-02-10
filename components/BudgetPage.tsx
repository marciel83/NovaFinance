
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Wallet, Plus, Trash2, LayoutGrid, X, CheckCircle2, Edit2, Info, Save, Calendar, AlertCircle } from 'lucide-react';
import { getCategoryIcon } from '../constants';
import { CategoryBudget, Transaction, CurrencyCode } from '../types';

interface BudgetPageProps {
  initialBudgets: CategoryBudget[];
  transactions: Transaction[];
  onSave: (budgets: CategoryBudget[]) => void;
  onBack: () => void;
  currency: CurrencyCode;
  lastClosureDate?: string;
}

const MODAL_OPEN_KEY = 'novafinance_modal_budget';
const DRAFT_KEY = 'novafinance_draft_budget';

const VIEW_CAT_KEY = 'novafinance_view_category';
const VIEW_EDIT_MODE_KEY = 'novafinance_view_edit_mode';
const VIEW_EDIT_NAME_KEY = 'novafinance_view_edit_name';
const VIEW_EDIT_LIMIT_KEY = 'novafinance_view_edit_limit';
const VIEW_EDIT_DUE_DATE_KEY = 'novafinance_view_edit_due_date';
const VIEW_EDIT_INSTALLMENT_ACTIVE_KEY = 'novafinance_view_edit_installment_active';
const VIEW_EDIT_INSTALLMENTS_TOTAL_KEY = 'novafinance_view_edit_installments_total';
const VIEW_EDIT_INSTALLMENTS_CURRENT_KEY = 'novafinance_view_edit_installments_current';

const BudgetPage: React.FC<BudgetPageProps> = ({ initialBudgets, transactions, onSave, onBack, currency, lastClosureDate }) => {
  const [localBudgets, setLocalBudgets] = useState<CategoryBudget[]>(initialBudgets);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedViewCategory, setSelectedViewCategory] = useState<CategoryBudget | null>(null);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  
  const [isModalInEditMode, setIsModalInEditMode] = useState(false);
  const [modalEditName, setModalEditName] = useState('');
  const [modalEditLimit, setModalEditLimit] = useState('');
  const [modalEditDueDate, setModalEditDueDate] = useState('');
  const [modalEditInstallmentActive, setModalEditInstallmentActive] = useState(false);
  const [modalEditInstallmentsTotal, setModalEditInstallmentsTotal] = useState('');
  const [modalEditInstallmentsCurrent, setModalEditInstallmentsCurrent] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');
  const [newCategoryDueDate, setNewCategoryDueDate] = useState('');
  const [newCategoryInstallmentActive, setNewCategoryInstallmentActive] = useState(false);
  const [newCategoryInstallmentsTotal, setNewCategoryInstallmentsTotal] = useState('');
  const [newCategoryInstallmentsCurrent, setNewCategoryInstallmentsCurrent] = useState('');
  const [selectedIconKey, setSelectedIconKey] = useState('more');
  
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  
  const isPending = (budget: CategoryBudget) => {
    if (budget.installmentActive) return false;
    if (!lastClosureDate || !budget.createdAt) return false;
    return budget.createdAt < lastClosureDate;
  };

  const hasPendingBudgets = useMemo(() => localBudgets.some(isPending), [localBudgets, lastClosureDate]);

  const sortedBudgets = useMemo(() => {
    const spentMap = new Map<string, number>();
    transactions.forEach(t => {
      spentMap.set(t.category, (spentMap.get(t.category) || 0) + t.amount);
    });

    const getStatusGroup = (budget: CategoryBudget) => {
      const spent = spentMap.get(budget.category) || 0;
      const limit = budget.limit;
      const isRed = limit === 0 || spent > limit;
      const isGreen = spent === limit && !isRed;
      if (isRed) return 1;
      if (isGreen) return 2;
      return 0;
    };

    return [...localBudgets].sort((a, b) => {
      const pendA = isPending(a);
      const pendB = isPending(b);
      if (pendA !== pendB) return pendA ? -1 : 1;
      const groupA = getStatusGroup(a);
      const groupB = getStatusGroup(b);
      if (groupA !== groupB) return groupA - groupB;
      return a.category.localeCompare(b.category, 'pt-BR', { sensitivity: 'base' });
    });
  }, [localBudgets, transactions, lastClosureDate]);

  const totalBudgetAmount = useMemo(() => {
    return localBudgets
      .filter(b => !isPending(b))
      .reduce((acc, curr) => acc + (curr.limit || 0), 0);
  }, [localBudgets, lastClosureDate]);

  useEffect(() => {
    setLocalBudgets(initialBudgets);
  }, [initialBudgets]);

  useEffect(() => {
    const savedModalState = localStorage.getItem(MODAL_OPEN_KEY);
    if (savedModalState === 'true') setIsCreateModalOpen(true);

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setNewCategoryName(parsed.name || '');
        setNewCategoryLimit(parsed.limit || '');
        setNewCategoryDueDate(parsed.dueDate || '');
        setNewCategoryInstallmentActive(parsed.installmentActive || false);
        setNewCategoryInstallmentsTotal(parsed.installmentsTotal || '');
        setNewCategoryInstallmentsCurrent(parsed.installmentsCurrent || '');
        setSelectedIconKey(parsed.iconKey || 'more');
        if (parsed.editing) setEditingBudget(parsed.editing);
      } catch (e) { console.error(e); }
    }

    const savedViewCat = localStorage.getItem(VIEW_CAT_KEY);
    if (savedViewCat) {
      const found = initialBudgets.find(b => b.category === savedViewCat);
      if (found) {
        setSelectedViewCategory(found);
        const isEdit = localStorage.getItem(VIEW_EDIT_MODE_KEY) === 'true';
        setIsModalInEditMode(isEdit);
        if (isEdit) {
          setModalEditName(localStorage.getItem(VIEW_EDIT_NAME_KEY) || found.category);
          setModalEditLimit(localStorage.getItem(VIEW_EDIT_LIMIT_KEY) || found.limit.toString());
          setModalEditDueDate(localStorage.getItem(VIEW_EDIT_DUE_DATE_KEY) || found.dueDate || '');
          setModalEditInstallmentActive(localStorage.getItem(VIEW_EDIT_INSTALLMENT_ACTIVE_KEY) === 'true');
          setModalEditInstallmentsTotal(localStorage.getItem(VIEW_EDIT_INSTALLMENTS_TOTAL_KEY) || '');
          setModalEditInstallmentsCurrent(localStorage.getItem(VIEW_EDIT_INSTALLMENTS_CURRENT_KEY) || '');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (selectedViewCategory) {
      localStorage.setItem(VIEW_CAT_KEY, selectedViewCategory.category);
      localStorage.setItem(VIEW_EDIT_MODE_KEY, isModalInEditMode.toString());
      if (isModalInEditMode) {
        localStorage.setItem(VIEW_EDIT_NAME_KEY, modalEditName);
        localStorage.setItem(VIEW_EDIT_LIMIT_KEY, modalEditLimit);
        localStorage.setItem(VIEW_EDIT_DUE_DATE_KEY, modalEditDueDate);
        localStorage.setItem(VIEW_EDIT_INSTALLMENT_ACTIVE_KEY, modalEditInstallmentActive.toString());
        localStorage.setItem(VIEW_EDIT_INSTALLMENTS_TOTAL_KEY, modalEditInstallmentsTotal);
        localStorage.setItem(VIEW_EDIT_INSTALLMENTS_CURRENT_KEY, modalEditInstallmentsCurrent);
      }
    } else {
      [VIEW_CAT_KEY, VIEW_EDIT_MODE_KEY, VIEW_EDIT_NAME_KEY, VIEW_EDIT_LIMIT_KEY, VIEW_EDIT_DUE_DATE_KEY, VIEW_EDIT_INSTALLMENT_ACTIVE_KEY, VIEW_EDIT_INSTALLMENTS_TOTAL_KEY, VIEW_EDIT_INSTALLMENTS_CURRENT_KEY].forEach(k => localStorage.removeItem(k));
    }
  }, [selectedViewCategory, isModalInEditMode, modalEditName, modalEditLimit, modalEditDueDate, modalEditInstallmentActive, modalEditInstallmentsTotal, modalEditInstallmentsCurrent]);

  useEffect(() => {
    const draft = { name: newCategoryName, limit: newCategoryLimit, dueDate: newCategoryDueDate, installmentActive: newCategoryInstallmentActive, installmentsTotal: newCategoryInstallmentsTotal, installmentsCurrent: newCategoryInstallmentsCurrent, iconKey: selectedIconKey, editing: editingBudget };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [newCategoryName, newCategoryLimit, newCategoryDueDate, newCategoryInstallmentActive, newCategoryInstallmentsTotal, newCategoryInstallmentsCurrent, selectedIconKey, editingBudget]);

  useEffect(() => { localStorage.setItem(MODAL_OPEN_KEY, isCreateModalOpen.toString()); }, [isCreateModalOpen]);

  useEffect(() => {
    document.body.style.overflow = (isCreateModalOpen || iconPickerOpen || isInfoModalOpen || selectedViewCategory) ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCreateModalOpen, iconPickerOpen, isInfoModalOpen, selectedViewCategory]);

  const syncToParent = (updatedBudgets: CategoryBudget[]) => {
    setLocalBudgets(updatedBudgets);
    onSave(updatedBudgets);
  };

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setNewCategoryName('');
    setNewCategoryLimit('');
    setNewCategoryDueDate('');
    setNewCategoryInstallmentActive(false);
    setNewCategoryInstallmentsTotal('');
    setNewCategoryInstallmentsCurrent('');
    setSelectedIconKey('more');
    setIsCreateModalOpen(true);
  };

  const handleAddOrUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const limit = parseFloat(newCategoryLimit) || 0;
    const installmentsTotal = parseInt(newCategoryInstallmentsTotal) || undefined;
    const installmentsCurrent = parseInt(newCategoryInstallmentsCurrent) || undefined;
    const now = new Date().toISOString();
    let updated: CategoryBudget[];
    if (editingBudget) {
      updated = localBudgets.map(b => b.category === editingBudget.category ? { ...b, category: newCategoryName.trim(), limit, iconKey: selectedIconKey, dueDate: newCategoryDueDate || undefined, installmentActive: newCategoryInstallmentActive, installmentsTotal, installmentsCurrent, createdAt: now } : b);
    } else {
      if (localBudgets.some(b => b.category.toLowerCase() === newCategoryName.toLowerCase())) { alert("Esta categoria já existe!"); return; }
      updated = [...localBudgets, { category: newCategoryName.trim(), limit: limit, iconKey: selectedIconKey, dueDate: newCategoryDueDate || undefined, installmentActive: newCategoryInstallmentActive, installmentsTotal, installmentsCurrent, createdAt: now }];
    }
    syncToParent(updated);
    setIsCreateModalOpen(false);
  };

  const handleCardClick = (budget: CategoryBudget) => {
    if (isPending(budget)) {
      setModalEditName(budget.category);
      setModalEditLimit(budget.limit.toString());
      setModalEditDueDate(budget.dueDate || '');
      setModalEditInstallmentActive(budget.installmentActive || false);
      setModalEditInstallmentsTotal(budget.installmentsTotal?.toString() || '');
      setModalEditInstallmentsCurrent(budget.installmentsCurrent?.toString() || '');
      setIsModalInEditMode(true);
      setSelectedViewCategory(budget);
    } else {
      setSelectedViewCategory(budget);
      setIsModalInEditMode(false);
    }
  };

  const startModalEditing = () => {
    if (selectedViewCategory) {
      setModalEditName(selectedViewCategory.category);
      setModalEditLimit(selectedViewCategory.limit.toString());
      setModalEditDueDate(selectedViewCategory.dueDate || '');
      setModalEditInstallmentActive(selectedViewCategory.installmentActive || false);
      setModalEditInstallmentsTotal(selectedViewCategory.installmentsTotal?.toString() || '');
      setModalEditInstallmentsCurrent(selectedViewCategory.installmentsCurrent?.toString() || '');
      setIsModalInEditMode(true);
    }
  };

  const handleSaveModalEdit = () => {
    if (!selectedViewCategory || !modalEditName.trim()) return;
    const newLimit = parseFloat(modalEditLimit) || 0;
    const installmentsTotal = parseInt(modalEditInstallmentsTotal) || undefined;
    const installmentsCurrent = parseInt(modalEditInstallmentsCurrent) || undefined;
    const now = new Date().toISOString();
    const updated = localBudgets.map(b => b.category === selectedViewCategory.category ? { ...b, category: modalEditName.trim(), limit: newLimit, dueDate: modalEditDueDate || undefined, installmentActive: modalEditInstallmentActive, installmentsTotal, installmentsCurrent, createdAt: now } : b);
    syncToParent(updated);
    setSelectedViewCategory(null);
  };

  const handleDeleteBudget = () => {
    if (!selectedViewCategory) return;
    if (window.confirm(`Excluir "${selectedViewCategory.category}"?`)) {
      const updated = localBudgets.filter(b => b.category !== selectedViewCategory.category);
      syncToParent(updated);
      setSelectedViewCategory(null);
    }
  };

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';
  const formatValue = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  const formatProgressValue = (val: number) => val % 1 === 0 ? val.toFixed(0) : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-10 relative">
      {selectedViewCategory && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedViewCategory(null)} />
          <div className="relative w-full max-w-sm glass border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">{getCategoryIcon(selectedViewCategory.iconKey, "w-6 h-6")}</div>
                 {isModalInEditMode ? (
                   <input type="text" value={modalEditName} onChange={(e) => setModalEditName(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white font-black text-sm uppercase focus:outline-none focus:border-blue-500/50" />
                 ) : (
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">{selectedViewCategory.category}</h3>
                 )}
              </div>
              <button onClick={() => setSelectedViewCategory(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{isModalInEditMode ? 'Definir Limite' : 'Orçamento Definido'}</span>
                {isModalInEditMode ? (
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-black text-lg">{currencySymbol}</span>
                    <input type="number" step="0.01" value={modalEditLimit} onChange={(e) => setModalEditLimit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white font-black text-xl focus:outline-none focus:border-blue-500/50" />
                  </div>
                ) : (
                  <p className="text-2xl font-black text-white"><span className="text-blue-500 mr-2">{currencySymbol}</span>{formatValue(selectedViewCategory.limit)}</p>
                )}
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Data de Vencimento</span>
                {isModalInEditMode ? (
                   <div className="relative mt-2">
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"><Calendar className="w-4 h-4" /></div>
                     <input type="date" value={modalEditDueDate} onChange={(e) => setModalEditDueDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white font-black text-sm focus:outline-none focus:border-blue-500/50" />
                   </div>
                ) : (
                  <p className="text-sm font-bold text-slate-300">{selectedViewCategory.dueDate ? new Date(selectedViewCategory.dueDate).toLocaleDateString('pt-BR') : 'Nenhuma data'}</p>
                )}
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {isModalInEditMode ? (
                <>
                  <button onClick={handleSaveModalEdit} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Confirmar</button>
                  <button onClick={handleDeleteBudget} className="w-full bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-black py-4 rounded-2xl transition-all border border-rose-500/10 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Excluir</button>
                </>
              ) : (
                <button onClick={startModalEditing} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><Edit2 className="w-4 h-4 text-blue-400" /> Editar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsInfoModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0a0f18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Legenda de Cores</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4"><div className="w-8 h-1 bg-blue-500 rounded-full mt-2.5 shrink-0" /><p className="text-sm text-slate-300"><span className="font-bold text-white">Azul:</span> Dentro do planejado.</p></div>
              <div className="flex items-start gap-4"><div className="w-8 h-1 bg-emerald-500 rounded-full mt-2.5 shrink-0" /><p className="text-sm text-slate-300"><span className="font-bold text-white">Verde:</span> Atingiu 100%.</p></div>
              <div className="flex items-start gap-4"><div className="w-8 h-1 bg-rose-500 rounded-full mt-2.5 shrink-0" /><p className="text-sm text-slate-300"><span className="font-bold text-white">Vermelho:</span> Ultrapassou limite.</p></div>
            </div>
            <button onClick={() => setIsInfoModalOpen(false)} className="w-full mt-8 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-[10px]">Entendi</button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl"><Wallet className="w-8 h-8 text-blue-500" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Orçamento</h1>
              <button onClick={() => setIsInfoModalOpen(true)} className="p-1.5 hover:bg-white/5 rounded-full text-slate-500 hover:text-blue-400 transition-all"><Info className="w-4 h-4" /></button>
            </div>
            <p className="text-slate-400 text-sm">Gerencie categorias e defina limites mensais.</p>
          </div>
        </div>

        {/* Cabeçalho de Ações: Lado a Lado (Com recuo horizontal para alinhar com a grade abaixo) */}
        <div className="px-4 md:px-8">
          <div className="grid grid-cols-2 gap-2.5 items-stretch max-w-[420px]">
            <div className="bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-2xl flex flex-col justify-center min-h-[48px]">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Total Confirmado</span>
              <p className="text-base sm:text-lg font-black text-white truncate">
                <span className="text-blue-500 mr-1">{currencySymbol}</span>
                {formatValue(totalBudgetAmount)}
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-[8px] sm:text-[9px] active:scale-95 min-h-[48px]"
            >
              <Plus className="w-3 h-3 sm:w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Criar Categoria</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="glass p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
          
          {/* Aviso de Categorias Pendentes - Refinado: Alinhado e com quebra de linha */}
          {hasPendingBudgets && (
            <div className="mb-6 flex items-start gap-2.5 text-amber-500 animate-in fade-in slide-in-from-top-2 duration-500">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex flex-col leading-tight sm:leading-relaxed">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                  Algumas categorias precisam ser confirmadas.
                </span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-80">
                  Edite ou exclua.
                </span>
              </div>
            </div>
          )}

          {sortedBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <div className="p-6 bg-slate-900/50 rounded-3xl mb-4"><LayoutGrid className="w-12 h-12 text-slate-800" /></div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">Sem categorias</h3>
              <p className="text-slate-600 max-w-xs text-sm">Adicione uma clicando em "Criar Categoria".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedBudgets.map((budget) => {
                const spent = transactions.filter(t => t.category === budget.category).reduce((acc, curr) => acc + curr.amount, 0);
                const percentage = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
                const isItemPending = isPending(budget);
                return (
                  <div key={budget.category} onClick={() => handleCardClick(budget)} className={`group relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all overflow-hidden cursor-pointer ${isItemPending ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}>
                    <div className={`p-2 bg-slate-900/40 rounded-lg shrink-0 ${isItemPending ? 'text-amber-500/70' : 'text-blue-500/70'}`}>{getCategoryIcon(budget.iconKey, "w-4 h-4 sm:w-5 sm:h-5")}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block truncate leading-none mb-1">{budget.category}</span>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center text-xs sm:text-sm font-bold text-slate-300"><span className="text-blue-500/30 mr-1 text-[10px]">{currencySymbol}</span>{formatValue(budget.limit)}</div>
                        {isItemPending && <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />}
                      </div>
                    </div>
                    {!isItemPending && spent > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5"><div className={`h-full transition-all duration-1000 ${budget.limit === 0 || spent > budget.limit ? 'bg-rose-500' : spent === budget.limit ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }} /></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-xl glass border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Criar Categoria</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddOrUpdateCategory} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Nome</label>
                <input type="text" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" placeholder="Ex: Mercado" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Limite</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black">{currencySymbol}</span><input type="number" step="0.01" required value={newCategoryLimit} onChange={e => setNewCategoryLimit(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-black text-xl focus:outline-none focus:border-blue-500/50 transition-all" placeholder="0,00" /></div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/30 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3"><CheckCircle2 className="w-5 h-5" /> Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
