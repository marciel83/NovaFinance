
import React from 'react';
import { SUMMARY_ICONS } from '../constants';
import { CurrencyCode } from '../types';

interface HistorySummary {
  budgeted: number;
  income: number;
  spent: number;
  balance: number;
}

interface DashboardCardsProps {
  budgeted: number;
  income: number;
  spent: number;
  difference: number;
  currency: CurrencyCode;
  lastClosureDate?: string;
  lastCycleDate?: string;
  historySummary?: HistorySummary;
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
  lastClosureDate,
  lastCycleDate,
  historySummary,
  onBudgetClick, 
  onIncomeClick,
  onSpentClick 
}) => {
  const formatCurrency = (val: number) => {
    const locales: Record<CurrencyCode, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'de-DE' };
    return new Intl.NumberFormat(locales[currency], { style: 'currency', currency: currency }).format(val);
  };

  const formatCycleDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    // Utiliza a data lógica do ciclo para exibir no chip, garantindo a sequência correta
    const date = new Date(dateStr);
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Orçamento */}
        <button 
          onClick={onBudgetClick}
          className="glass p-5 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/5 hover:border-blue-500/50 text-left group active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
            {SUMMARY_ICONS.budgeted}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orçamento</span>
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
              Detalhes
            </span>
          </div>
        </button>

        {/* Card Saldo */}
        <div className="glass p-5 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.02] cursor-default border-emerald-500/10">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            {SUMMARY_ICONS.difference}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Atual</span>
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

      {/* Seção de Histórico */}
      <div className="mt-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2 h-8 bg-slate-800 rounded-full inline-block"></span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              HISTÓRICO
            </h2>
            <div className="ml-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {formatCycleDisplay(lastCycleDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Estrutura visual do resumo com valores reais */}
        <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">Orçado</span>
              {historySummary ? (
                <p className="text-sm font-bold text-slate-300">{formatCurrency(historySummary.budgeted)}</p>
              ) : (
                <div className="h-6 w-20 bg-white/5 rounded-lg animate-pulse"></div>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">Receita</span>
              {historySummary ? (
                <p className="text-sm font-bold text-slate-300">{formatCurrency(historySummary.income)}</p>
              ) : (
                <div className="h-6 w-24 bg-white/5 rounded-lg animate-pulse"></div>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">Despesa</span>
              {historySummary ? (
                <p className="text-sm font-bold text-rose-500/70">{formatCurrency(historySummary.spent)}</p>
              ) : (
                <div className="h-6 w-20 bg-white/5 rounded-lg animate-pulse"></div>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">Saldo</span>
              {historySummary ? (
                <p className={`text-sm font-black ${historySummary.balance < 0 ? 'text-rose-400' : 'text-emerald-400/80'}`}>
                  {formatCurrency(historySummary.balance)}
                </p>
              ) : (
                <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
