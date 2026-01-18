// Types for table entry page

export interface TransactionRow {
  id: string;
  data: string;
  descricao: string;
  brl: string;
  responsavel: string;
  categoria: string;
  tipo: string;
  tagDespesa: string;
  incluirRateio: boolean;
  parcelado: boolean;
}

export interface RowError {
  rowIndex: number;
  field: keyof TransactionRow;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: RowError[];
  totalBrl: number;
  validCount: number;
}

// Mock data for dropdowns
export const CATEGORIAS = [
  "Alimentação",
  "Transporte", 
  "Moradia",
  "Saúde",
  "Lazer",
  "Educação",
  "Assinaturas",
  "Impostos",
  "Outros"
];

export const TIPOS = [
  "Despesa",
  "Receita",
  "Transferência",
  "Estorno"
];

export const TAGS = [
  "",
  "Essencial",
  "Supérfluo",
  "Investimento",
  "Emergência"
];
