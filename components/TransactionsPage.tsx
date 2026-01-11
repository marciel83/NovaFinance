
import React from 'react';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import { Transaction, CategoryBudget, CurrencyCode } from '../types';
import RecentTransactions from './RecentTransactions';
import ExpenseForm from './ExpenseForm';

interface TransactionsPageProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onRemove: (id: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'authorName'>) => void;
  onBack: () => void;
  currency: CurrencyCode;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ 
  transactions, 
  budgets, 
  onRemove, 
  onAddTransaction,
  onBack,
  currency
}) => {
  const categories = budgets.map(b => b.category);

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
            <div className="p-3 bg-rose-500/10 rounded-2xl">
              <TrendingDown className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Despesas da Família</h1>
              <p className="text-slate-400 text-sm">Gerencie todas as saídas de dinheiro.</p>
            </div>
          </div>
        </div>

        <ExpenseForm onAddTransaction={onAddTransaction} categories={categories} currency={currency} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <RecentTransactions 
          transactions={transactions} 
          budgets={budgets} 
          onRemove={onRemove} 
          currency={currency}
        />
      </div>
    </div>
  );
};

export default TransactionsPage;
