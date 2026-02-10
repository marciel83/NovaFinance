
import React from 'react';
import { TrendingDown } from 'lucide-react';
import { Transaction, CategoryBudget, CurrencyCode } from '../types';
import RecentTransactions from './RecentTransactions';
import ExpenseForm from './ExpenseForm';

interface TransactionsPageProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updated: Partial<Transaction>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'authorName'>) => void;
  onBack: () => void;
  currency: CurrencyCode;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ 
  transactions, 
  budgets, 
  onRemove, 
  onUpdate,
  onAddTransaction,
  onBack,
  currency
}) => {
  const categories = budgets.map(b => b.category);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <TrendingDown className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Despesa</h1>
            <p className="text-slate-400 text-sm">Gerencie todas as saídas de dinheiro.</p>
          </div>
        </div>

        <ExpenseForm onAddTransaction={onAddTransaction} categories={categories} currency={currency} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <RecentTransactions 
          transactions={transactions} 
          budgets={budgets} 
          onRemove={onRemove} 
          onUpdate={onUpdate}
          currency={currency}
        />
      </div>
    </div>
  );
};

export default TransactionsPage;
