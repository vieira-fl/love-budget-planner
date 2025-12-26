import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, TransactionType, ExpenseCategory, IncomeCategory, expenseCategoryLabels, incomeCategoryLabels } from '@/types/finance';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTransactionDialogProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  person1Name: string;
  person2Name: string;
}

export function AddTransactionDialog({ onAdd, person1Name, person2Name }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('outros');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState<'pessoa1' | 'pessoa2'>('pessoa1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
    });

    // Reset form
    setDescription('');
    setAmount('');
    setCategory('outros');
    setOpen(false);
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
      <DialogContent className="sm:max-w-[425px] bg-card">
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

          <div className="grid grid-cols-2 gap-4">
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

          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
