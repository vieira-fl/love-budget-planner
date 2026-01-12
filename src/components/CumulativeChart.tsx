import { useMemo, useState } from 'react';
import { Transaction } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface CumulativeChartProps {
  transactions: Transaction[];
}

interface CumulativeDataPoint {
  label: string;
  dateKey: string;
  income: number;
  expenses: number;
  balance: number;
  cumulativeIncome: number;
  cumulativeExpenses: number;
  cumulativeBalance: number;
}

export function CumulativeChart({ transactions }: CumulativeChartProps) {
  const [xAxisUnit, setXAxisUnit] = useState<'daily' | 'monthly'>('daily');

  const dailyData = useMemo((): CumulativeDataPoint[] => {
    if (transactions.length === 0) return [];

    // Group transactions by date
    const byDate = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      const existing = byDate.get(dateKey) || { income: 0, expenses: 0 };
      
      if (t.type === 'income') {
        existing.income += t.amount;
      } else {
        existing.expenses += t.amount;
      }
      
      byDate.set(dateKey, existing);
    });

    // Sort dates and calculate cumulative values
    const sortedDates = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;

    return sortedDates.map(([dateKey, values]) => {
      cumulativeIncome += values.income;
      cumulativeExpenses += values.expenses;
      const cumulativeBalance = cumulativeIncome - cumulativeExpenses;

      return {
        label: format(new Date(dateKey), 'dd/MM', { locale: ptBR }),
        dateKey,
        income: values.income,
        expenses: values.expenses,
        balance: values.income - values.expenses,
        cumulativeIncome,
        cumulativeExpenses,
        cumulativeBalance,
      };
    });
  }, [transactions]);

  const monthlyData = useMemo((): CumulativeDataPoint[] => {
    if (transactions.length === 0) return [];

    const byMonth = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const monthKey = format(new Date(t.date), 'yyyy-MM');
      const existing = byMonth.get(monthKey) || { income: 0, expenses: 0 };

      if (t.type === 'income') {
        existing.income += t.amount;
      } else {
        existing.expenses += t.amount;
      }

      byMonth.set(monthKey, existing);
    });

    const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;

    return sortedMonths.map(([monthKey, values]) => {
      cumulativeIncome += values.income;
      cumulativeExpenses += values.expenses;
      const cumulativeBalance = cumulativeIncome - cumulativeExpenses;

      const monthDate = new Date(`${monthKey}-01`);

      return {
        label: format(monthDate, 'MMM/yy', { locale: ptBR }),
        dateKey: monthKey,
        income: values.income,
        expenses: values.expenses,
        balance: values.income - values.expenses,
        cumulativeIncome,
        cumulativeExpenses,
        cumulativeBalance,
      };
    });
  }, [transactions]);

  const chartData = xAxisUnit === 'daily' ? dailyData : monthlyData;

  // Always use blue for balance
  const balanceColor = 'hsl(var(--balance))';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `R$${(value / 1000).toFixed(0)}k`;
    }
    return `R$${value}`;
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Acumulada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Adicione transações para ver a evolução acumulada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card card-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Acumulada no Período
          </CardTitle>
          <ToggleGroup
            type="single"
            value={xAxisUnit}
            onValueChange={value => value && setXAxisUnit(value as 'daily' | 'monthly')}
            variant="outline"
            size="sm"
            aria-label="Selecionar unidade do eixo X"
          >
            <ToggleGroupItem value="daily" aria-label="Exibir por dia">
              Dias
            </ToggleGroupItem>
            <ToggleGroupItem value="monthly" aria-label="Exibir por mês">
              Meses
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    cumulativeIncome: 'Receitas Acumuladas',
                    cumulativeExpenses: 'Despesas Acumuladas',
                    cumulativeBalance: 'Saldo Acumulado',
                  };
                  return [formatCurrency(value), labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    cumulativeIncome: 'Receitas',
                    cumulativeExpenses: 'Despesas',
                    cumulativeBalance: 'Saldo',
                  };
                  return labels[value] || value;
                }}
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeIncome"
                stroke="hsl(var(--income))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--income))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeExpenses"
                stroke="hsl(var(--expense))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--expense))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeBalance"
                stroke={balanceColor}
                strokeWidth={3}
                dot={{ fill: balanceColor, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
