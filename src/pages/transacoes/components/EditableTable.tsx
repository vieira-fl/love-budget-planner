import { TransactionRow, CATEGORIAS, TIPOS, TAGS, RowError } from "../types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface EditableTableProps {
  rows: TransactionRow[];
  selectedRows: Set<string>;
  errors: RowError[];
  responsaveis: string[];
  onRowChange: (id: string, field: keyof TransactionRow, value: string | boolean) => void;
  onSelectRow: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

export function EditableTable({
  rows,
  selectedRows,
  errors,
  responsaveis,
  onRowChange,
  onSelectRow,
  onSelectAll,
}: EditableTableProps) {
  const allSelected = rows.length > 0 && selectedRows.size === rows.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < rows.length;

  const hasError = (rowIndex: number, field: keyof TransactionRow) => {
    return errors.some((e) => e.rowIndex === rowIndex && e.field === field);
  };

  const errorClass = "border-destructive ring-1 ring-destructive";

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
            <TableHead className="min-w-[120px]">Data</TableHead>
            <TableHead className="min-w-[200px]">Descrição</TableHead>
            <TableHead className="min-w-[120px]">Valor (R$)</TableHead>
            <TableHead className="min-w-[150px]">Responsável</TableHead>
            <TableHead className="min-w-[150px]">Categoria</TableHead>
            <TableHead className="min-w-[140px]">Tipo</TableHead>
            <TableHead className="min-w-[130px]">Tag</TableHead>
            <TableHead className="w-[80px] text-center">Rateio</TableHead>
            <TableHead className="w-[80px] text-center">Parcelado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
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
                  onChange={(e) => onRowChange(row.id, "data", e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className={cn("h-8", hasError(index, "data") && errorClass)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.descricao}
                  onChange={(e) => onRowChange(row.id, "descricao", e.target.value)}
                  placeholder="Descrição"
                  className={cn("h-8", hasError(index, "descricao") && errorClass)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.brl}
                  onChange={(e) => onRowChange(row.id, "brl", e.target.value)}
                  placeholder="0,00"
                  className={cn("h-8", hasError(index, "brl") && errorClass)}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={row.responsavel}
                  onValueChange={(value) => onRowChange(row.id, "responsavel", value)}
                >
                  <SelectTrigger className={cn("h-8", hasError(index, "responsavel") && errorClass)}>
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
                  <SelectTrigger className={cn("h-8", hasError(index, "categoria") && errorClass)}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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
                  <SelectTrigger className={cn("h-8", hasError(index, "tipo") && errorClass)}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.tagDespesa || "_none_"}
                  onValueChange={(value) => onRowChange(row.id, "tagDespesa", value === "_none_" ? "" : value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">(Nenhuma)</SelectItem>
                    {TAGS.filter(t => t).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
