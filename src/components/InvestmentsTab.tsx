import { useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InvestmentsTabProps {
  transactions: Transaction[];
  investmentCategoryLabels: Record<string, string>;
  totalInvestments: number;
  uniquePeople: string[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--investment))',
  'hsl(var(--income))',
  'hsl(var(--expense))',
  'hsl(var(--accent))',
  'hsl(var(--warning))',
  'hsl(270, 60%, 55%)',
  'hsl(200, 70%, 50%)',
];

export function InvestmentsTab({ transactions, investmentCategoryLabels, totalInvestments, uniquePeople }: InvestmentsTabProps) {
  const investmentTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'investment'),
  [transactions]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    investmentTransactions.forEach(t => {
      const label = investmentCategoryLabels[t.category] || t.category;
      map[label] = (map[label] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [investmentTransactions, investmentCategoryLabels]);

  const byPerson = useMemo(() => {
    const map: Record<string, number> = {};
    investmentTransactions.forEach(t => {
      map[t.person] = (map[t.person] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [investmentTransactions]);

  const monthlyEvolution = useMemo(() => {
    const map = new Map<string, number>();
    investmentTransactions.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM');
      map.set(key, (map.get(key) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: format(new Date(year, month - 1, 15), 'MMM/yy', { locale: ptBR }),
          value,
        };
      });
  }, [investmentTransactions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  if (investmentTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto">
            <LineChartIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Nenhum investimento registrado</h3>
          <p className="text-muted-foreground">
            Adicione transações do tipo Investimento para visualizar a análise aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Evolution */}
      {monthlyEvolution.length > 0 && (
        <Card className="bg-card card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-investment" />
              Evolução Mensal dos Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEvolution} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(v: number) => Math.abs(v) >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Investido']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--investment))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card className="bg-card card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Person */}
        {byPerson.length > 1 && (
          <Card className="bg-card card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Por Pessoa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {byPerson.map((p, i) => {
                  const pct = totalInvestments > 0 ? (p.value / totalInvestments) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{p.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(p.value)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail list */}
        {byPerson.length <= 1 && (
          <Card className="bg-card card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Detalhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {byCategory.map((cat, i) => {
                  const pct = totalInvestments > 0 ? (cat.value / totalInvestments) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-foreground">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">{formatCurrency(cat.value)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
