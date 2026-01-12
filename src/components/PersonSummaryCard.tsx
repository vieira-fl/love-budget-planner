import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonSummaryCardProps {
  personName: string;
  income: number;
  expenses: number;
  variant: 'person1' | 'person2';
}

export function PersonSummaryCard({ personName, income, expenses, variant }: PersonSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const balance = income - expenses;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

  return (
    <Card className={cn(
      "bg-card card-shadow",
      variant === 'person1' ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-secondary'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className={cn(
            "h-5 w-5",
            variant === 'person1' ? 'text-primary' : 'text-secondary-foreground'
          )} />
          {personName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-income" />
              <span className="text-xs">Receita</span>
            </div>
            <p className="text-lg font-bold text-income">{formatCurrency(income)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-expense" />
              <span className="text-xs">Despesas</span>
            </div>
            <p className="text-lg font-bold text-expense">{formatCurrency(expenses)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wallet className="h-3 w-3 text-balance" />
              <span className="text-xs">Saldo</span>
            </div>
            <p className="text-lg font-bold text-balance">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Comprometimento da receita</span>
            <span className={cn(
              "text-sm font-semibold",
              expenseRatio > 80 ? 'text-expense' : expenseRatio > 50 ? 'text-warning' : 'text-income'
            )}>
              {expenseRatio.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                expenseRatio > 80 ? 'bg-expense' : expenseRatio > 50 ? 'bg-warning' : 'bg-income'
              )}
              style={{ width: `${Math.min(expenseRatio, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
