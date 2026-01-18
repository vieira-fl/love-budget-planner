// Types for table entry page

export interface TransactionRow {
  id: string;
  data: string;
  descricao: string;
  brl: string;
  responsavel: string;
  categoria: string;
  tipo: string;
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

// Default options for dropdowns
export const DEFAULT_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Lazer",
  "Educação",
  "Assinaturas",
  "Impostos",
  "Outros",
];

export const DEFAULT_TYPES = [
  "Despesa",
  "Receita",
  "Transferência",
  "Estorno",
];

export const DEFAULT_TAGS: string[] = [];
