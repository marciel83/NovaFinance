
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, Calculator, Calendar as CalendarIcon, Tag, CheckCircle2, Search, Layers, ChevronDown } from 'lucide-react';
import { CategoryType, Transaction, CurrencyCode } from '../types';

interface ExpenseFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'authorName'>) => void;
  categories: CategoryType[];
  currency: CurrencyCode;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddTransaction, categories, currency }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortedAllCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) {
      return sortedAllCategories.slice(0, 3);
    }
    return sortedAllCategories.filter(cat => 
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedAllCategories, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || !category) return;

    onAddTransaction({
      description: description.trim(),
      amount: finalAmount,
      category,
      date
    });

    setDescription('');
    setAmount('');
    setSearchQuery('');
    setCategory('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-rose-500/20 font-black uppercase tracking-widest text-xs active:scale-95 whitespace-nowrap"
      >
        <Plus className="w-5 h-5" />
        Registrar Despesa
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-2xl"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-xl glass border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nova Despesa</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <label className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">1. Escolha a Categoria</label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 z-20 pointer-events-none">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="filtrar categorias salvas"
                    value={isDropdownOpen ? searchQuery : (category || '')}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700 relative z-10 capitalize"
                  />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 z-20 p-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 p-3 bg-[#0a0f18] border border-white/10 rounded-3xl shadow-[0_30px_70px_-10px_rgba(0,0,0,1)] z-[50] animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => {
                            const isSelected = category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleSelectCategory(cat)}
                                className={`w-full flex items-center justify-center py-4 px-6 rounded-xl border transition-all duration-300 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs ${
                                  isSelected 
                                    ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                                }`}
                              >
                                <span className="capitalize">{cat}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center">
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-0.4em">Nenhuma categoria encontrada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em] ml-1">2. Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-black">{currencySymbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-black text-xl focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em] ml-1">3. O que foi comprado?</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <Tag className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Supermercado ou Lanche (Opcional)"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em] ml-1">4. Data</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-rose-900/30 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseForm;
