import { Transaction } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Repeat, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Top10ExpensesProps {
  expenses: Transaction[];
  expenseCategoryLabels: Record<string, string>;
  person1Name: string;
  person2Name: string;
}

export function Top10Expenses({ expenses, expenseCategoryLabels, person1Name, person2Name }: Top10ExpensesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className="bg-card card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top 10 Maiores Despesas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma despesa registrada
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense, index) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`text-lg font-bold w-6 text-center ${getMedalColor(index)}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {expense.description}
                    </span>
                    {expense.recurrence === 'recorrente' ? (
                      <Repeat className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{expenseCategoryLabels[expense.category] || expense.category}</span>
                    <span>•</span>
                    <span>{expense.person === 'pessoa1' ? person1Name : person2Name}</span>
                    <span>•</span>
                    <span>{format(new Date(expense.date), 'dd/MM/yy', { locale: ptBR })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-expense">
                    {formatCurrency(expense.amount)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={expense.recurrence === 'recorrente' 
                      ? 'text-primary border-primary/30 text-xs' 
                      : 'text-warning border-warning/30 text-xs'
                    }
                  >
                    {expense.recurrence === 'recorrente' ? 'Recorrente' : 'Pontual'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
