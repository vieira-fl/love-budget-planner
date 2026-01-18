import { TransactionRow, ErrorsByCell } from "../types";
import { formatBRLDisplay } from "./tableEntryUtils";

export interface CsvParseResult {
  rows: TransactionRow[];
  errors: ErrorsByCell;
  parseErrors: string[];
}

const generateId = () => crypto.randomUUID();

/**
 * Parse a CSV line handling quoted fields
 */
function parseCsvLine(line: string, separator = ";"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Try to detect the CSV separator (semicolon or comma)
 */
function detectSeparator(headerLine: string): string {
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return semicolonCount >= commaCount ? ";" : ",";
}

/**
 * Map column names (case insensitive) to TransactionRow fields
 */
const COLUMN_MAPPINGS: Record<string, keyof TransactionRow> = {
  // Date
  data: "data",
  date: "data",
  dt: "data",
  
  // Description
  descricao: "descricao",
  descrição: "descricao",
  description: "descricao",
  desc: "descricao",
  
  // Value
  brl: "brl",
  valor: "brl",
  value: "brl",
  amount: "brl",
  
  // Person
  responsavel: "responsavel",
  responsável: "responsavel",
  pessoa: "responsavel",
  person: "responsavel",
  
  // Category
  categoria: "categoria",
  category: "categoria",
  cat: "categoria",
  
  // Type
  tipo: "tipo",
  type: "tipo",
  
  // Tag
  tag: "tagDespesa",
  tagdespesa: "tagDespesa",
  tags: "tagDespesa",
  
  // Include in split
  incluirrateio: "incluirRateio",
  rateio: "incluirRateio",
  split: "incluirRateio",
  
  // Installments
  parcelado: "parcelado",
  parcelas: "parcelado",
  installments: "parcelado",
};

/**
 * Parse boolean values from various formats
 */
function parseBoolean(value: string, defaultValue: boolean): boolean {
  const normalized = value.toLowerCase().trim();
  if (["true", "sim", "yes", "1", "s", "y", "x"].includes(normalized)) {
    return true;
  }
  if (["false", "não", "nao", "no", "0", "n", ""].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

/**
 * Parse CSV content into TransactionRow array
 */
export function parseCsvContent(
  content: string,
  defaultResponsavel: string
): CsvParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      rows: [],
      errors: {},
      parseErrors: ["O arquivo está vazio."],
    };
  }

  const headerLine = lines[0];
  const separator = detectSeparator(headerLine);
  const headers = parseCsvLine(headerLine, separator);

  // Map headers to field names
  const fieldMap: Map<number, keyof TransactionRow> = new Map();
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().replace(/[^a-záàãâéêíóôõúç]/g, "");
    const field = COLUMN_MAPPINGS[normalized];
    if (field) {
      fieldMap.set(index, field);
    }
  });

  if (fieldMap.size === 0) {
    return {
      rows: [],
      errors: {},
      parseErrors: [
        "Nenhuma coluna reconhecida no arquivo. Use: data, descricao, valor, responsavel, categoria, tipo.",
      ],
    };
  }

  const rows: TransactionRow[] = [];
  const errors: ErrorsByCell = {};
  const parseErrors: string[] = [];

  // Parse data lines (skip header)
  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const values = parseCsvLine(line, separator);

    // Create row with defaults
    const row: TransactionRow = {
      id: generateId(),
      data: "",
      descricao: "",
      brl: "",
      responsavel: defaultResponsavel,
      categoria: "",
      tipo: "Despesa", // Default to "Despesa" when importing
      tagDespesa: "",
      incluirRateio: true,
      parcelado: false,
    };

    // Populate row from CSV values
    fieldMap.forEach((field, colIndex) => {
      const value = values[colIndex] ?? "";
      
      if (field === "incluirRateio") {
        row.incluirRateio = parseBoolean(value, true);
      } else if (field === "parcelado") {
        row.parcelado = parseBoolean(value, false);
      } else if (field === "data") {
        row.data = value;
      } else if (field === "descricao") {
        row.descricao = value;
      } else if (field === "brl") {
        // Format value as currency with 2 decimal places
        row.brl = value ? formatBRLDisplay(value) : "";
      } else if (field === "responsavel") {
        row.responsavel = value || defaultResponsavel;
      } else if (field === "categoria") {
        row.categoria = value;
      } else if (field === "tipo") {
        row.tipo = value;
      } else if (field === "tagDespesa") {
        row.tagDespesa = value;
      }
    });

    // Skip completely empty rows
    const hasContent = row.data || row.descricao || row.brl || row.categoria;
    if (!hasContent) {
      continue;
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    parseErrors.push("Nenhuma linha de dados válida encontrada no arquivo.");
  }

  return { rows, errors, parseErrors };
}
