import { Transaction, expenseCategoryLabels, incomeCategoryLabels } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  person1Name: string;
  person2Name: string;
}

export function TransactionList({ transactions, onDelete, person1Name, person2Name }: TransactionListProps) {
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
      return incomeCategoryLabels[transaction.category as keyof typeof incomeCategoryLabels];
    }
    return expenseCategoryLabels[transaction.category as keyof typeof expenseCategoryLabels];
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
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
                <p className="font-medium text-foreground">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {getCategoryLabel(transaction)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {transaction.person === 'pessoa1' ? person1Name : person2Name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
  );
}
