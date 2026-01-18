
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Wallet, Plus, Trash2, LayoutGrid, X, CheckCircle2, MoreVertical, Edit2 } from 'lucide-react';
import { getCategoryIcon, ICON_LIBRARY } from '../constants';
import { CategoryBudget, CategoryType, CurrencyCode } from '../types';

interface BudgetPageProps {
  initialBudgets: CategoryBudget[];
  onSave: (budgets: CategoryBudget[]) => void;
  onBack: () => void;
  currency: CurrencyCode;
}

const MODAL_OPEN_KEY = 'novafinance_modal_budget';
const DRAFT_KEY = 'novafinance_draft_budget';

const BudgetPage: React.FC<BudgetPageProps> = ({ initialBudgets, onSave, onBack, currency }) => {
  const [localBudgets, setLocalBudgets] = useState<CategoryBudget[]>(initialBudgets);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');
  const [selectedIconKey, setSelectedIconKey] = useState('more');
  
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const sortedBudgets = useMemo(() => {
    return [...localBudgets].sort((a, b) => 
      a.category.localeCompare(b.category, 'pt-BR', { sensitivity: 'base' })
    );
  }, [localBudgets]);

  useEffect(() => {
    const savedModalState = localStorage.getItem(MODAL_OPEN_KEY);
    if (savedModalState === 'true') {
      setIsCreateModalOpen(true);
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setNewCategoryName(parsed.name || '');
        setNewCategoryLimit(parsed.limit || '');
        setSelectedIconKey(parsed.iconKey || 'more');
        if (parsed.editing) {
          setEditingBudget(parsed.editing);
        }
      } catch (e) {
        console.error("Erro ao carregar rascunho de orçamento", e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = { 
      name: newCategoryName, 
      limit: newCategoryLimit, 
      iconKey: selectedIconKey,
      editing: editingBudget 
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [newCategoryName, newCategoryLimit, selectedIconKey, editingBudget]);

  useEffect(() => {
    localStorage.setItem(MODAL_OPEN_KEY, isCreateModalOpen.toString());
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (isCreateModalOpen || iconPickerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCreateModalOpen, iconPickerOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const syncToParent = (updatedBudgets: CategoryBudget[]) => {
    setLocalBudgets(updatedBudgets);
    onSave(updatedBudgets);
  };

  const handleUpdateLimit = (category: CategoryType, limit: string) => {
    const value = parseFloat(limit) || 0;
    const updated = localBudgets.map(b => 
      b.category === category ? { ...b, limit: value } : b
    );
    syncToParent(updated);
  };

  const handleUpdateIcon = (iconKey: string) => {
    setSelectedIconKey(iconKey);
    setIconPickerOpen(false);
  };

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setNewCategoryName('');
    setNewCategoryLimit('');
    setSelectedIconKey('more');
    setIsCreateModalOpen(true);
  };

  const handleEditCategory = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    setNewCategoryName(budget.category);
    setNewCategoryLimit(budget.limit.toString());
    setSelectedIconKey(budget.iconKey);
    setIsCreateModalOpen(true);
    setActiveMenu(null);
  };

  const handleAddOrUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const limit = parseFloat(newCategoryLimit) || 0;
    let updated: CategoryBudget[];

    if (editingBudget) {
      updated = localBudgets.map(b => 
        b.category === editingBudget.category 
          ? { ...b, category: newCategoryName.trim(), limit, iconKey: selectedIconKey } 
          : b
      );
    } else {
      if (localBudgets.some(b => b.category.toLowerCase() === newCategoryName.toLowerCase())) {
        alert("Esta categoria já existe no seu orçamento!");
        return;
      }
      updated = [...localBudgets, { 
        category: newCategoryName.trim(), 
        limit: limit, 
        iconKey: selectedIconKey 
      }];
    }
    
    syncToParent(updated);
    localStorage.removeItem(MODAL_OPEN_KEY);
    localStorage.removeItem(DRAFT_KEY);
    setNewCategoryName('');
    setNewCategoryLimit('');
    setSelectedIconKey('more');
    setEditingBudget(null);
    setIsCreateModalOpen(false);
  };

  const handleRemoveCategory = (category: string) => {
    const updated = localBudgets.filter(b => b.category !== category);
    syncToParent(updated);
    setActiveMenu(null);
  };

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-10 relative">
      
      {iconPickerOpen && (
        <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center p-0 md:p-6 transition-all">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIconPickerOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-[#0a0f18] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 pb-12 md:pb-8 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Escolha um Ícone</h2>
                <p className="text-slate-400 text-sm">Personalize visualmente sua categoria</p>
              </div>
              <button onClick={() => setIconPickerOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
              {Object.keys(ICON_LIBRARY).map(key => (
                <button 
                  key={key} 
                  onClick={() => handleUpdateIcon(key)}
                  className={`relative p-5 rounded-2xl flex items-center justify-center transition-all group ${
                    selectedIconKey === key 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {getCategoryIcon(key, "w-8 h-8")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-2xl" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-xl glass border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                {editingBudget ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAddOrUpdateCategory} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest ml-1">Nome da Categoria</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIconPickerOpen(true)}
                    className="w-16 h-14 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0 group"
                    title="Escolher Ícone"
                  >
                    <div className="group-hover:scale-110 transition-transform">
                      {getCategoryIcon(selectedIconKey, "w-6 h-6 text-blue-500")}
                    </div>
                  </button>
                  <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    required
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-700" 
                    placeholder="Ex: Lazer, Saúde..." 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest ml-1">Valor do Orçamento</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black">{currencySymbol}</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newCategoryLimit} 
                    onChange={e => setNewCategoryLimit(e.target.value)} 
                    required 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-black text-xl focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700" 
                    placeholder="0,00" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/30 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98] mt-4">
                <CheckCircle2 className="w-5 h-5" /> {editingBudget ? 'Atualizar Categoria' : 'Salvar Categoria'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group self-start"
          >
            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold uppercase tracking-widest text-xs">Voltar ao Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Orçamento da família</h1>
              <p className="text-slate-400 text-sm">Gerencie categorias e defina limites mensais.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Criar Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="glass p-3 md:p-6 rounded-[2rem]">
          {sortedBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <div className="p-6 bg-slate-900/50 rounded-3xl mb-4">
                <LayoutGrid className="w-12 h-12 text-slate-800" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhuma categoria configurada</h3>
              <p className="text-slate-600 max-w-xs text-sm">Comece adicionando categorias clicando em "Criar Categoria" acima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedBudgets.map((budget) => (
                <div key={budget.category} className="w-full flex items-center justify-between px-3 py-4 bg-white/5 rounded-2xl border border-transparent hover:bg-white/10 hover:border-white/10 transition-all group relative active:scale-[0.99] text-left">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-blue-500/10 transition-colors shrink-0">
                      <div className="text-blue-500">{getCategoryIcon(budget.iconKey, "w-5 h-5")}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white capitalize leading-tight text-sm sm:text-base truncate">
                        {budget.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 pl-3">
                    <div className="text-right flex flex-col items-end mr-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-blue-500 font-black text-[10px]">{currencySymbol}</span>
                        <input 
                          type="number" 
                          value={budget.limit === 0 ? '' : budget.limit} 
                          onChange={(e) => handleUpdateLimit(budget.category, e.target.value)} 
                          className="bg-slate-900/50 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm sm:text-base w-24 sm:w-28 text-right focus:outline-none focus:border-blue-500 transition-colors" 
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div className="relative" ref={activeMenu === budget.category ? menuRef : null}>
                      <button 
                        onClick={() => setActiveMenu(activeMenu === budget.category ? null : budget.category)}
                        className={`p-2 rounded-xl transition-all ${activeMenu === budget.category ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeMenu === budget.category && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0f18] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <button 
                            onClick={() => handleEditCategory(budget)}
                            className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                            EDITAR
                          </button>
                          <button 
                            onClick={() => handleRemoveCategory(budget.category)}
                            className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            APAGAR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
