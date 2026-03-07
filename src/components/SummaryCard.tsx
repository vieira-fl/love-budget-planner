import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'income' | 'expense' | 'balance' | 'investment';
  className?: string;
}

export function SummaryCard({ title, value, icon: Icon, variant, className }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const colorMap = {
    income: 'text-income',
    expense: 'text-expense',
    balance: 'text-balance',
    investment: 'text-investment',
  };
  const bgMap = {
    income: 'bg-income/10',
    expense: 'bg-expense/10',
    balance: 'bg-balance/10',
    investment: 'bg-investment/10',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6 card-shadow transition-all duration-300 hover:card-shadow-lg animate-fade-in bg-card',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className={cn('text-2xl font-bold tracking-tight', colorMap[variant])}>
            {formatCurrency(value)}
          </p>
        </div>
        <div className={cn('rounded-lg p-3', bgMap[variant])}>
          <Icon className={cn('h-5 w-5', colorMap[variant])} />
        </div>
      </div>
    </div>
  );
}
