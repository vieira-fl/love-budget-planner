import { CategoryAnalysis } from '@/types/finance';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';

interface CategoryAnalysisCardProps {
  analysis: CategoryAnalysis;
  index: number;
}

export function CategoryAnalysisCard({ analysis, index }: CategoryAnalysisCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getStatusInfo = (status: 'low' | 'medium' | 'high') => {
    switch (status) {
      case 'low':
        return {
          icon: TrendingDown,
          text: 'Saudável',
          bgColor: 'bg-success/10',
          textColor: 'text-success',
          barColor: 'bg-success',
        };
      case 'medium':
        return {
          icon: Minus,
          text: 'Atenção',
          bgColor: 'bg-warning/10',
          textColor: 'text-warning',
          barColor: 'bg-warning',
        };
      case 'high':
        return {
          icon: AlertTriangle,
          text: 'Potencial de economia',
          bgColor: 'bg-expense/10',
          textColor: 'text-expense',
          barColor: 'bg-expense',
        };
    }
  };

  const statusInfo = getStatusInfo(analysis.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className="bg-card rounded-xl p-5 card-shadow animate-fade-in transition-all duration-300 hover:card-shadow-lg"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{analysis.label}</h3>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(analysis.total)}
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            statusInfo.bgColor,
            statusInfo.textColor
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {statusInfo.text}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">% da receita</span>
          <span className={cn('font-semibold', statusInfo.textColor)}>
            {analysis.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', statusInfo.barColor)}
            style={{ width: `${Math.min(analysis.percentage * 2, 100)}%` }}
          />
        </div>
      </div>

      {analysis.status === 'high' && (
        <p className="mt-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          💡 Este gasto está acima do recomendado. Considere revisar assinaturas ou buscar alternativas mais econômicas.
        </p>
      )}
    </div>
  );
}
