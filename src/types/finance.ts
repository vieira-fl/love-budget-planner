export type TransactionType = 'income' | 'expense';

export const EXPENSE_CATEGORY_KEYS = [
  'transporte',
  'alimentacao',
  'moradia',
  'assinaturas',
  'streaming',
  'pet',
  'saude',
  'educacao',
  'lazer',
  'vestuario',
  'outros',
] as const;

export const INCOME_CATEGORY_KEYS = [
  'salario',
  'bonus',
  'investimentos',
  'outros',
] as const;

export type ExpenseCategory =
  | (typeof EXPENSE_CATEGORY_KEYS)[number]
  | string; // Allow custom categories

export type IncomeCategory =
  | (typeof INCOME_CATEGORY_KEYS)[number]
  | string; // Allow custom categories

export type RecurrenceType = 'pontual' | 'recorrente';

export type PaymentMethod = 'Cartão' | 'PIX' | 'TED' | 'Cash';

export const PAYMENT_METHODS: PaymentMethod[] = ['Cartão', 'PIX', 'TED', 'Cash'];

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  description: string;
  tag?: string;
  amount: number;
  person: string;
  date: Date;
  recurrence: RecurrenceType;
  includeInSplit: boolean;
  paymentMethod?: PaymentMethod;
}

export interface SplitCalculation {
  person1IncomePercentage: number;
  person2IncomePercentage: number;
  person1SplitIncome: number;
  person2SplitIncome: number;
  totalSharedExpenses: number;
  person1IdealShare: number;
  person2IdealShare: number;
  person1ActualPaid: number;
  person2ActualPaid: number;
  person1ExpenseToIncomeRatio: number;
  person2ExpenseToIncomeRatio: number;
  settlement: {
    fromPerson: string | null;
    toPerson: string | null;
    amount: number;
  };
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

export interface MonthlyBalanceSummary {
  month: string;
  monthKey: string;
  income: number;
  expenses: number;
  balance: number;
}

export const defaultExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  moradia: 'Moradia',
  assinaturas: 'Assinaturas',
  streaming: 'Streaming',
  pet: 'Pet',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  vestuario: 'Vestuário',
  outros: 'Outros',
};

export const defaultIncomeCategoryLabels: Record<IncomeCategory, string> = {
  salario: 'Salário',
  bonus: 'Bônus',
  investimentos: 'Investimentos',
  outros: 'Outros',
};

export const EXPENSE_CATEGORY_LABELS = EXPENSE_CATEGORY_KEYS.map(
  (key) => defaultExpenseCategoryLabels[key]
);

export const INCOME_CATEGORY_LABELS = INCOME_CATEGORY_KEYS.map(
  (key) => defaultIncomeCategoryLabels[key]
);

const normalizeCategoryInput = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const expenseCategoryAliases: Record<string, ExpenseCategory> = {
  pets: 'pet',
};

const incomeCategoryAliases: Record<string, IncomeCategory> = {
  freelance: 'bonus',
};

export const normalizeCategoryKey = (
  value: string,
  type: TransactionType
): ExpenseCategory | IncomeCategory => {
  const normalized = normalizeCategoryInput(value);
  if (!normalized) {
    return 'outros';
  }

  if (type === 'income') {
    return incomeCategoryAliases[normalized] ?? normalized;
  }

  return expenseCategoryAliases[normalized] ?? normalized;
};

export const categoryThresholds: Record<string, { medium: number; high: number }> = {
  transporte: { medium: 15, high: 20 },
  alimentacao: { medium: 20, high: 30 },
  moradia: { medium: 30, high: 40 },
  assinaturas: { medium: 3, high: 5 },
  streaming: { medium: 3, high: 5 },
  pet: { medium: 5, high: 8 },
  saude: { medium: 10, high: 15 },
  educacao: { medium: 10, high: 15 },
  lazer: { medium: 8, high: 12 },
  vestuario: { medium: 5, high: 8 },
  outros: { medium: 10, high: 15 },
};

// Default thresholds for custom categories
export const defaultThreshold = { medium: 8, high: 12 };
