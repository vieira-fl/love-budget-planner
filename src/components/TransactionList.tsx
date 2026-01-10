import { useState } from 'react';
import { Transaction, defaultExpenseCategoryLabels, defaultIncomeCategoryLabels } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Trash2, TrendingUp, TrendingDown, Repeat, Zap, Pencil, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditTransactionDialog } from './EditTransactionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (transaction: Transaction) => void;
  expenseCategoryLabels: Record<string, string>;
  incomeCategoryLabels: Record<string, string>;
}

export function TransactionList({ 
  transactions, 
  onDelete, 
  onUpdate,
  expenseCategoryLabels,
  incomeCategoryLabels,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

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
      return (incomeCategoryLabels?.[transaction.category]) || defaultIncomeCategoryLabels[transaction.category] || transaction.category;
    }
    return (expenseCategoryLabels?.[transaction.category]) || defaultExpenseCategoryLabels[transaction.category] || transaction.category;
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleSave = (transaction: Transaction) => {
    onUpdate(transaction);
    setEditingTransaction(null);
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      onDelete(transactionToDelete.id);
      setTransactionToDelete(null);
    }
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
                      {transaction.person}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className={cn(
                      'text-xs',
                      transaction.recurrence === 'recorrente' ? 'text-primary' : 'text-warning'
                    )}>
                      {transaction.recurrence === 'recorrente' ? 'Recorrente' : 'Pontual'}
                    </span>
                    {transaction.tag && <span className="text-xs text-muted-foreground">•</span>}
                    {transaction.tag && (
                      <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <TagIcon className="h-3 w-3" />
                        {transaction.tag}
                      </span>
                    )}
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
                  onClick={() => setTransactionToDelete(transaction)}
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
        expenseCategoryLabels={expenseCategoryLabels}
        incomeCategoryLabels={incomeCategoryLabels}
      />

      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a transação
              {transactionToDelete ? ` "${transactionToDelete.description}"` : ''}? Essa ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-expense text-expense-foreground hover:bg-expense/90" onClick={handleDeleteConfirm}>
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
