import { MonthlyComparison, CategoryChange } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Minus } from 'lucide-react';

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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get all unique categories across all months
  const allCategories = Array.from(
    new Set(monthlyData.flatMap(m => Object.keys(m.categories)))
  );

  // Prepare data for the bar chart with percentages
  const chartData = monthlyData.map(month => {
    const dataPoint: Record<string, number | string> = {
      month: month.month,
      total: month.total,
    };
    
    // Add category values and percentages
    allCategories.forEach(category => {
      const value = month.categories[category] || 0;
      const percentage = month.total > 0 ? (value / month.total) * 100 : 0;
      dataPoint[category] = value;
      dataPoint[`${category}_pct`] = percentage;
    });
    
    return dataPoint;
  });

  // Prepare category totals table data with percentages and variations
  const categoryTotals = allCategories.map(category => {
    const totals: Record<string, number | string> = {};
    const percentages: Record<string, number> = {};
    const variations: Record<string, { value: number; type: 'up' | 'down' | 'same' }> = {};
    
    monthlyData.forEach((month, index) => {
      const value = month.categories[category] || 0;
      const percentage = month.total > 0 ? (value / month.total) * 100 : 0;
      totals[month.month] = value;
      percentages[`${month.month}_pct`] = percentage;
      
      // Calculate variation from previous month
      if (index > 0) {
        const prevMonth = monthlyData[index - 1];
        const prevValue = prevMonth.categories[category] || 0;
        if (prevValue > 0) {
          const variationPct = ((value - prevValue) / prevValue) * 100;
          variations[`${month.month}_var`] = {
            value: variationPct,
            type: variationPct > 0 ? 'up' : variationPct < 0 ? 'down' : 'same',
          };
        } else if (value > 0) {
          variations[`${month.month}_var`] = { value: 100, type: 'up' };
        } else {
          variations[`${month.month}_var`] = { value: 0, type: 'same' };
        }
      }
    });
    
    return {
      category,
      label: expenseCategoryLabels[category] || category,
      ...totals,
      ...percentages,
      ...variations,
    };
  });

  // Calculate total percentages per month (should be 100% each)
  const monthTotalPercentages = monthlyData.map((month, index) => {
    const prevMonth = index > 0 ? monthlyData[index - 1] : null;
    const variation = prevMonth && prevMonth.total > 0
      ? ((month.total - prevMonth.total) / prevMonth.total) * 100
      : null;
    
    return {
      month: month.month,
      percentage: 100,
      variation,
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
                    formatter={(value: number, name: string, props: any) => {
                      const percentage = props.payload[`${name}_pct`];
                      return [
                        `${formatCurrency(value)} (${formatPercent(percentage)})`,
                        expenseCategoryLabels[name] || name,
                      ];
                    }}
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

      {/* Category Totals Table with Percentages and Variations */}
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
                    {monthlyData.map((month, index) => (
                      <th key={month.monthKey} className="text-right py-3 px-2 font-semibold text-foreground" colSpan={index > 0 ? 2 : 1}>
                        {month.month}
                        {index > 0 && <span className="text-xs text-muted-foreground ml-1">(Var.)</span>}
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
                      {monthlyData.map((month, monthIndex) => {
                        const value = (row as unknown as Record<string, number | string>)[month.month] as number;
                        const percentage = (row as unknown as Record<string, number>)[`${month.month}_pct`];
                        const variation = (row as unknown as Record<string, { value: number; type: string }>)[`${month.month}_var`];
                        
                        return (
                          <>
                            <td key={`${month.monthKey}-value`} className="text-right py-2.5 px-2 text-muted-foreground">
                              {value ? (
                                <div className="flex flex-col items-end text-[13px] leading-tight">
                                  <span>{formatCurrency(value)}</span>
                                  <span className="text-[11px] text-muted-foreground/70">
                                    {formatPercent(percentage)}
                                  </span>
                                </div>
                              ) : '-'}
                            </td>
                            {monthIndex > 0 && (
                              <td key={`${month.monthKey}-var`} className="text-right py-2.5 px-1">
                                {variation ? (
                                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                                    variation.type === 'up'
                                      ? 'text-expense bg-expense/10'
                                      : variation.type === 'down'
                                        ? 'text-income bg-income/10'
                                        : 'text-muted-foreground'
                                  }`}>
                                    {variation.type === 'up' && <TrendingUp className="h-3 w-3" />}
                                    {variation.type === 'down' && <TrendingDown className="h-3 w-3" />}
                                    {variation.type === 'same' && <Minus className="h-3 w-3" />}
                                    {`${Math.abs(variation.value).toFixed(0)}%`}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            )}
                          </>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t border-border font-semibold">
                    <td className="py-2.5 px-2 text-foreground">Total</td>
                    {monthlyData.map((month, monthIndex) => {
                      const totalVar = monthTotalPercentages[monthIndex];
                      
                      return (
                        <>
                          <td key={`${month.monthKey}-total`} className="text-right py-2.5 px-2 text-expense">
                            <div className="flex flex-col items-end text-[13px] leading-tight">
                              <span>{formatCurrency(month.total)}</span>
                              <span className="text-[11px] text-muted-foreground/70">100%</span>
                            </div>
                          </td>
                          {monthIndex > 0 && (
                            <td key={`${month.monthKey}-total-var`} className="text-right py-2.5 px-1">
                              {totalVar.variation !== null ? (
                                <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                                  totalVar.variation > 0
                                    ? 'text-expense bg-expense/10'
                                    : totalVar.variation < 0
                                      ? 'text-income bg-income/10'
                                      : 'text-muted-foreground'
                                }`}>
                                  {totalVar.variation > 0 && <TrendingUp className="h-3 w-3" />}
                                  {totalVar.variation < 0 && <TrendingDown className="h-3 w-3" />}
                                  {totalVar.variation === 0 && <Minus className="h-3 w-3" />}
                                  {Math.abs(totalVar.variation).toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          )}
                        </>
                      );
                    })}
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
