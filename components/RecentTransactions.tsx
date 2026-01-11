
import React from 'react';
import { getCategoryIcon } from '../constants';
import { Transaction, CategoryBudget, CurrencyCode } from '../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onRemove: (id: string) => void;
  currency: CurrencyCode;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, budgets, onRemove, currency }) => {
  const formatCurrency = (val: number) => {
    const locales: Record<CurrencyCode, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'de-DE' };
    return new Intl.NumberFormat(locales[currency], { style: 'currency', currency: currency }).format(val);
  };

  const getIconForCategory = (categoryName: string) => {
    const budget = budgets.find(b => b.category === categoryName);
    return getCategoryIcon(budget?.iconKey || 'more');
  };

  return (
    <div className="glass p-6 rounded-3xl h-full">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-rose-500 rounded-full inline-block"></span>
        Transações Recentes
      </h3>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Nenhuma transação registrada.
          </div>
        )}
        {[...transactions].reverse().map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-500/10 transition-colors shrink-0">
                {getIconForCategory(t.category)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white capitalize truncate">
                  {t.description ? t.description : t.category}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="text-blue-400 font-bold whitespace-nowrap">{t.authorName}</span>
                  {t.description && (
                    <>
                      <span>•</span>
                      <span className="capitalize truncate">{t.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className="text-right flex flex-col items-end">
                <span className="font-bold text-white whitespace-nowrap">{formatCurrency(t.amount)}</span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button 
                onClick={() => onRemove(t.id)}
                className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-600 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
