// Types for table entry page
import { PaymentMethod } from '@/types/finance';

export interface TransactionRow {
  id: string;
  data: string;
  descricao: string;
  brl: string;
  responsavel: string;
  categoria: string;
  tipo: string;
  formaPgto: PaymentMethod;
  tagDespesa?: string;
  incluirRateio: boolean;
  parcelado: boolean;
}

export type ErrorsByCell = Record<string, Partial<Record<keyof TransactionRow, string>>>;

export interface ValidationResult {
  valid: boolean;
  errorsByCell: ErrorsByCell;
  errorList: string[];
  totalBrl: number;
  validCount: number;
}

export interface TransactionOptions {
  categories: string[];
  types: string[];
  tags: string[];
}

// Default options for dropdowns - matching AddTransactionDialog categories
export const DEFAULT_CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Streaming/Assinaturas",
  "Vestuário",
  "Pets",
  "Outros",
];

export const DEFAULT_TYPES = [
  "Pontual",
  "Recorrente",
];

export const DEFAULT_PAYMENT_METHODS = [
  "Cartão",
  "PIX",
  "TED",
  "Cash",
];

export const DEFAULT_TAGS: string[] = [];

export type SortField = keyof TransactionRow | null;
export type SortDirection = 'asc' | 'desc';
