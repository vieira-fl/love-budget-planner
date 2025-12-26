import { useState, useMemo } from 'react';
import { Transaction, ExpenseCategory, CategoryAnalysis, categoryThresholds, expenseCategoryLabels } from '@/types/finance';

const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 1',
    amount: 5000,
    person: 'pessoa1',
    date: new Date(2024, 11, 5),
  },
  {
    id: '2',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 2',
    amount: 4500,
    person: 'pessoa2',
    date: new Date(2024, 11, 5),
  },
  {
    id: '3',
    type: 'expense',
    category: 'moradia',
    description: 'Aluguel',
    amount: 2500,
    person: 'pessoa1',
    date: new Date(2024, 11, 10),
  },
  {
    id: '4',
    type: 'expense',
    category: 'alimentacao',
    description: 'Supermercado',
    amount: 1200,
    person: 'pessoa2',
    date: new Date(2024, 11, 15),
  },
  {
    id: '5',
    type: 'expense',
    category: 'streaming',
    description: 'Netflix + Spotify + Disney+',
    amount: 120,
    person: 'pessoa1',
    date: new Date(2024, 11, 1),
  },
  {
    id: '6',
    type: 'expense',
    category: 'transporte',
    description: 'Combustível',
    amount: 400,
    person: 'pessoa1',
    date: new Date(2024, 11, 20),
  },
  {
    id: '7',
    type: 'expense',
    category: 'lazer',
    description: 'Restaurante',
    amount: 350,
    person: 'pessoa2',
    date: new Date(2024, 11, 18),
  },
];

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [person1Name, setPerson1Name] = useState('Pessoa 1');
  const [person2Name, setPerson2Name] = useState('Pessoa 2');

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const categoryAnalysis = useMemo((): CategoryAnalysis[] => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category as ExpenseCategory;
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>);

    return Object.entries(expensesByCategory)
      .map(([category, total]) => {
        const cat = category as ExpenseCategory;
        const percentage = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
        const thresholds = categoryThresholds[cat];
        
        let status: 'low' | 'medium' | 'high' = 'low';
        if (percentage >= thresholds.high) {
          status = 'high';
        } else if (percentage >= thresholds.medium) {
          status = 'medium';
        }

        return {
          category: cat,
          label: expenseCategoryLabels[cat],
          total,
          percentage,
          status,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [transactions, totalIncome]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const incomeByPerson = useMemo(() => {
    const person1Income = transactions
      .filter(t => t.type === 'income' && t.person === 'pessoa1')
      .reduce((sum, t) => sum + t.amount, 0);
    const person2Income = transactions
      .filter(t => t.type === 'income' && t.person === 'pessoa2')
      .reduce((sum, t) => sum + t.amount, 0);
    return { pessoa1: person1Income, pessoa2: person2Income };
  }, [transactions]);

  const expensesByPerson = useMemo(() => {
    const person1Expenses = transactions
      .filter(t => t.type === 'expense' && t.person === 'pessoa1')
      .reduce((sum, t) => sum + t.amount, 0);
    const person2Expenses = transactions
      .filter(t => t.type === 'expense' && t.person === 'pessoa2')
      .reduce((sum, t) => sum + t.amount, 0);
    return { pessoa1: person1Expenses, pessoa2: person2Expenses };
  }, [transactions]);

  return {
    transactions,
    totalIncome,
    totalExpenses,
    balance,
    categoryAnalysis,
    addTransaction,
    deleteTransaction,
    person1Name,
    person2Name,
    setPerson1Name,
    setPerson2Name,
    incomeByPerson,
    expensesByPerson,
  };
}
