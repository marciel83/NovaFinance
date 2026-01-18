
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getCategoryIcon } from '../constants';
import { Transaction, CategoryBudget, CurrencyCode } from '../types';
import { Edit2, Trash2, X, CheckCircle2, User, Calendar as CalendarIcon, FileText, DollarSign } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updated: Partial<Transaction>) => void;
  currency: CurrencyCode;
}

const STORAGE_KEYS = {
  SELECTED_ID: 'novafinance_selected_tx_id',
  IS_EDITING: 'novafinance_is_editing_tx',
  DRAFT: 'novafinance_draft_edit_tx'
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, budgets, onRemove, onUpdate, currency }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.SELECTED_ID);
    const savedIsEditing = localStorage.getItem(STORAGE_KEYS.IS_EDITING) === 'true';
    const savedDraft = localStorage.getItem(STORAGE_KEYS.DRAFT);

    if (savedId && transactions.length > 0) {
      const found = transactions.find(t => t.id === savedId);
      if (found) {
        setSelectedTransaction(found);
        setIsEditing(savedIsEditing);
        
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setEditAmount(draft.amount || '');
            setEditDescription(draft.description || '');
            setEditDate(draft.date || '');
          } catch (e) {
            console.error("Erro ao ler rascunho de edição", e);
          }
        }
      }
    }
  }, [transactions]);

  useEffect(() => {
    if (selectedTransaction) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ID, selectedTransaction.id);
      localStorage.setItem(STORAGE_KEYS.IS_EDITING, isEditing.toString());
      localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify({
        amount: editAmount,
        description: editDescription,
        date: editDate
      }));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ID);
      localStorage.removeItem(STORAGE_KEYS.IS_EDITING);
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    }
  }, [selectedTransaction, isEditing, editAmount, editDescription, editDate]);

  const formatCurrency = (val: number) => {
    const locales: Record<CurrencyCode, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'de-DE' };
    return new Intl.NumberFormat(locales[currency], { style: 'currency', currency: currency }).format(val);
  };

  const getIconForCategory = (categoryName: string) => {
    const budget = budgets.find(b => b.category === categoryName);
    return getCategoryIcon(budget?.iconKey || 'more', "w-5 h-5");
  };

  const handleDelete = () => {
    if (selectedTransaction && window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      onRemove(selectedTransaction.id);
      closeModal();
    }
  };

  const startEditing = () => {
    if (selectedTransaction) {
      setEditAmount(selectedTransaction.amount.toString());
      setEditDescription(selectedTransaction.description || '');
      setEditDate(selectedTransaction.date);
      setIsEditing(true);
    }
  };

  const closeModal = () => {
    setSelectedTransaction(null);
    setIsEditing(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum)) return;

    onUpdate(selectedTransaction.id, {
      amount: amountNum,
      description: editDescription.trim(),
      date: editDate
    });

    closeModal();
  };

  const formatShortDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const currentMonthYear = useMemo(() => {
    const d = new Date();
    const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';

  return (
    <div className="glass px-3 py-6 rounded-3xl h-full relative">
      <h3 className="text-xl font-bold text-white mb-6 px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-8 bg-rose-500 rounded-full inline-block"></span>
          Transações Recentes
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm whitespace-nowrap">
          {currentMonthYear}
        </div>
      </h3>
      
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {transactions.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Nenhuma transação registrada.
          </div>
        )}
        {[...transactions].reverse().map((t) => (
          <button 
            key={t.id} 
            onClick={() => setSelectedTransaction(t)}
            className="w-full flex items-center justify-between px-3 py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group relative border border-transparent hover:border-white/10 active:scale-[0.99] text-left outline-none"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
              <div className="p-2.5 bg-slate-800 rounded-xl shrink-0">
                <div className="text-white">
                  {getIconForCategory(t.category)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white capitalize leading-tight text-base sm:text-lg truncate">
                  {t.category}
                </p>
                <p className="text-[10px] text-blue-400 font-bold whitespace-nowrap mt-0.5">
                  {formatShortDate(t.date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center shrink-0 pl-3 pointer-events-none">
              <div className="text-right flex flex-col items-end">
                <span className="font-bold text-white whitespace-nowrap text-base sm:text-lg">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedTransaction && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          
          <div className="relative w-full max-w-sm glass border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header do Modal */}
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {isEditing ? 'Editar Despesa' : 'Opções de Registro'}
              </h4>
              <button onClick={closeModal} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Título da Categoria no Topo */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                {selectedTransaction.category}
              </h2>
            </div>

            {/* Conteúdo: Info ou Form */}
            <div className="space-y-4 mb-8">
              {!isEditing ? (
                /* MODO VISUALIZAÇÃO */
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Valor</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Descrição</p>
                      <p className="text-sm font-medium text-slate-300 truncate">
                        {selectedTransaction.description || 'Sem descrição'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <CalendarIcon className="w-4 h-4 text-rose-400" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Data</p>
                      <p className="text-sm font-bold text-white">{new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <User className="w-4 h-4 text-indigo-400" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Autor</p>
                      <p className="text-sm font-bold text-white uppercase tracking-tighter">{selectedTransaction.authorName}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODO EDIÇÃO */
                <form id="edit-tx-form" onSubmit={handleUpdateSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-slate-500 font-black tracking-widest ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-black text-xs">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-8 pr-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-slate-500 font-black tracking-widest ml-1">Descrição</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descrição"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-slate-500 font-black tracking-widest ml-1">Data</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 opacity-60">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <div className="min-w-0">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Autor</p>
                        <p className="text-xs font-bold text-white">{selectedTransaction.authorName}</p>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Rodapé: Botões de Ação */}
            {!isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={startEditing}
                  className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/5 active:scale-95"
                >
                  <Edit2 className="w-4 h-4 text-blue-400" />
                  Editar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold text-xs transition-all border border-rose-500/10 active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Excluir
                </button>
              </div>
            ) : (
              <button
                form="edit-tx-form"
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Salvar Alterações
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RecentTransactions;
