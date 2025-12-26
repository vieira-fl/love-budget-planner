export type TransactionType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'streaming'
  | 'vestuario'
  | 'pets'
  | 'outros'
  | string; // Allow custom categories

export type IncomeCategory = 
  | 'salario'
  | 'freelance'
  | 'investimentos'
  | 'outros'
  | string; // Allow custom categories

export type RecurrenceType = 'pontual' | 'recorrente';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  description: string;
  amount: number;
  person: 'pessoa1' | 'pessoa2';
  date: Date;
  recurrence: RecurrenceType;
}

export interface CategoryAnalysis {
  category: ExpenseCategory;
  label: string;
  total: number;
  percentage: number;
  status: 'low' | 'medium' | 'high';
}

export interface MonthlyComparison {
  month: string;
  monthKey: string;
  categories: Record<string, number>;
  total: number;
}

export interface CategoryChange {
  category: string;
  label: string;
  previousMonth: string;
  currentMonth: string;
  previousValue: number;
  currentValue: number;
  change: number;
  changePercentage: number;
}

export const defaultExpenseCategoryLabels: Record<string, string> = {
  moradia: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  streaming: 'Streaming/Assinaturas',
  vestuario: 'Vestuário',
  pets: 'Pets',
  outros: 'Outros',
};

export const defaultIncomeCategoryLabels: Record<string, string> = {
  salario: 'Salário',
  freelance: 'Freelance',
  investimentos: 'Investimentos',
  outros: 'Outros',
};

export const categoryThresholds: Record<string, { medium: number; high: number }> = {
  moradia: { medium: 30, high: 40 },
  alimentacao: { medium: 20, high: 30 },
  transporte: { medium: 15, high: 20 },
  saude: { medium: 10, high: 15 },
  educacao: { medium: 10, high: 15 },
  lazer: { medium: 8, high: 12 },
  streaming: { medium: 3, high: 5 },
  vestuario: { medium: 5, high: 8 },
  pets: { medium: 5, high: 8 },
  outros: { medium: 10, high: 15 },
};

// Default thresholds for custom categories
export const defaultThreshold = { medium: 8, high: 12 };
