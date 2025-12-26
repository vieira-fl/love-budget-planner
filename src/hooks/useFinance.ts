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
  CategoryChange,
  SplitCalculation
} from '@/types/finance';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PeriodFilter {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const initialTransactions: Transaction[] = [
  // Dezembro 2024
  {
    id: '1',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 1',
    amount: 5000,
    person: 'pessoa1',
    date: new Date(2024, 11, 5),
    recurrence: 'recorrente',
    includeInSplit: false,
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
    includeInSplit: false,
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
    includeInSplit: true,
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
    includeInSplit: true,
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
    includeInSplit: true,
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
    includeInSplit: true,
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
    includeInSplit: true,
  },
  // Novembro 2024
  {
    id: '8',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 1',
    amount: 5000,
    person: 'pessoa1',
    date: new Date(2024, 10, 5),
    recurrence: 'recorrente',
    includeInSplit: false,
  },
  {
    id: '9',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 2',
    amount: 4500,
    person: 'pessoa2',
    date: new Date(2024, 10, 5),
    recurrence: 'recorrente',
    includeInSplit: false,
  },
  {
    id: '10',
    type: 'expense',
    category: 'alimentacao',
    description: 'Supermercado',
    amount: 900,
    person: 'pessoa2',
    date: new Date(2024, 10, 15),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '11',
    type: 'expense',
    category: 'moradia',
    description: 'Aluguel',
    amount: 2500,
    person: 'pessoa1',
    date: new Date(2024, 10, 10),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '12',
    type: 'expense',
    category: 'streaming',
    description: 'Netflix + Spotify',
    amount: 80,
    person: 'pessoa1',
    date: new Date(2024, 10, 1),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '13',
    type: 'expense',
    category: 'transporte',
    description: 'Combustível',
    amount: 350,
    person: 'pessoa1',
    date: new Date(2024, 10, 18),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '14',
    type: 'expense',
    category: 'saude',
    description: 'Farmácia',
    amount: 180,
    person: 'pessoa2',
    date: new Date(2024, 10, 22),
    recurrence: 'pontual',
    includeInSplit: true,
  },
  // Outubro 2024
  {
    id: '15',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 1',
    amount: 5000,
    person: 'pessoa1',
    date: new Date(2024, 9, 5),
    recurrence: 'recorrente',
    includeInSplit: false,
  },
  {
    id: '16',
    type: 'income',
    category: 'salario',
    description: 'Salário Pessoa 2',
    amount: 4500,
    person: 'pessoa2',
    date: new Date(2024, 9, 5),
    recurrence: 'recorrente',
    includeInSplit: false,
  },
  {
    id: '17',
    type: 'income',
    category: 'freelance',
    description: 'Projeto Extra',
    amount: 1500,
    person: 'pessoa1',
    date: new Date(2024, 9, 20),
    recurrence: 'pontual',
    includeInSplit: false,
  },
  {
    id: '18',
    type: 'expense',
    category: 'moradia',
    description: 'Aluguel',
    amount: 2500,
    person: 'pessoa1',
    date: new Date(2024, 9, 10),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '19',
    type: 'expense',
    category: 'alimentacao',
    description: 'Supermercado',
    amount: 850,
    person: 'pessoa2',
    date: new Date(2024, 9, 12),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '20',
    type: 'expense',
    category: 'streaming',
    description: 'Netflix + Spotify',
    amount: 80,
    person: 'pessoa1',
    date: new Date(2024, 9, 1),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '21',
    type: 'expense',
    category: 'transporte',
    description: 'Combustível',
    amount: 320,
    person: 'pessoa1',
    date: new Date(2024, 9, 15),
    recurrence: 'recorrente',
    includeInSplit: true,
  },
  {
    id: '22',
    type: 'expense',
    category: 'lazer',
    description: 'Cinema e Jantar',
    amount: 280,
    person: 'pessoa2',
    date: new Date(2024, 9, 25),
    recurrence: 'pontual',
    includeInSplit: true,
  },
  {
    id: '23',
    type: 'expense',
    category: 'educacao',
    description: 'Curso Online',
    amount: 200,
    person: 'pessoa1',
    date: new Date(2024, 9, 8),
    recurrence: 'pontual',
    includeInSplit: false,
  },
];

export function useFinance(periodFilter?: PeriodFilter) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [person1Name, setPerson1Name] = useState('Pessoa 1');
  const [person2Name, setPerson2Name] = useState('Pessoa 2');
  const [customExpenseCategories, setCustomExpenseCategories] = useState<Record<string, string>>({});
  const [customIncomeCategories, setCustomIncomeCategories] = useState<Record<string, string>>({});

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (!periodFilter?.startDate && !periodFilter?.endDate) {
      return transactions;
    }
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      
      if (periodFilter.startDate && periodFilter.endDate) {
        return isWithinInterval(transactionDate, {
          start: periodFilter.startDate,
          end: periodFilter.endDate,
        });
      }
      
      if (periodFilter.startDate) {
        return transactionDate >= periodFilter.startDate;
      }
      
      if (periodFilter.endDate) {
        return transactionDate <= periodFilter.endDate;
      }
      
      return true;
    });
  }, [transactions, periodFilter?.startDate, periodFilter?.endDate]);
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
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const categoryAnalysis = useMemo((): CategoryAnalysis[] => {
    const expensesByCategory = filteredTransactions
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
  }, [filteredTransactions, totalIncome, expenseCategoryLabels]);

  const top10Expenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredTransactions]);

  const monthlyComparison = useMemo((): MonthlyComparison[] => {
    // Get unique months from all transactions (not just filtered)
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    if (expenseTransactions.length === 0) {
      return [];
    }

    // Find all unique year-months from transactions
    const uniqueMonths = new Map<string, { date: Date; label: string }>();
    
    expenseTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = format(date, 'yyyy-MM');
      if (!uniqueMonths.has(monthKey)) {
        uniqueMonths.set(monthKey, {
          date: date,
          label: format(date, 'MMM/yy', { locale: ptBR }),
        });
      }
    });

    // Sort months chronologically and take last 6
    const sortedMonths = Array.from(uniqueMonths.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);

    const months: MonthlyComparison[] = sortedMonths.map(([monthKey, { date, label }]) => {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthTransactions = expenseTransactions.filter(
        t => isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );

      const categories: Record<string, number> = {};
      let total = 0;

      monthTransactions.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
        total += t.amount;
      });

      return {
        month: label,
        monthKey,
        categories,
        total,
      };
    });

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

  const incomeByPerson = useMemo(() => {
    const person1Income = filteredTransactions
      .filter(t => t.type === 'income' && t.person === 'pessoa1')
      .reduce((sum, t) => sum + t.amount, 0);
    const person2Income = filteredTransactions
      .filter(t => t.type === 'income' && t.person === 'pessoa2')
      .reduce((sum, t) => sum + t.amount, 0);
    return { pessoa1: person1Income, pessoa2: person2Income };
  }, [filteredTransactions]);

  const expensesByPerson = useMemo(() => {
    const person1Expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.person === 'pessoa1')
      .reduce((sum, t) => sum + t.amount, 0);
    const person2Expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.person === 'pessoa2')
      .reduce((sum, t) => sum + t.amount, 0);
    return { pessoa1: person1Expenses, pessoa2: person2Expenses };
  }, [filteredTransactions]);

  const splitCalculation = useMemo((): SplitCalculation => {
    const person1Income = incomeByPerson.pessoa1;
    const person2Income = incomeByPerson.pessoa2;
    const totalIncomeCalc = person1Income + person2Income;

    // Calculate income contribution percentages
    const person1IncomePercentage = totalIncomeCalc > 0 ? (person1Income / totalIncomeCalc) * 100 : 50;
    const person2IncomePercentage = totalIncomeCalc > 0 ? (person2Income / totalIncomeCalc) * 100 : 50;

    // Get only shared expenses (includeInSplit = true)
    const sharedExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.includeInSplit);
    const totalSharedExpenses = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Calculate ideal share based on income percentage
    const person1IdealShare = (person1IncomePercentage / 100) * totalSharedExpenses;
    const person2IdealShare = (person2IncomePercentage / 100) * totalSharedExpenses;

    // Calculate actual paid amounts for shared expenses
    const person1ActualPaid = sharedExpenses
      .filter(t => t.person === 'pessoa1')
      .reduce((sum, t) => sum + t.amount, 0);
    const person2ActualPaid = sharedExpenses
      .filter(t => t.person === 'pessoa2')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate expense-to-income ratio for each person (based on actual shared expenses paid)
    const person1ExpenseToIncomeRatio = person1Income > 0 ? (person1ActualPaid / person1Income) * 100 : 0;
    const person2ExpenseToIncomeRatio = person2Income > 0 ? (person2ActualPaid / person2Income) * 100 : 0;

    // Calculate settlement
    const person1Difference = person1ActualPaid - person1IdealShare;

    let settlement: SplitCalculation['settlement'] = {
      fromPerson: null,
      toPerson: null,
      amount: 0,
    };

    if (Math.abs(person1Difference) > 0.01) {
      if (person1Difference > 0) {
        // Person 1 paid more than their ideal share
        settlement = {
          fromPerson: 'pessoa2',
          toPerson: 'pessoa1',
          amount: person1Difference,
        };
      } else {
        // Person 2 paid more than their ideal share
        settlement = {
          fromPerson: 'pessoa1',
          toPerson: 'pessoa2',
          amount: Math.abs(person1Difference),
        };
      }
    }

    return {
      person1IncomePercentage,
      person2IncomePercentage,
      totalSharedExpenses,
      person1IdealShare,
      person2IdealShare,
      person1ActualPaid,
      person2ActualPaid,
      person1ExpenseToIncomeRatio,
      person2ExpenseToIncomeRatio,
      settlement,
    };
  }, [filteredTransactions, incomeByPerson]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const addMultipleTransactions = (transactions: Omit<Transaction, 'id'>[]) => {
    const newTransactions: Transaction[] = transactions.map((t, index) => ({
      ...t,
      id: (Date.now() + index).toString(),
    }));
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const updateTransaction = (transaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    totalIncome,
    totalExpenses,
    balance,
    categoryAnalysis,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
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
    splitCalculation,
  };
}
