import { useState } from 'react';
import { Transaction, defaultExpenseCategoryLabels, defaultIncomeCategoryLabels } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Trash2, TrendingUp, TrendingDown, Repeat, Zap, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditTransactionDialog } from './EditTransactionDialog';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (transaction: Transaction) => void;
  person1Name: string;
  person2Name: string;
  expenseCategoryLabels: Record<string, string>;
  incomeCategoryLabels: Record<string, string>;
}

export function TransactionList({ 
  transactions, 
  onDelete, 
  onUpdate,
  person1Name, 
  person2Name,
  expenseCategoryLabels,
  incomeCategoryLabels,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  const getCategoryLabel = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      return incomeCategoryLabels[transaction.category] || defaultIncomeCategoryLabels[transaction.category] || transaction.category;
    }
    return expenseCategoryLabels[transaction.category] || defaultExpenseCategoryLabels[transaction.category] || transaction.category;
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleSave = (transaction: Transaction) => {
    onUpdate(transaction);
    setEditingTransaction(null);
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Transações Recentes</h2>
        </div>
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {sortedTransactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-slide-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'rounded-lg p-2.5',
                    transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                  )}
                >
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-income" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-expense" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    {transaction.recurrence === 'recorrente' ? (
                      <Repeat className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-warning" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {getCategoryLabel(transaction)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {transaction.person === 'pessoa1' ? person1Name : person2Name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className={cn(
                      'text-xs',
                      transaction.recurrence === 'recorrente' ? 'text-primary' : 'text-warning'
                    )}>
                      {transaction.recurrence === 'recorrente' ? 'Recorrente' : 'Pontual'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => handleEdit(transaction)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-expense hover:bg-expense/10"
                  onClick={() => onDelete(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma transação registrada ainda.
            </div>
          )}
        </div>
      </div>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
        person1Name={person1Name}
        person2Name={person2Name}
        expenseCategoryLabels={expenseCategoryLabels}
        incomeCategoryLabels={incomeCategoryLabels}
      />
    </>
  );
}
