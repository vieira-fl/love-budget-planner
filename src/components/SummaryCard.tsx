import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'income' | 'expense' | 'balance';
  className?: string;
}

export function SummaryCard({ title, value, icon: Icon, variant, className }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const isPositiveBalance = variant === 'balance' && value >= 0;
  const isNegativeBalance = variant === 'balance' && value < 0;

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
          <p
            className={cn(
              'text-2xl font-bold tracking-tight',
              variant === 'income' && 'text-income',
              variant === 'expense' && 'text-expense',
              isPositiveBalance && 'text-balance-positive',
              isNegativeBalance && 'text-balance-negative'
            )}
          >
            {formatCurrency(value)}
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg p-3',
            variant === 'income' && 'bg-income/10',
            variant === 'expense' && 'bg-expense/10',
            isPositiveBalance && 'bg-balance-positive/10',
            isNegativeBalance && 'bg-balance-negative/10'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              variant === 'income' && 'text-income',
              variant === 'expense' && 'text-expense',
              isPositiveBalance && 'text-balance-positive',
              isNegativeBalance && 'text-balance-negative'
            )}
          />
        </div>
      </div>
    </div>
  );
}
