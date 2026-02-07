import { SplitCalculation } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, PiggyBank, TrendingUp, Scale, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseSplitCardProps {
  splitCalculation: SplitCalculation;
  person1Name: string;
  person2Name: string;
}

export function ExpenseSplitCard({ splitCalculation, person1Name, person2Name }: ExpenseSplitCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const {
    person1IncomePercentage,
    person2IncomePercentage,
    person1SplitIncome,
    person2SplitIncome,
    totalSharedExpenses,
    person1IdealShare,
    person2IdealShare,
    person1ActualPaid,
    person2ActualPaid,
    person1ExpenseToIncomeRatio,
    person2ExpenseToIncomeRatio,
    settlement,
  } = splitCalculation;

  const totalSplitIncome = person1SplitIncome + person2SplitIncome;
  const fromPersonName = settlement.fromPerson === 'pessoa1' ? person1Name : person2Name;
  const toPersonName = settlement.toPerson === 'pessoa1' ? person1Name : person2Name;

  return (
    <Card className="bg-card card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Rateio de Despesas do Casal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base de Cálculo - Receitas e Despesas no Rateio */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Base de Cálculo do Rateio
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">{person1Name}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita no rateio:</span>
                  <span className="font-medium text-income">{formatCurrency(person1SplitIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Despesa no rateio:</span>
                  <span className="font-medium text-expense">{formatCurrency(person1ActualPaid)}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">{person2Name}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita no rateio:</span>
                  <span className="font-medium text-income">{formatCurrency(person2SplitIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Despesa no rateio:</span>
                  <span className="font-medium text-expense">{formatCurrency(person2ActualPaid)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total receita no rateio</p>
              <p className="text-base font-bold text-income">{formatCurrency(totalSplitIncome)}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total despesa no rateio</p>
              <p className="text-base font-bold text-expense">{formatCurrency(totalSharedExpenses)}</p>
            </div>
          </div>
        </div>

        {/* Income Contribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Contribuição na Receita
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">{person1Name}</p>
              <p className="text-xl font-bold text-primary">{person1IncomePercentage.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{person2Name}</p>
              <p className="text-xl font-bold text-foreground">{person2IncomePercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Ideal vs Actual */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Ideal vs Pagamento Real</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{person1Name}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ideal:</span>
                  <span className="font-medium">{formatCurrency(person1IdealShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagou:</span>
                  <span className={cn(
                    'font-medium',
                    person1ActualPaid > person1IdealShare ? 'text-expense' : 'text-income'
                  )}>
                    {formatCurrency(person1ActualPaid)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">% da receita:</span>
                  <span className="font-medium">{person1ExpenseToIncomeRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{person2Name}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ideal:</span>
                  <span className="font-medium">{formatCurrency(person2IdealShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagou:</span>
                  <span className={cn(
                    'font-medium',
                    person2ActualPaid > person2IdealShare ? 'text-expense' : 'text-income'
                  )}>
                    {formatCurrency(person2ActualPaid)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">% da receita:</span>
                  <span className="font-medium">{person2ExpenseToIncomeRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement */}
        {settlement.amount > 0.01 && settlement.fromPerson && settlement.toPerson && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <PiggyBank className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">{fromPersonName}</p>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 text-primary" />
                <p className="text-lg font-bold text-primary">{formatCurrency(settlement.amount)}</p>
              </div>
              <div className="text-center">
                <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">{toPersonName}</p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Para equalizar o percentual de despesas em relação à receita de cada um
            </p>
          </div>
        )}

        {settlement.amount <= 0.01 && (
          <div className="p-4 bg-income/10 border border-income/30 rounded-xl text-center">
            <p className="text-sm font-medium text-income">
              ✓ As despesas estão equilibradas!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cada pessoa está pagando proporcionalmente à sua receita
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
