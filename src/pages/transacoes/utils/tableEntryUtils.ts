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
  const cleaned = raw.replace(/[^\d,\.]/g, "");
  const firstCommaIndex = cleaned.indexOf(",");
  if (firstCommaIndex === -1) {
    return cleaned;
  }

  return (
    cleaned.slice(0, firstCommaIndex + 1) +
    cleaned.slice(firstCommaIndex + 1).replace(/,/g, "")
  );
};

export const parseBRL = (input: string): number | null => {
  const trimmed = input.replace(/\s/g, "").replace(/R\$/gi, "");
  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.replace(/[^\d,\.]/g, "");
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (!cleaned) {
    return null;
  }
  if (!digitsOnly) {
    return null;
  }

  const hasComma = cleaned.includes(",");

  if (hasComma) {
    const [integerPart, decimalPart = ""] = cleaned.split(",", 2);
    const integerDigits = integerPart.replace(/\./g, "");
    const decimalDigits = decimalPart.replace(/\D/g, "");
    const normalized = decimalDigits
      ? `${integerDigits}.${decimalDigits}`
      : integerDigits;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const dotMatches = cleaned.match(/\./g) || [];
  if (dotMatches.length === 1) {
    const [integerPart, decimalPart = ""] = cleaned.split(".");
    if (decimalPart.length === 2) {
      const parsed = Number(`${integerPart}.${decimalPart}`);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  const parsed = Number(cleaned.replace(/\./g, ""));
  return Number.isNaN(parsed) ? null : parsed;
};

export const formatBRLDisplay = (value: string): string => {
  const parsed = parseBRL(value);
  if (parsed === null) {
    return value;
  }

  return parsed.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
