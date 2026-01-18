import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Transaction, RecurrenceType, normalizeCategoryKey } from '@/types/finance';
import { FileUp, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ImportExpensesDialogProps {
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
  username: string;
  expenseCategoryLabels: Record<string, string>;
}

interface ParsedResult {
  transactions: Omit<Transaction, 'id'>[];
  errors: string[];
}

const normalizeHeader = (value: string) =>
  value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['false', '0', 'nao', 'não', 'n'].includes(normalized)) return false;
  if (['true', '1', 'sim', 's'].includes(normalized)) return true;
  return defaultValue;
};

const parseRecurrence = (value?: string): RecurrenceType => {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'recorrente' ? 'recorrente' : 'pontual';
};

const parseLocalDate = (dateStr: string) => {
  const parts = dateStr
    .trim()
    .split(/[-/]/)
    .filter(Boolean);

  if (parts.length < 3) return new Date(NaN);

  const [p1, p2, p3] = parts.map(Number);
  if ([p1, p2, p3].some(Number.isNaN)) return new Date(NaN);

  const isYearFirst = parts[0].length === 4;
  const isYearLast = parts[2].length === 4 || parts[2].length === 2;

  let year = isYearFirst ? p1 : isYearLast ? p3 : p3;
  const month = isYearFirst ? p2 : p2;
  const day = isYearFirst ? p3 : p1;

  if (year < 100) {
    year = 2000 + year;
  }

  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  const isValidDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === (month ?? 1) - 1 &&
    parsed.getDate() === (day ?? 1);

  return isValidDate ? parsed : new Date(NaN);
};

const detectDelimiter = (lines: string[]) => {
  const delimiters: Array<'\t' | ';' | ','> = ['\t', ';', ','];

  const { delimiter } = lines.slice(0, 5).reduce(
    (best, line) => {
      delimiters.forEach(candidate => {
        const score = line.split(candidate).length - 1;

        if (score > best.score) {
          best = { delimiter: candidate, score };
        }
      });
      return best;
    },
    { delimiter: ',' as '\t' | ';' | ',', score: 0 }
  );

  return delimiter;
};

const parseAmount = (value: string) => parseFloat(value.replace(/\./g, '').replace(',', '.'));

export function ImportExpensesDialog({
  onImport,
  username,
  expenseCategoryLabels,
}: ImportExpensesDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptedCategories = useMemo(
    () => Object.values(expenseCategoryLabels).join(', '),
    [expenseCategoryLabels]
  );

  const parseCsv = (content: string): ParsedResult => {
    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new Error('O arquivo CSV está vazio.');
    }

    const delimiter = detectDelimiter(lines);

    const headers = lines.shift()!
      .split(delimiter)
      .map(normalizeHeader);

    const getValue = (row: string[], key: string) => {
      const index = headers.indexOf(key);
      return index >= 0 ? row[index] : undefined;
    };

    const transactions: Omit<Transaction, 'id'>[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const row = line.split(delimiter);
      const description = getValue(row, 'descricao') ?? getValue(row, 'descricao_da_despesa');
      const amountValue = getValue(row, 'valor') ?? getValue(row, 'valor_da_despesa');
      const dateValue = getValue(row, 'data');

      if (!description || !amountValue || !dateValue) {
        errors.push(`Linha ${index + 2}: dados obrigatórios ausentes.`);
        return;
      }

      const amount = parseAmount(amountValue);
      if (Number.isNaN(amount)) {
        errors.push(`Linha ${index + 2}: valor "${amountValue}" inválido.`);
        return;
      }

      const date = parseLocalDate(dateValue);
      if (Number.isNaN(date.getTime())) {
        errors.push(`Linha ${index + 2}: data "${dateValue}" inválida.`);
        return;
      }

      const category = normalizeCategoryKey(
        getValue(row, 'categoria') || 'outros',
        'expense'
      );
      const recurrence = parseRecurrence(getValue(row, 'recorrencia'));
      const includeInSplit = parseBoolean(getValue(row, 'incluir_no_rateio'), true);

      transactions.push({
        type: 'expense',
        category,
        description,
        amount,
        person: username,
        date,
        recurrence,
        includeInSplit,
      });
    });

    return { transactions, errors };
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setLastResult(null);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = String(e.target?.result || '');
        const result = parseCsv(content);

        if (result.transactions.length === 0) {
          throw new Error('Nenhuma despesa válida encontrada no arquivo.');
        }

        onImport(result.transactions);
        setLastResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível processar o arquivo.');
      } finally {
        setIsProcessing(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setError('Não foi possível ler o arquivo selecionado.');
      setIsProcessing(false);
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleClose = (openState: boolean) => {
    setOpen(openState);
    if (!openState) {
      setError(null);
      setLastResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-dashed border-primary/50 text-primary hover:text-primary"
        >
          <FileUp className="h-4 w-4" />
          + Arquivo de Despesas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Importar Despesas via CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Formato esperado</AlertTitle>
            <AlertDescription className="space-y-1 text-sm text-muted-foreground">
              <p>Inclua as colunas: <strong>descricao</strong>, <strong>valor</strong>, <strong>categoria</strong>, <strong>data</strong>, <strong>recorrencia</strong>, <strong>incluir_no_rateio</strong>.</p>
              <p>Use datas no formato AAAA-MM-DD ou DD/MM/AA(AA) e valores numéricos com vírgula ou ponto.</p>
              <p>O arquivo pode ser separado por vírgula, ponto e vírgula ou tabulação.</p>
              <p>Todas as despesas serão atribuídas ao usuário logado: <strong>{username}</strong>.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-foreground">Arquivo CSV</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              disabled={isProcessing}
              onChange={handleFile}
              className="bg-background border-input cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Categorias conhecidas: {acceptedCategories}. Deixe vazio para usar "Outros".
            </p>
          </div>

          {lastResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {lastResult.transactions.length} despesas importadas com sucesso.
              </div>
              {lastResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Linhas ignoradas</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {lastResult.errors.map(message => (
                      <p key={message} className="text-sm">{message}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Feche esta janela para selecionar outro arquivo ou concluir a importação.
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao importar</AlertTitle>
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
