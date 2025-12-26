import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Transaction, TransactionType, ExpenseCategory, IncomeCategory, RecurrenceType } from '@/types/finance';
import { Plus, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTransactionDialogProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  person1Name: string;
  person2Name: string;
  expenseCategoryLabels: Record<string, string>;
  incomeCategoryLabels: Record<string, string>;
  onAddExpenseCategory: (key: string, label: string) => void;
  onAddIncomeCategory: (key: string, label: string) => void;
}

export function AddTransactionDialog({ 
  onAdd, 
  person1Name, 
  person2Name,
  expenseCategoryLabels,
  incomeCategoryLabels,
  onAddExpenseCategory,
  onAddIncomeCategory,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('outros');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState<'pessoa1' | 'pessoa2'>('pessoa1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('pontual');
  const [includeInSplit, setIncludeInSplit] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !category) return;

    onAdd({
      type,
      category,
      description,
      amount: parseFloat(amount),
      person,
      date: new Date(date),
      recurrence,
      includeInSplit: type === 'expense' ? includeInSplit : false,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setCategory('outros');
    setRecurrence('pontual');
    setIncludeInSplit(true);
    setOpen(false);
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const key = newCategoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    
    if (type === 'expense') {
      onAddExpenseCategory(key, newCategoryName);
    } else {
      onAddIncomeCategory(key, newCategoryName);
    }
    
    setCategory(key);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const expenseCategories = Object.entries(expenseCategoryLabels);
  const incomeCategories = Object.entries(incomeCategoryLabels);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary border-0 text-primary-foreground shadow-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Pessoa</Label>
              <Select value={person} onValueChange={(value) => setPerson(value as 'pessoa1' | 'pessoa2')}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa1">{person1Name}</SelectItem>
                  <SelectItem value="pessoa2">{person2Name}</SelectItem>
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
          </div>

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
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
