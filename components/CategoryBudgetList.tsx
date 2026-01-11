
import React from 'react';
import { getCategoryIcon } from '../constants';
import { CategoryBudget, Transaction } from '../types';

interface CategoryBudgetListProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
}

const CategoryBudgetList: React.FC<CategoryBudgetListProps> = ({ budgets, transactions }) => {
  const getSpentByCategory = (category: string) => {
    return transactions
      .filter((t) => t.category === category)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="glass p-6 rounded-3xl h-full">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>
        Orçamento por Categoria
      </h3>
      <div className="space-y-6">
        {budgets.length === 0 ? (
          <p className="text-slate-500 text-center py-4 italic">Nenhuma categoria ativa.</p>
        ) : (
          budgets.map((budget) => {
            const spent = getSpentByCategory(budget.category);
            const percentage = Math.min((spent / (budget.limit || 1)) * 100, 100);
            const remaining = budget.limit - spent;

            return (
              <div key={budget.category} className="group">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      {getCategoryIcon(budget.iconKey)}
                    </div>
                    <span className="font-semibold text-slate-200 capitalize">{budget.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white block">
                      {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                    </span>
                    <span className={`text-xs ${remaining < 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                      {remaining < 0 ? 'Excedido: ' : 'Restante: '} {formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      percentage >= 100 ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategoryBudgetList;
