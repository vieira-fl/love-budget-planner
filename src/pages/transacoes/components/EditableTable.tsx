import { useState } from "react";
import { TransactionRow, ErrorsByCell, SortField, SortDirection } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDateInput, sanitizeBRLInput, parseBRL } from "../utils/tableEntryUtils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface EditableTableProps {
  rows: TransactionRow[];
  selectedRows: Set<string>;
  errorsByCell: ErrorsByCell;
  responsaveis: string[];
  categories: string[];
  types: string[];
  tags: string[];
  onRowChange: (id: string, field: keyof TransactionRow, value: string | boolean) => void;
  onSelectRow: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onOptionCommit: (field: "categoria" | "tipo" | "tagDespesa", value: string) => void;
  onBrlBlur: (id: string) => void;
}

export function EditableTable({
  rows,
  selectedRows,
  errorsByCell,
  responsaveis,
  categories,
  types,
  tags,
  onRowChange,
  onSelectRow,
  onSelectAll,
  onOptionCommit,
  onBrlBlur,
}: EditableTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const allSelected = rows.length > 0 && selectedRows.size === rows.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < rows.length;

  const getError = (rowId: string, field: keyof TransactionRow) => {
    return errorsByCell[rowId]?.[field];
  };

  const errorClass = "border-destructive ring-1 ring-destructive";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: string | number | boolean = a[sortField];
    let bVal: string | number | boolean = b[sortField];

    // Handle special cases
    if (sortField === 'brl') {
      aVal = parseBRL(a.brl) ?? 0;
      bVal = parseBRL(b.brl) ?? 0;
    } else if (sortField === 'data') {
      // Parse date dd/mm/yyyy to comparable format
      const parseDate = (d: string) => {
        const parts = d.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
        return 0;
      };
      aVal = parseDate(a.data);
      bVal = parseDate(b.data);
    } else if (typeof aVal === 'boolean') {
      aVal = aVal ? 1 : 0;
      bVal = bVal ? 1 : 0;
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none", className)}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  if (rows.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Nenhuma linha adicionada. Clique em "Adicionar linha" para começar.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <SortableHeader field="data" className="min-w-[120px]">Data</SortableHeader>
            <SortableHeader field="descricao" className="min-w-[200px]">Descrição</SortableHeader>
            <SortableHeader field="brl" className="min-w-[120px]">Valor (R$)</SortableHeader>
            <SortableHeader field="responsavel" className="min-w-[150px]">Responsável</SortableHeader>
            <SortableHeader field="categoria" className="min-w-[150px]">Categoria</SortableHeader>
            <SortableHeader field="tipo" className="min-w-[140px]">Tipo</SortableHeader>
            <SortableHeader field="tagDespesa" className="min-w-[130px]">Tag</SortableHeader>
            <SortableHeader field="incluirRateio" className="w-[80px] text-center">Rateio</SortableHeader>
            <SortableHeader field="parcelado" className="w-[80px] text-center">Parcelado</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row, index) => {
            const dataError = getError(row.id, "data");
            const descricaoError = getError(row.id, "descricao");
            const brlError = getError(row.id, "brl");
            const responsavelError = getError(row.id, "responsavel");
            const categoriaError = getError(row.id, "categoria");
            const tipoError = getError(row.id, "tipo");

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={(checked) => onSelectRow(row.id, !!checked)}
                    aria-label={`Selecionar linha ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.data}
                    onChange={(e) => onRowChange(row.id, "data", formatDateInput(e.target.value))}
                    placeholder="dd/mm/aaaa"
                    inputMode="numeric"
                    className={cn("h-8", dataError && errorClass)}
                    title={dataError}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.descricao}
                    onChange={(e) => onRowChange(row.id, "descricao", e.target.value)}
                    placeholder="Descrição"
                    className={cn("h-8", descricaoError && errorClass)}
                    title={descricaoError}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.brl}
                    onChange={(e) => onRowChange(row.id, "brl", sanitizeBRLInput(e.target.value))}
                    onBlur={() => onBrlBlur(row.id)}
                    placeholder="0,00"
                    inputMode="decimal"
                    className={cn("h-8", brlError && errorClass)}
                    title={brlError}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={row.responsavel}
                    onValueChange={(value) => onRowChange(row.id, "responsavel", value)}
                  >
                    <SelectTrigger className={cn("h-8", responsavelError && errorClass)}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.categoria}
                    onValueChange={(value) => onRowChange(row.id, "categoria", value)}
                  >
                    <SelectTrigger className={cn("h-8", categoriaError && errorClass)} title={categoriaError}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.tipo}
                    onValueChange={(value) => onRowChange(row.id, "tipo", value)}
                  >
                    <SelectTrigger className={cn("h-8", tipoError && errorClass)} title={tipoError}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pontual">Pontual</SelectItem>
                      <SelectItem value="Recorrente">Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.tagDespesa || ""}
                    onChange={(e) => onRowChange(row.id, "tagDespesa", e.target.value)}
                    onBlur={(e) => onOptionCommit("tagDespesa", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onOptionCommit("tagDespesa", e.currentTarget.value);
                      }
                    }}
                    list="table-entry-tags"
                    placeholder="Opcional"
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={row.incluirRateio}
                    onCheckedChange={(checked) => onRowChange(row.id, "incluirRateio", !!checked)}
                    aria-label="Incluir no rateio"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={row.parcelado}
                    onCheckedChange={(checked) => onRowChange(row.id, "parcelado", !!checked)}
                    aria-label="Parcelado"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <datalist id="table-entry-tags">
        {tags.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </div>
  );
}
