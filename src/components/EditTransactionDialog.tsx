import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Transaction, TransactionType, ExpenseCategory, IncomeCategory, RecurrenceType } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Transaction) => void;
  expenseCategoryLabels: Record<string, string>;
  incomeCategoryLabels: Record<string, string>;
}

export function EditTransactionDialog({ 
  transaction,
  open,
  onOpenChange,
  onSave, 
  expenseCategoryLabels,
  incomeCategoryLabels,
}: EditTransactionDialogProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('outros');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('pontual');
  const [includeInSplit, setIncludeInSplit] = useState(true);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategory(transaction.category);
      setDescription(transaction.description);
      setTag(transaction.tag || '');
      setAmount(transaction.amount.toString());
      setDate(format(new Date(transaction.date), 'yyyy-MM-dd'));
      setRecurrence(transaction.recurrence);
      setIncludeInSplit(transaction.includeInSplit);
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction || !description || !amount || !category) return;

    onSave({
      ...transaction,
      type,
      category,
      description,
      tag: tag.trim() || undefined,
      amount: parseFloat(amount),
      date: new Date(date),
      recurrence,
      includeInSplit: type === 'expense' ? includeInSplit : false,
    });

    onOpenChange(false);
  };

  const expenseCategories = Object.entries(expenseCategoryLabels);
  const incomeCategories = Object.entries(incomeCategoryLabels);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (type !== 'income') setCategory('salario');
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
                if (type !== 'expense') setCategory('outros');
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
            <Label htmlFor="edit-description" className="text-foreground">Descrição</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="bg-background border-input"
              required
            />
          </div>

          {type === 'expense' && (
            <div className="space-y-2">
              <Label htmlFor="edit-tag" className="text-foreground">Tag da despesa</Label>
              <Input
                id="edit-tag"
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
            <Label htmlFor="edit-amount" className="text-foreground">Valor (R$)</Label>
            <Input
              id="edit-amount"
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
            <Label className="text-foreground">Categoria</Label>
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

          <div className="space-y-2">
            <Label htmlFor="edit-date" className="text-foreground">Data</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border-input"
              required
            />
          </div>

          {type === 'expense' && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="edit-include-split" className="text-foreground text-sm font-medium">
                  Incluir no rateio
                </Label>
                <p className="text-xs text-muted-foreground">
                  Incluir esta despesa no cálculo de divisão entre o casal
                </p>
              </div>
              <Switch
                id="edit-include-split"
                checked={includeInSplit}
                onCheckedChange={setIncludeInSplit}
              />
            </div>
          )}

          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
