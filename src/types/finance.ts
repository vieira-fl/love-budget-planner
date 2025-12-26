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
  | 'outros';

export type IncomeCategory = 
  | 'salario'
  | 'freelance'
  | 'investimentos'
  | 'outros';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  description: string;
  amount: number;
  person: 'pessoa1' | 'pessoa2';
  date: Date;
}

export interface CategoryAnalysis {
  category: ExpenseCategory;
  label: string;
  total: number;
  percentage: number;
  status: 'low' | 'medium' | 'high';
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
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

export const incomeCategoryLabels: Record<IncomeCategory, string> = {
  salario: 'Salário',
  freelance: 'Freelance',
  investimentos: 'Investimentos',
  outros: 'Outros',
};

export const categoryThresholds: Record<ExpenseCategory, { medium: number; high: number }> = {
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
