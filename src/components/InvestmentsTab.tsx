import { useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon, TrendingUp, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
    transactions.filter(t => t.type === 'investment').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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
          monthKey: key,
          month: format(new Date(year, month - 1, 15), 'MMM/yy', { locale: ptBR }),
          value,
        };
      });
  }, [investmentTransactions]);

  // Monthly balance (income - expenses) per month, then compare with investments
  const monthlyBalanceVsInvestment = useMemo(() => {
    // Calculate monthly balance (income - expense only, no investments)
    const balanceMap = new Map<string, { income: number; expenses: number }>();
    transactions.forEach(t => {
      if (t.type === 'investment') return;
      const key = format(new Date(t.date), 'yyyy-MM');
      const existing = balanceMap.get(key) || { income: 0, expenses: 0 };
      if (t.type === 'income') existing.income += t.amount;
      else if (t.type === 'expense') existing.expenses += t.amount;
      balanceMap.set(key, existing);
    });

    // Calculate monthly investments
    const investMap = new Map<string, number>();
    investmentTransactions.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM');
      investMap.set(key, (investMap.get(key) || 0) + t.amount);
    });

    // Merge all month keys
    const allKeys = new Set([...balanceMap.keys(), ...investMap.keys()]);
    return Array.from(allKeys)
      .sort()
      .map(key => {
        const bal = balanceMap.get(key) || { income: 0, expenses: 0 };
        const monthBalance = bal.income - bal.expenses;
        const monthInvestment = investMap.get(key) || 0;
        const difference = monthBalance - monthInvestment;
        const [year, month] = key.split('-').map(Number);
        return {
          monthKey: key,
          month: format(new Date(year, month - 1, 15), 'MMM/yy', { locale: ptBR }),
          balance: monthBalance,
          investment: monthInvestment,
          difference, // positive = caixa livre, negative = precisará economizar
        };
      });
  }, [transactions, investmentTransactions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

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

      {/* Balance vs Investment Analysis */}
      {monthlyBalanceVsInvestment.length > 0 && (
        <Card className="bg-card card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Saldo Mensal vs Investimentos
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Compara o saldo operacional (receitas − despesas) com os investimentos realizados em cada mês.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Saldo Operacional</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBalanceVsInvestment.map(row => (
                    <TableRow key={row.monthKey}>
                      <TableCell className="font-medium capitalize">{row.month}</TableCell>
                      <TableCell className={`text-right ${row.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatCurrencyFull(row.balance)}
                      </TableCell>
                      <TableCell className="text-right text-investment">
                        {formatCurrencyFull(row.investment)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${row.difference >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatCurrencyFull(row.difference)}
                      </TableCell>
                      <TableCell>
                        {row.investment === 0 ? (
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                            Sem investimento
                          </Badge>
                        ) : row.difference >= 0 ? (
                          <Badge className="bg-income/15 text-income border-income/30 hover:bg-income/20 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Caixa livre: {formatCurrency(row.difference)}
                          </Badge>
                        ) : (
                          <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20 gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Economizar: {formatCurrency(Math.abs(row.difference))}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

        {/* Detail list (when single person) */}
        {byPerson.length <= 1 && (
          <Card className="bg-card card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Detalhamento por Categoria</CardTitle>
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

      {/* Investment Detail Table */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-investment" />
            Detalhamento dos Investimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investmentTransactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(t.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-investment border-investment/30">
                        {investmentCategoryLabels[t.category] || t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.person}</TableCell>
                    <TableCell className="text-right font-semibold text-investment">
                      {formatCurrencyFull(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
