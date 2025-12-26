import { MonthlyComparison, CategoryChange } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

interface MonthlyComparisonTabProps {
  monthlyData: MonthlyComparison[];
  biggestIncrease: CategoryChange | null;
  expenseCategoryLabels: Record<string, string>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--expense))',
  'hsl(var(--income))',
  'hsl(var(--warning))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
  '#FFBB28',
];

export function MonthlyComparisonTab({ monthlyData, biggestIncrease, expenseCategoryLabels }: MonthlyComparisonTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Get all unique categories across all months
  const allCategories = Array.from(
    new Set(monthlyData.flatMap(m => Object.keys(m.categories)))
  );

  // Prepare data for the bar chart
  const chartData = monthlyData.map(month => ({
    month: month.month,
    ...month.categories,
    total: month.total,
  }));

  // Prepare category totals table data
  const categoryTotals = allCategories.map(category => {
    const totals: Record<string, number> = {};
    monthlyData.forEach(month => {
      totals[month.month] = month.categories[category] || 0;
    });
    return {
      category,
      label: expenseCategoryLabels[category] || category,
      ...totals,
    };
  });

  return (
    <div className="space-y-6">
      {/* Biggest Increase Alert */}
      {biggestIncrease && biggestIncrease.change > 0 && (
        <Card className="bg-expense/10 border-expense/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-expense/20 rounded-lg p-2">
                <AlertTriangle className="h-5 w-5 text-expense" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Maior Aumento de Despesa
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A categoria <span className="font-medium text-foreground">{biggestIncrease.label}</span> teve 
                  o maior aumento entre {biggestIncrease.previousMonth} e {biggestIncrease.currentMonth}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Antes: </span>
                    <span className="font-medium">{formatCurrency(biggestIncrease.previousValue)}</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-expense" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Depois: </span>
                    <span className="font-medium text-expense">{formatCurrency(biggestIncrease.currentValue)}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-expense/20 text-expense rounded-full text-xs font-medium">
                    +{formatCurrency(biggestIncrease.change)} ({biggestIncrease.changePercentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Despesas por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Adicione despesas para ver o comparativo mensal
            </p>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      expenseCategoryLabels[name] || name,
                    ]}
                  />
                  <Legend 
                    formatter={(value) => expenseCategoryLabels[value] || value}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  {allCategories.slice(0, 6).map((category, index) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      fill={COLORS[index % COLORS.length]}
                      stackId="a"
                      radius={index === allCategories.slice(0, 6).length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Totals Table */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Totais por Categoria e Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTotals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma despesa registrada
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Categoria</th>
                    {monthlyData.map(month => (
                      <th key={month.monthKey} className="text-right py-3 px-2 font-semibold text-foreground">
                        {month.month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryTotals.map((row, index) => (
                    <tr 
                      key={row.category} 
                      className={index % 2 === 0 ? 'bg-muted/30' : ''}
                    >
                      <td className="py-2.5 px-2 font-medium text-foreground">{row.label}</td>
                      {monthlyData.map(month => (
                        <td key={month.monthKey} className="text-right py-2.5 px-2 text-muted-foreground">
                          {(row as Record<string, number | string>)[month.month] 
                            ? formatCurrency((row as Record<string, number | string>)[month.month] as number)
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-border font-semibold">
                    <td className="py-2.5 px-2 text-foreground">Total</td>
                    {monthlyData.map(month => (
                      <td key={month.monthKey} className="text-right py-2.5 px-2 text-expense">
                        {formatCurrency(month.total)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
