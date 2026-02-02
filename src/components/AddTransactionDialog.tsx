import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Transaction, TransactionType, ExpenseCategory, IncomeCategory, RecurrenceType, PaymentMethod, PAYMENT_METHODS, normalizeCategoryKey } from '@/types/finance';
import { Plus, PlusCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/date';
import { format } from 'date-fns';

interface AddTransactionDialogProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onAddMultiple?: (transactions: Omit<Transaction, 'id'>[]) => void;
  username: string;
  expenseCategoryLabels: Record<string, string>;
  incomeCategoryLabels: Record<string, string>;
  onAddExpenseCategory: (key: string, label: string) => void;
  onAddIncomeCategory: (key: string, label: string) => void;
}

const monthLabels = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

export function AddTransactionDialog({ 
  onAdd,
  onAddMultiple,
  username,
  expenseCategoryLabels,
  incomeCategoryLabels,
  onAddExpenseCategory,
  onAddIncomeCategory,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('outros');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recurrence, setRecurrence] = useState<RecurrenceType>('pontual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cartão');
  const [includeInSplit, setIncludeInSplit] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Multi-month functionality
  const [enableMultiMonth, setEnableMultiMonth] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [multiMonthYear, setMultiMonthYear] = useState(new Date().getFullYear());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !category) return;

    // Parse date string in local timezone to avoid UTC offset issues
    const parsedDate = parseLocalDate(date);

    const baseTransaction: Omit<Transaction, 'id'> = {
      type,
      category,
      description,
      tag: tag.trim() || undefined,
      amount: parseFloat(amount),
      person: username,
      date: parsedDate,
      recurrence,
      includeInSplit: type === 'expense' ? includeInSplit : false,
      paymentMethod: type === 'expense' ? paymentMethod : undefined,
    };

    if (enableMultiMonth && selectedMonths.length > 0 && onAddMultiple) {
      // Create transactions for each selected month
      const dayOfMonth = parsedDate.getDate();

      const transactions: Omit<Transaction, 'id'>[] = selectedMonths.map((month) => {
        // Get the last day of the target month
        const targetDate = new Date(multiMonthYear, month + 1, 0);
        const lastDayOfMonth = targetDate.getDate();

        // Use the minimum of the original day and the last day of the month
        const adjustedDay = Math.min(dayOfMonth, lastDayOfMonth);

        return {
          ...baseTransaction,
          date: new Date(multiMonthYear, month, adjustedDay),
        };
      });

      onAddMultiple(transactions);
    } else {
      onAdd(baseTransaction);
    }

    // Reset form
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setDescription('');
    setTag('');
    setAmount('');
    setCategory('outros');
    setRecurrence('pontual');
    setPaymentMethod('Cartão');
    setIncludeInSplit(true);
    setEnableMultiMonth(false);
    setSelectedMonths([]);
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const key = normalizeCategoryKey(newCategoryName, type);
    
    if (type === 'expense') {
      onAddExpenseCategory(key, newCategoryName);
    } else {
      onAddIncomeCategory(key, newCategoryName);
    }
    
    setCategory(key);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const selectAllMonths = () => {
    setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  };

  const clearAllMonths = () => {
    setSelectedMonths([]);
  };

  const expenseCategories = Object.entries(expenseCategoryLabels);
  const incomeCategories = Object.entries(incomeCategoryLabels);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary border-0 text-primary-foreground shadow-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('salario');
                setTag('');
              }}
              className={cn(
                'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                type === 'income'
                  ? 'bg-income text-income-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('outros');
              }}
              className={cn(
                'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                type === 'expense'
                  ? 'bg-expense text-expense-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Despesa
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="bg-background border-input"
              required
            />
          </div>

          {type === 'expense' && (
            <div className="space-y-2">
              <Label htmlFor="tag" className="text-foreground">Tag da despesa</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ex: Viagem Paris, Presente, Reforma..."
                className="bg-background border-input"
              />
              <p className="text-xs text-muted-foreground">
                Use tags para identificar rapidamente despesas específicas dentro da categoria.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="bg-background border-input"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Categoria</Label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <PlusCircle className="h-3 w-3" />
                Nova categoria
              </button>
            </div>
            
            {showNewCategory ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da categoria"
                  className="bg-background border-input flex-1"
                />
                <Button type="button" size="sm" onClick={handleAddNewCategory}>
                  Adicionar
                </Button>
              </div>
            ) : (
              <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory | IncomeCategory)}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'expense'
                    ? expenseCategories.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))
                    : incomeCategories.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Tipo</Label>
            <Select value={recurrence} onValueChange={(value) => setRecurrence(value as RecurrenceType)}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pontual">Pontual</SelectItem>
                <SelectItem value="recorrente">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'expense' && (
            <div className="space-y-2">
              <Label className="text-foreground">Forma de PGTO</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border-input"
              required
            />
          </div>

          {/* Multi-month option */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <Label htmlFor="multi-month" className="text-foreground text-sm font-medium cursor-pointer">
                  Replicar em múltiplos meses
                </Label>
              </div>
              <Switch
                id="multi-month"
                checked={enableMultiMonth}
                onCheckedChange={setEnableMultiMonth}
              />
            </div>
            
            {enableMultiMonth && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground text-sm">Ano</Label>
                  <Select value={multiMonthYear.toString()} onValueChange={(value) => setMultiMonthYear(parseInt(value))}>
                    <SelectTrigger className="w-24 bg-background border-input h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-foreground text-sm">Selecione os meses</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllMonths}
                      className="text-xs text-primary hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      type="button"
                      onClick={clearAllMonths}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {monthLabels.map(({ value, label }) => (
                    <label
                      key={value}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm',
                        selectedMonths.includes(value) 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-background hover:bg-muted border border-transparent'
                      )}
                    >
                      <Checkbox
                        checked={selectedMonths.includes(value)}
                        onCheckedChange={() => toggleMonth(value)}
                        className="h-4 w-4"
                      />
                      <span className={cn(
                        'text-xs',
                        selectedMonths.includes(value) ? 'text-primary font-medium' : 'text-foreground'
                      )}>
                        {label.slice(0, 3)}
                      </span>
                    </label>
                  ))}
                </div>
                
                {selectedMonths.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedMonths.length}{' '}
                    {selectedMonths.length === 1 ? 'mês selecionado' : 'meses selecionados'}. A transação será criada
                    no dia {parseLocalDate(date).getDate()} de cada mês.
                  </p>
                )}
              </div>
            )}
          </div>

          {type === 'expense' && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="include-split" className="text-foreground text-sm font-medium">
                  Incluir no rateio
                </Label>
                <p className="text-xs text-muted-foreground">
                  Incluir esta despesa no cálculo de divisão entre o casal
                </p>
              </div>
              <Switch
                id="include-split"
                checked={includeInSplit}
                onCheckedChange={setIncludeInSplit}
              />
            </div>
          )}

          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
            {enableMultiMonth && selectedMonths.length > 1 
              ? `Adicionar ${selectedMonths.length} transações`
              : 'Adicionar'
            }
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
