
import React, { useState } from 'react';
import { ArrowLeft, Banknote, Plus, X, CheckCircle2, Trash2 } from 'lucide-react';
import { Income, CurrencyCode } from '../types';

interface IncomePageProps {
  incomes: Income[];
  userName: string;
  onAddIncome: (income: Omit<Income, 'id'>) => void;
  onRemoveIncome: (id: string) => void;
  onBack: () => void;
  currency: CurrencyCode;
}

const IncomePage: React.FC<IncomePageProps> = ({ incomes, userName, onAddIncome, onRemoveIncome, onBack, currency }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount)) return;

    onAddIncome({
      description: source.trim(),
      amount: finalAmount,
      source: source.trim(),
      authorName: userName,
      date
    });

    setAmount('');
    setSource('');
    setIsFormOpen(false);
  };

  const formatCurrency = (val: number) => {
    const locales: Record<CurrencyCode, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'de-DE' };
    return new Intl.NumberFormat(locales[currency], { style: 'currency', currency: currency }).format(val);
  };

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-10">
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
            <div className="p-3 bg-cyan-500/10 rounded-2xl">
              <Banknote className="w-8 h-8 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Receitas da Família</h1>
              <p className="text-slate-400 text-sm">Gerencie todas as entradas de dinheiro.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 font-black uppercase tracking-widest text-xs active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Registrar Receita
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-2xl" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-xl glass border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nova Receita</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 font-black">{currencySymbol}</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-black text-xl focus:outline-none focus:border-cyan-500/50 transition-all" 
                    placeholder="0,00" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Fonte (Ex: Salário, Freelance) - Opcional</label>
                <input 
                  type="text" 
                  value={source} 
                  onChange={e => setSource(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium" 
                  placeholder="Salário Mensal" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium" />
              </div>

              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-cyan-900/30 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5" /> Salvar Receita
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <div className="glass p-6 rounded-3xl h-full">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-cyan-500 rounded-full inline-block"></span>
            Transações Recentes
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {incomes.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Nenhuma transação registrada.
              </div>
            ) : (
              [...incomes].reverse().map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-cyan-500/10 transition-colors shrink-0">
                      <Banknote className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white capitalize truncate">
                        {inc.source ? inc.source : inc.authorName}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="text-cyan-400 font-bold whitespace-nowrap">{inc.authorName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-white whitespace-nowrap">{formatCurrency(inc.amount)}</span>
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        {new Date(inc.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button 
                      onClick={() => onRemoveIncome(inc.id)} 
                      className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-600 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomePage;
