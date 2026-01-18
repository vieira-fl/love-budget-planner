import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Transaction, 
  ExpenseCategory, 
  CategoryAnalysis,
  SplitCalculation,
  categoryThresholds,
  defaultThreshold,
  defaultExpenseCategoryLabels,
  defaultIncomeCategoryLabels,
  normalizeCategoryKey,
  MonthlyComparison,
  CategoryChange,
  MonthlyBalanceSummary
} from '@/types/finance';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PeriodFilter {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  category: string;
  description: string;
  tag: string | null;
  amount: number;
  person: string;
  date: string;
  recurrence: string | null;
  include_in_split: boolean;
  created_at: string;
  updated_at: string;
}

// Map DB recurrence values to frontend values
// DB uses: 'once', 'monthly', 'weekly'
const mapRecurrenceFromDb = (dbValue: string | null): 'pontual' | 'recorrente' => {
  if (dbValue === 'monthly' || dbValue === 'weekly') return 'recorrente';
  return 'pontual'; // 'once' or null -> 'pontual'
};

// Map frontend recurrence values to DB values
// DB constraint accepts: 'once', 'monthly', 'weekly'
const mapRecurrenceToDb = (frontendValue: 'pontual' | 'recorrente'): string => {
  return frontendValue === 'recorrente' ? 'monthly' : 'once';
};

const mapDbToTransaction = (db: DbTransaction): Transaction => ({
  id: db.id,
  type: db.type as 'income' | 'expense',
  category: normalizeCategoryKey(db.category, db.type as 'income' | 'expense'),
  description: db.description,
  tag: db.tag || undefined,
  amount: Number(db.amount),
  person: db.person,
  date: new Date(db.date),
  recurrence: mapRecurrenceFromDb(db.recurrence),
  includeInSplit: db.include_in_split,
});

export function useTransactions(periodFilter?: PeriodFilter) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [customExpenseCategories, setCustomExpenseCategories] = useState<Record<string, string>>({});
  const [customIncomeCategories, setCustomIncomeCategories] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Fetch transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: 'Erro ao carregar transações',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const mapped = (data || []).map(mapDbToTransaction);
      setTransactions(mapped);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [isAuthenticated, fetchTransactions]);

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
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    if (expenseTransactions.length === 0) {
      return [];
    }

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
  }, [filteredTransactions]);

  const monthlyBalanceSummary = useMemo((): MonthlyBalanceSummary[] => {
    if (filteredTransactions.length === 0) {
      return [];
    }

    const monthsMap = new Map<string, { income: number; expenses: number; date: Date; label: string }>();

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = format(date, 'yyyy-MM');

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          income: 0,
          expenses: 0,
          date,
          label: format(date, 'MMM/yy', { locale: ptBR }),
        });
      }

      const monthData = monthsMap.get(monthKey)!;
      if (transaction.type === 'income') {
        monthData.income += transaction.amount;
      } else {
        monthData.expenses += transaction.amount;
      }
    });

    const sortedMonths = Array.from(monthsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);

    return sortedMonths.map(([monthKey, data]) => ({
      month: data.label,
      monthKey,
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses,
    }));
  }, [filteredTransactions]);

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

  // Get unique people from transactions
  const uniquePeople = useMemo(() => {
    const people = new Set(filteredTransactions.map(t => t.person));
    return Array.from(people).sort();
  }, [filteredTransactions]);

  // Calculate income and expenses per person
  const personSummaries = useMemo(() => {
    const summaries: Record<string, { income: number; expenses: number }> = {};
    
    filteredTransactions.forEach(t => {
      if (!summaries[t.person]) {
        summaries[t.person] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        summaries[t.person].income += t.amount;
      } else {
        summaries[t.person].expenses += t.amount;
      }
    });
    
    return summaries;
  }, [filteredTransactions]);

  // Calculate split calculation for the couple
  const splitCalculation = useMemo((): SplitCalculation | null => {
    if (uniquePeople.length < 2) return null;
    
    const person1 = uniquePeople[0];
    const person2 = uniquePeople[1];
    
    const person1Summary = personSummaries[person1] || { income: 0, expenses: 0 };
    const person2Summary = personSummaries[person2] || { income: 0, expenses: 0 };
    
    const person1Income = person1Summary.income;
    const person2Income = person2Summary.income;
    const totalIncome = person1Income + person2Income;
    
    // Calculate income percentage
    const person1IncomePercentage = totalIncome > 0 ? (person1Income / totalIncome) * 100 : 50;
    const person2IncomePercentage = totalIncome > 0 ? (person2Income / totalIncome) * 100 : 50;
    
    // Get shared expenses (marked for split)
    const sharedExpenses = filteredTransactions.filter(t => 
      t.type === 'expense' && t.includeInSplit
    );
    
    const totalSharedExpenses = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate ideal share based on income percentage
    const person1IdealShare = totalSharedExpenses * (person1IncomePercentage / 100);
    const person2IdealShare = totalSharedExpenses * (person2IncomePercentage / 100);
    
    // Calculate actual paid
    const person1ActualPaid = sharedExpenses
      .filter(t => t.person === person1)
      .reduce((sum, t) => sum + t.amount, 0);
    const person2ActualPaid = sharedExpenses
      .filter(t => t.person === person2)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate expense to income ratio
    const person1ExpenseToIncomeRatio = person1Income > 0 
      ? (person1ActualPaid / person1Income) * 100 
      : 0;
    const person2ExpenseToIncomeRatio = person2Income > 0 
      ? (person2ActualPaid / person2Income) * 100 
      : 0;
    
    // Calculate settlement
    const person1Difference = person1ActualPaid - person1IdealShare;
    const person2Difference = person2ActualPaid - person2IdealShare;
    
    let settlement: SplitCalculation['settlement'] = {
      fromPerson: null,
      toPerson: null,
      amount: 0,
    };
    
    if (Math.abs(person1Difference) > 0.01) {
      if (person1Difference > 0) {
        // Person 1 paid more than ideal, Person 2 should pay Person 1
        settlement = {
          fromPerson: 'pessoa2',
          toPerson: 'pessoa1',
          amount: person1Difference,
        };
      } else {
        // Person 2 paid more than ideal, Person 1 should pay Person 2
        settlement = {
          fromPerson: 'pessoa1',
          toPerson: 'pessoa2',
          amount: -person1Difference,
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
  }, [filteredTransactions, uniquePeople, personSummaries]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para adicionar transações.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          tag: transaction.tag || null,
          amount: transaction.amount,
          person: transaction.person,
          date: format(transaction.date, 'yyyy-MM-dd'),
          recurrence: mapRecurrenceToDb(transaction.recurrence),
          include_in_split: transaction.includeInSplit,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        toast({
          title: 'Erro ao adicionar transação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const newTransaction = mapDbToTransaction(data);
      setTransactions(prev => [newTransaction, ...prev]);
      
      toast({
        title: 'Transação adicionada!',
        description: `${transaction.description} foi registrada.`,
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const addMultipleTransactions = async (transactionsToAdd: Omit<Transaction, 'id'>[]) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para adicionar transações.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const inserts = transactionsToAdd.map(t => ({
        user_id: user.id,
        type: t.type,
        category: t.category,
        description: t.description,
        tag: t.tag || null,
        amount: t.amount,
        person: t.person,
        date: format(t.date, 'yyyy-MM-dd'),
        recurrence: mapRecurrenceToDb(t.recurrence),
        include_in_split: t.includeInSplit,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(inserts)
        .select();

      if (error) {
        console.error('Error adding transactions:', error);
        toast({
          title: 'Erro ao adicionar transações',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const newTransactions = (data || []).map(mapDbToTransaction);
      setTransactions(prev => [...newTransactions, ...prev]);
      
      toast({
        title: 'Transações adicionadas!',
        description: `${transactionsToAdd.length} transações foram registradas.`,
      });
    } catch (error) {
      console.error('Error adding transactions:', error);
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          tag: transaction.tag || null,
          amount: transaction.amount,
          person: transaction.person,
          date: format(transaction.date, 'yyyy-MM-dd'),
          recurrence: mapRecurrenceToDb(transaction.recurrence),
          include_in_split: transaction.includeInSplit,
        })
        .eq('id', transaction.id);

      if (error) {
        console.error('Error updating transaction:', error);
        toast({
          title: 'Erro ao atualizar transação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
      
      toast({
        title: 'Transação atualizada!',
        description: `${transaction.description} foi atualizada.`,
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: 'Erro ao excluir transação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: 'Transação excluída!',
        description: 'A transação foi removida.',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    loading,
    totalIncome,
    totalExpenses,
    balance,
    categoryAnalysis,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    expenseCategoryLabels,
    incomeCategoryLabels,
    addExpenseCategory,
    addIncomeCategory,
    top10Expenses,
    monthlyComparison,
    biggestCategoryIncrease,
    monthlyBalanceSummary,
    refetch: fetchTransactions,
    splitCalculation,
    uniquePeople,
    personSummaries,
  };
}
