import { useState, useMemo } from 'react';
import { 
  Transaction, 
  ExpenseCategory, 
  CategoryAnalysis, 
  categoryThresholds, 
  defaultThreshold,
  defaultExpenseCategoryLabels,
  defaultIncomeCategoryLabels,
  MonthlyComparison,
  CategoryChange
} from '@/types/finance';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 1',
    amount: 5000,
    person: 'pessoa1',
    date: new Date(2024, 11, 5),
    recurrence: 'recorrente',
  },
  {
    id: '2',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 2',
    amount: 4500,
    person: 'pessoa2',
    date: new Date(2024, 11, 5),
    recurrence: 'recorrente',
  },
  {
    id: '3',
    type: 'expense',
    category: 'moradia',
    description: 'Aluguel',
    amount: 2500,
    person: 'pessoa1',
    date: new Date(2024, 11, 10),
    recurrence: 'recorrente',
  },
  {
    id: '4',
    type: 'expense',
    category: 'alimentacao',
    description: 'Supermercado',
    amount: 1200,
    person: 'pessoa2',
    date: new Date(2024, 11, 15),
    recurrence: 'recorrente',
  },
  {
    id: '5',
    type: 'expense',
    category: 'streaming',
    description: 'Netflix + Spotify + Disney+',
    amount: 120,
    person: 'pessoa1',
    date: new Date(2024, 11, 1),
    recurrence: 'recorrente',
  },
  {
    id: '6',
    type: 'expense',
    category: 'transporte',
    description: 'Combustível',
    amount: 400,
    person: 'pessoa1',
    date: new Date(2024, 11, 20),
    recurrence: 'recorrente',
  },
  {
    id: '7',
    type: 'expense',
    category: 'lazer',
    description: 'Restaurante',
    amount: 350,
    person: 'pessoa2',
    date: new Date(2024, 11, 18),
    recurrence: 'pontual',
  },
  // Add some previous month data for comparison
  {
    id: '8',
    type: 'expense',
    category: 'alimentacao',
    description: 'Supermercado',
    amount: 900,
    person: 'pessoa2',
    date: new Date(2024, 10, 15),
    recurrence: 'recorrente',
  },
  {
    id: '9',
    type: 'expense',
    category: 'moradia',
    description: 'Aluguel',
    amount: 2500,
    person: 'pessoa1',
    date: new Date(2024, 10, 10),
    recurrence: 'recorrente',
  },
  {
    id: '10',
    type: 'expense',
    category: 'streaming',
    description: 'Netflix + Spotify',
    amount: 80,
    person: 'pessoa1',
    date: new Date(2024, 10, 1),
    recurrence: 'recorrente',
  },
];

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [person1Name, setPerson1Name] = useState('Pessoa 1');
  const [person2Name, setPerson2Name] = useState('Pessoa 2');
  const [customExpenseCategories, setCustomExpenseCategories] = useState<Record<string, string>>({});
  const [customIncomeCategories, setCustomIncomeCategories] = useState<Record<string, string>>({});

  const expenseCategoryLabels = useMemo(() => ({
    ...defaultExpenseCategoryLabels,
    ...customExpenseCategories,
  }), [customExpenseCategories]);

  const incomeCategoryLabels = useMemo(() => ({
    ...defaultIncomeCategoryLabels,
    ...customIncomeCategories,
  }), [customIncomeCategories]);

  const addExpenseCategory = (key: string, label: string) => {
    setCustomExpenseCategories(prev => ({ ...prev, [key]: label }));
  };

  const addIncomeCategory = (key: string, label: string) => {
    setCustomIncomeCategories(prev => ({ ...prev, [key]: label }));
  };

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
        const thresholds = categoryThresholds[cat] || defaultThreshold;
        
        let status: 'low' | 'medium' | 'high' = 'low';
        if (percentage >= thresholds.high) {
          status = 'high';
        } else if (percentage >= thresholds.medium) {
          status = 'medium';
        }

        return {
          category: cat,
          label: expenseCategoryLabels[cat] || cat,
          total,
          percentage,
          status,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [transactions, totalIncome, expenseCategoryLabels]);

  const top10Expenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions]);

  const monthlyComparison = useMemo((): MonthlyComparison[] => {
    const now = new Date();
    const months: MonthlyComparison[] = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM/yy', { locale: ptBR });

      const monthTransactions = transactions.filter(
        t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );

      const categories: Record<string, number> = {};
      let total = 0;

      monthTransactions.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
        total += t.amount;
      });

      months.push({
        month: monthLabel,
        monthKey,
        categories,
        total,
      });
    }

    return months;
  }, [transactions]);

  const biggestCategoryIncrease = useMemo((): CategoryChange | null => {
    if (monthlyComparison.length < 2) return null;

    const currentMonth = monthlyComparison[monthlyComparison.length - 1];
    const previousMonth = monthlyComparison[monthlyComparison.length - 2];

    const allCategories = new Set([
      ...Object.keys(currentMonth.categories),
      ...Object.keys(previousMonth.categories),
    ]);

    let biggestChange: CategoryChange | null = null;

    allCategories.forEach(category => {
      const currentValue = currentMonth.categories[category] || 0;
      const previousValue = previousMonth.categories[category] || 0;
      const change = currentValue - previousValue;

      if (change > 0 && (!biggestChange || change > biggestChange.change)) {
        biggestChange = {
          category,
          label: expenseCategoryLabels[category] || category,
          previousMonth: previousMonth.month,
          currentMonth: currentMonth.month,
          previousValue,
          currentValue,
          change,
          changePercentage: previousValue > 0 ? ((change / previousValue) * 100) : 100,
        };
      }
    });

    return biggestChange;
  }, [monthlyComparison, expenseCategoryLabels]);

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
    expenseCategoryLabels,
    incomeCategoryLabels,
    addExpenseCategory,
    addIncomeCategory,
    top10Expenses,
    monthlyComparison,
    biggestCategoryIncrease,
  };
}
