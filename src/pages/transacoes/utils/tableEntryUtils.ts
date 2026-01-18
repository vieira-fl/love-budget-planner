import { TransactionOptions } from "../types";

export const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) {
    return day;
  }

  if (digits.length <= 4) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${year}`;
};

export const isValidDatePtBr = (dateStr: string): boolean => {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!day || !month || !year) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const sanitizeBRLInput = (raw: string): string => {
  // Preserve negative sign at the beginning
  const isNegative = raw.trim().startsWith("-");
  const cleaned = raw.replace(/[^\d,\.]/g, "");
  const firstCommaIndex = cleaned.indexOf(",");
  
  let result: string;
  if (firstCommaIndex === -1) {
    result = cleaned;
  } else {
    result = cleaned.slice(0, firstCommaIndex + 1) +
      cleaned.slice(firstCommaIndex + 1).replace(/,/g, "");
  }
  
  return isNegative ? `-${result}` : result;
};

export const parseBRL = (input: string): number | null => {
  const trimmed = input.replace(/\s/g, "").replace(/R\$/gi, "");
  if (!trimmed) {
    return null;
  }

  // Check for negative sign
  const isNegative = trimmed.startsWith("-");
  const withoutSign = isNegative ? trimmed.slice(1) : trimmed;

  const cleaned = withoutSign.replace(/[^\d,\.]/g, "");
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (!cleaned) {
    return null;
  }
  if (!digitsOnly) {
    return null;
  }

  const hasComma = cleaned.includes(",");

  let parsed: number | null = null;

  if (hasComma) {
    const [integerPart, decimalPart = ""] = cleaned.split(",", 2);
    const integerDigits = integerPart.replace(/\./g, "");
    const decimalDigits = decimalPart.replace(/\D/g, "");
    const normalized = decimalDigits
      ? `${integerDigits}.${decimalDigits}`
      : integerDigits;
    parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      return null;
    }
  } else {
    const dotMatches = cleaned.match(/\./g) || [];
    if (dotMatches.length === 1) {
      const [integerPart, decimalPart = ""] = cleaned.split(".");
      if (decimalPart.length === 2) {
        parsed = Number(`${integerPart}.${decimalPart}`);
        if (Number.isNaN(parsed)) {
          return null;
        }
      }
    }

    if (parsed === null) {
      parsed = Number(cleaned.replace(/\./g, ""));
      if (Number.isNaN(parsed)) {
        return null;
      }
    }
  }

  return isNegative ? -parsed : parsed;
};

export const formatBRLDisplay = (value: string): string => {
  const parsed = parseBRL(value);
  if (parsed === null) {
    return value;
  }

  // Format preserving negative sign
  const formatted = Math.abs(parsed).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return parsed < 0 ? `-${formatted}` : formatted;
};

export const normalizeTextOption = (value: string): string => {
  return value.trim().replace(/\s+/g, " ");
};

const dedupeCaseInsensitive = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });

  return result;
};

export const mergeOptions = (
  defaults: TransactionOptions,
  stored?: Partial<TransactionOptions> | null
): TransactionOptions => {
  const categories = dedupeCaseInsensitive([
    ...defaults.categories,
    ...(stored?.categories ?? []),
  ]);
  const types = dedupeCaseInsensitive([
    ...defaults.types,
    ...(stored?.types ?? []),
  ]);
  const tags = dedupeCaseInsensitive([
    ...defaults.tags,
    ...(stored?.tags ?? []),
  ]);

  return { categories, types, tags };
};

export const sumBRL = (values: Array<string | number>): number => {
  let total = 0;
  for (const value of values) {
    const parsed = typeof value === "number" ? value : parseBRL(value);
    if (parsed !== null) {
      total += parsed;
    }
  }
  return total;
};
