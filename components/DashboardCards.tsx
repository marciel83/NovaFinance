
import React from 'react';
import { SUMMARY_ICONS } from '../constants';
import { CurrencyCode } from '../types';

interface DashboardCardsProps {
  budgeted: number;
  income: number;
  spent: number;
  difference: number;
  currency: CurrencyCode;
  onBudgetClick: () => void;
  onIncomeClick: () => void;
  onSpentClick: () => void;
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ 
  budgeted, 
  income,
  spent, 
  difference,
  currency,
  onBudgetClick, 
  onIncomeClick,
  onSpentClick 
}) => {
  const formatCurrency = (val: number) => {
    const locales: Record<CurrencyCode, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'de-DE' };
    return new Intl.NumberFormat(locales[currency], { style: 'currency', currency: currency }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {/* Card Orçado */}
      <button 
        onClick={onBudgetClick}
        className="glass p-5 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/5 hover:border-blue-500/50 text-left group active:scale-[0.98]"
      >
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
          {SUMMARY_ICONS.budgeted}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orçado</span>
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              {SUMMARY_ICONS.budgeted}
            </div>
            <h2 className="text-xl font-bold text-white">{formatCurrency(budgeted)}</h2>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
           <div className="w-full h-1 bg-blue-500/10 rounded-full overflow-hidden mr-2">
            <div className="h-full bg-blue-500 w-full animate-pulse"></div>
          </div>
          <span className="text-[8px] font-black text-blue-400 uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Ajustar
          </span>
        </div>
      </button>

      {/* Card Receita */}
      <button 
        onClick={onIncomeClick}
        className="glass p-5 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/5 hover:border-cyan-500/50 text-left group active:scale-[0.98]"
      >
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
          {SUMMARY_ICONS.income}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receita</span>
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
              {SUMMARY_ICONS.income}
            </div>
            <h2 className="text-xl font-bold text-white">{formatCurrency(income)}</h2>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
           <div className="w-full h-1 bg-cyan-500/10 rounded-full overflow-hidden mr-2">
            <div className="h-full bg-cyan-500 w-full animate-pulse"></div>
          </div>
          <span className="text-[8px] font-black text-cyan-400 uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Entradas
          </span>
        </div>
      </button>

      {/* Card Despesa */}
      <button 
        onClick={onSpentClick}
        className="glass p-5 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/5 hover:border-rose-500/50 text-left group active:scale-[0.98]"
      >
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
          {SUMMARY_ICONS.spent}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Despesa</span>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
              {SUMMARY_ICONS.spent}
            </div>
            <h2 className="text-xl font-bold text-white">{formatCurrency(spent)}</h2>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="w-full h-1 bg-rose-500/10 rounded-full overflow-hidden mr-2">
            <div 
              className="h-full bg-rose-500 transition-all duration-1000" 
              style={{ width: `${Math.min((spent / (income || budgeted || 1)) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-[8px] font-black text-rose-400 uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Histórico
          </span>
        </div>
      </button>

      {/* Card Saldo */}
      <div className="glass p-5 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.02] cursor-default border-emerald-500/10">
        <div className="absolute top-0 right-0 p-3 opacity-20">
          {SUMMARY_ICONS.difference}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo</span>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-xl">
              {SUMMARY_ICONS.difference}
            </div>
            <h2 className={`text-xl font-bold ${difference < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(difference)}
            </h2>
          </div>
        </div>
        <div className="mt-3 w-full h-1 bg-emerald-500/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${difference < 0 ? 'bg-rose-400' : 'bg-emerald-400'} transition-all duration-1000`}
            style={{ width: '100%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
