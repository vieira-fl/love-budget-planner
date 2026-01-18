import { useState, useCallback } from "react";
import { TransactionRow, RowError, ValidationResult } from "../types";

export function useTableEntry(defaultResponsavel: string) {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<RowError[]>([]);

  const generateId = () => crypto.randomUUID();

  const createEmptyRow = useCallback((): TransactionRow => ({
    id: generateId(),
    data: "",
    descricao: "",
    brl: "",
    responsavel: defaultResponsavel,
    categoria: "",
    tipo: "",
    tagDespesa: "",
    incluirRateio: true,
    parcelado: false,
  }), [defaultResponsavel]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, [createEmptyRow]);

  const updateRow = useCallback((id: string, field: keyof TransactionRow, value: string | boolean) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    // Clear errors for this field when edited
    setErrors((prev) => {
      const rowIndex = rows.findIndex((r) => r.id === id);
      return prev.filter((e) => !(e.rowIndex === rowIndex && e.field === field));
    });
  }, [rows]);

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

  const selectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(rows.map((r) => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [rows]);

  const deleteSelected = useCallback(() => {
    setRows((prev) => prev.filter((r) => !selectedRows.has(r.id)));
    setSelectedRows(new Set());
    setErrors([]);
  }, [selectedRows]);

  const clearAll = useCallback(() => {
    setRows([]);
    setSelectedRows(new Set());
    setErrors([]);
  }, []);

  const parseBrl = (value: string): number => {
    // Handle Brazilian format: 1.234,56 or 1234,56
    const normalized = value
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const validate = useCallback((): ValidationResult => {
    const newErrors: RowError[] = [];
    let totalBrl = 0;

    rows.forEach((row, index) => {
      // Required fields
      if (!row.data.trim()) {
        newErrors.push({ rowIndex: index, field: "data", message: "Campo obrigatório" });
      }
      if (!row.descricao.trim()) {
        newErrors.push({ rowIndex: index, field: "descricao", message: "Campo obrigatório" });
      }
      if (!row.brl.trim()) {
        newErrors.push({ rowIndex: index, field: "brl", message: "Campo obrigatório" });
      } else {
        const parsed = parseBrl(row.brl);
        if (parsed <= 0) {
          newErrors.push({ rowIndex: index, field: "brl", message: "Valor inválido" });
        } else {
          totalBrl += parsed;
        }
      }
      if (!row.responsavel) {
        newErrors.push({ rowIndex: index, field: "responsavel", message: "Campo obrigatório" });
      }
      if (!row.categoria) {
        newErrors.push({ rowIndex: index, field: "categoria", message: "Campo obrigatório" });
      }
      if (!row.tipo) {
        newErrors.push({ rowIndex: index, field: "tipo", message: "Campo obrigatório" });
      }
      // tagDespesa is optional, no validation needed
    });

    setErrors(newErrors);

    return {
      valid: newErrors.length === 0,
      errors: newErrors,
      totalBrl,
      validCount: rows.length,
    };
  }, [rows]);

  return {
    rows,
    selectedRows,
    errors,
    addRow,
    updateRow,
    selectRow,
    selectAll,
    deleteSelected,
    clearAll,
    validate,
  };
}
