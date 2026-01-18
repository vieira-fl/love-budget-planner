import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TAGS,
  DEFAULT_TYPES,
  ErrorsByCell,
  TransactionOptions,
  TransactionRow,
  ValidationResult,
} from "../types";
import {
  formatBRLDisplay,
  isValidDatePtBr,
  mergeOptions,
  normalizeTextOption,
  parseBRL,
  sumBRL,
} from "../utils/tableEntryUtils";

type OptionField = "categoria" | "tipo" | "tagDespesa";

type UseTableEntryArgs = {
  defaultResponsavel: string;
  userId: string;
};

const DEFAULT_OPTIONS: TransactionOptions = {
  categories: DEFAULT_CATEGORIES,
  types: DEFAULT_TYPES,
  tags: DEFAULT_TAGS,
};

export function useTableEntry({ defaultResponsavel, userId }: UseTableEntryArgs) {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [errorsByCell, setErrorsByCell] = useState<ErrorsByCell>({});
  const [options, setOptions] = useState<TransactionOptions>(DEFAULT_OPTIONS);

  const storageKey = useMemo(
    () => `ff.transactionOptions.${userId || "default"}`,
    [userId]
  );

  const loadStoredOptions = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as Partial<TransactionOptions>;
    } catch (error) {
      console.error("Erro ao carregar opções salvas:", error);
      return null;
    }
  }, [storageKey]);

  useEffect(() => {
    const stored = loadStoredOptions();
    setOptions(mergeOptions(DEFAULT_OPTIONS, stored));
  }, [loadStoredOptions]);

  const saveOptions = useCallback(
    (next: TransactionOptions) => {
      if (typeof window === "undefined") {
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey]
  );

  const generateId = () => crypto.randomUUID();

  const createEmptyRow = useCallback(
    (): TransactionRow => ({
      id: generateId(),
      data: "",
      descricao: "",
      brl: "",
      responsavel: defaultResponsavel,
      categoria: "Outros",
      tipo: "Pontual",
      tagDespesa: "",
      incluirRateio: true,
      parcelado: false,
    }),
    [defaultResponsavel]
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, [createEmptyRow]);

  const updateRow = useCallback(
    (id: string, field: keyof TransactionRow, value: string | boolean) => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
      setErrorsByCell((prev) => {
        if (!prev[id]?.[field]) {
          return prev;
        }
        const { [field]: _removed, ...restFields } = prev[id] ?? {};
        const next = { ...prev };
        if (Object.keys(restFields).length === 0) {
          delete next[id];
        } else {
          next[id] = restFields;
        }
        return next;
      });
    },
    []
  );

  const selectRow = useCallback((id: string, selected: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedRows(new Set(rows.map((r) => r.id)));
      } else {
        setSelectedRows(new Set());
      }
    },
    [rows]
  );

  const deleteSelected = useCallback(() => {
    setRows((prev) => prev.filter((r) => !selectedRows.has(r.id)));
    setSelectedRows(new Set());
    setErrorsByCell({});
  }, [selectedRows]);

  const clearAll = useCallback(() => {
    setRows([]);
    setSelectedRows(new Set());
    setErrorsByCell({});
  }, []);

  const appendRows = useCallback((nextRows: TransactionRow[], nextErrors: ErrorsByCell) => {
    if (nextRows.length === 0) {
      return;
    }
    setRows((prev) => [...prev, ...nextRows]);
    setErrorsByCell((prev) => ({ ...prev, ...nextErrors }));
    setSelectedRows(new Set());
  }, []);

  const registerOption = useCallback(
    (field: OptionField, value: string) => {
      const normalized = normalizeTextOption(value);
      if (!normalized) {
        return;
      }

      const key =
        field === "categoria" ? "categories" : field === "tipo" ? "types" : "tags";

      setOptions((prev) => {
        const exists = prev[key].some(
          (option) => option.toLowerCase() === normalized.toLowerCase()
        );
        if (exists) {
          return prev;
        }
        const next = {
          ...prev,
          [key]: [...prev[key], normalized],
        };
        saveOptions(next);
        return next;
      });
    },
    [saveOptions]
  );

  const formatBrlOnBlur = useCallback(
    (id: string) => {
      const row = rows.find((item) => item.id === id);
      if (!row) {
        return;
      }
      const formatted = formatBRLDisplay(row.brl);
      if (formatted !== row.brl) {
        updateRow(id, "brl", formatted);
      }
    },
    [rows, updateRow]
  );

  const validate = useCallback((): ValidationResult => {
    const nextErrors: ErrorsByCell = {};
    const errorList: string[] = [];

    rows.forEach((row, index) => {
      const addError = (field: keyof TransactionRow, message: string) => {
        if (!nextErrors[row.id]) {
          nextErrors[row.id] = {};
        }
        nextErrors[row.id][field] = message;
        errorList.push(`Linha ${index + 1}: campo '${field}' ${message}`);
      };

      if (!isValidDatePtBr(row.data)) {
        addError("data", "inválido");
      }
      if (!row.descricao.trim()) {
        addError("descricao", "obrigatório");
      }
      const parsedBrl = parseBRL(row.brl);
      if (parsedBrl === null) {
        addError("brl", "inválido");
      }
      if (!row.responsavel.trim()) {
        addError("responsavel", "obrigatório");
      }
      if (!row.categoria.trim()) {
        addError("categoria", "obrigatório");
      }
      if (!row.tipo.trim()) {
        addError("tipo", "obrigatório");
      }
      if (typeof row.incluirRateio !== "boolean") {
        addError("incluirRateio", "obrigatório");
      }
      if (typeof row.parcelado !== "boolean") {
        addError("parcelado", "obrigatório");
      }
    });

    setErrorsByCell(nextErrors);

    return {
      valid: errorList.length === 0,
      errorsByCell: nextErrors,
      errorList,
      totalBrl: sumBRL(rows.map((row) => row.brl)),
      validCount: rows.length,
    };
  }, [rows]);

  return {
    rows,
    selectedRows,
    errorsByCell,
    options,
    addRow,
    updateRow,
    selectRow,
    selectAll,
    deleteSelected,
    clearAll,
    appendRows,
    registerOption,
    formatBrlOnBlur,
    validate,
  };
}
