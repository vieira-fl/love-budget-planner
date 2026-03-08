import { useMemo, useState, useRef, useEffect } from 'react';
import { Transaction } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChartIcon, Wallet, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInvestmentGoals } from '@/hooks/useInvestmentGoals';

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
  const { getGoal, upsertGoal } = useInvestmentGoals();

  const investmentTransactions = useMemo(() =>
    transactions.filter(t => t.type === 'investment').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [transactions]);

  const byCategory = useMemo(() => {
    const map: Record<string, { key: string; value: number }> = {};
    investmentTransactions.forEach(t => {
      const label = investmentCategoryLabels[t.category] || t.category;
      if (!map[label]) map[label] = { key: t.category, value: 0 };
      map[label].value += t.amount;
    });
    return Object.entries(map)
      .map(([name, { key, value }]) => ({ name, key, value }))
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

  const perPersonSummary = useMemo(() => {
    const map: Record<string, { income: number; expenses: number; investments: number }> = {};
    transactions.forEach(t => {
      if (!map[t.person]) map[t.person] = { income: 0, expenses: 0, investments: 0 };
      if (t.type === 'income') map[t.person].income += t.amount;
      else if (t.type === 'expense') map[t.person].expenses += t.amount;
      else if (t.type === 'investment') map[t.person].investments += t.amount;
    });
    return Object.entries(map).map(([name, data]) => {
      const balance = data.income - data.expenses;
      const freeCash = balance - data.investments;
      return { name, ...data, balance, freeCash };
    }).sort((a, b) => b.balance - a.balance);
  }, [transactions]);

  const monthlyBalanceVsInvestment = useMemo(() => {
    const balanceMap = new Map<string, { income: number; expenses: number }>();
    transactions.forEach(t => {
      if (t.type === 'investment') return;
      const key = format(new Date(t.date), 'yyyy-MM');
      const existing = balanceMap.get(key) || { income: 0, expenses: 0 };
      if (t.type === 'income') existing.income += t.amount;
      else if (t.type === 'expense') existing.expenses += t.amount;
      balanceMap.set(key, existing);
    });

    const investMap = new Map<string, number>();
    investmentTransactions.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM');
      investMap.set(key, (investMap.get(key) || 0) + t.amount);
    });

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
          difference,
        };
      });
  }, [transactions, investmentTransactions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const totalBalance = useMemo(() => {
    let income = 0, expenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
    });
    return income - expenses;
  }, [transactions]);

  const totalFreeCash = useMemo(() => {
    return totalBalance - totalInvestments;
  }, [totalBalance, totalInvestments]);

  const investmentPct = totalBalance !== 0 ? (totalInvestments / Math.abs(totalBalance)) * 100 : 0;
  const freeCashPct = totalBalance !== 0 ? (totalFreeCash / Math.abs(totalBalance)) * 100 : 0;

  if (investmentTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto">
            <LineChartIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Nenhuma reserva registrada</h3>
          <p className="text-muted-foreground">
            Adicione transações do tipo Reserva para visualizar a análise aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card card-shadow">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo Operacional</p>
            <p className={`text-2xl font-bold mt-1 ${totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Receitas − Despesas do período</p>
          </CardContent>
        </Card>
        <Card className="bg-card card-shadow">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total em Reservas</p>
            <p className="text-2xl font-bold mt-1 text-investment">
              {formatCurrency(totalInvestments)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {investmentPct.toFixed(1)}% do saldo operacional
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card card-shadow">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caixa Livre Total</p>
            <p className={`text-2xl font-bold mt-1 ${totalFreeCash >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalFreeCash)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {freeCashPct.toFixed(1)}% do saldo operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By Category with Goals - moved right after summary */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-investment" />
            Por Categoria
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Defina metas para cada categoria de reserva e acompanhe o progresso.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Investido</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                  <TableHead className="text-right w-[140px]">Meta (R$)</TableHead>
                  <TableHead className="text-right">Completude</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory.map((cat, i) => {
                  const pct = totalInvestments > 0 ? (cat.value / totalInvestments) * 100 : 0;
                  const goal = getGoal(cat.key);
                  const completionPct = goal > 0 ? Math.min((cat.value / goal) * 100, 100) : 0;

                  return (
                    <TableRow key={cat.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-medium text-foreground">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-investment">
                        {formatCurrencyFull(cat.value)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {pct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <GoalInput categoryKey={cat.key} currentGoal={goal} onSave={upsertGoal} />
                      </TableCell>
                      <TableCell className="text-right">
                        {goal > 0 ? (
                          <div className="flex items-center gap-2 justify-end min-w-[120px]">
                            <Progress value={completionPct} className="h-2 w-16" />
                            <span className={`text-xs font-semibold whitespace-nowrap ${completionPct >= 100 ? 'text-income' : 'text-muted-foreground'}`}>
                              {completionPct.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Per-Person Summary */}
      {perPersonSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {perPersonSummary.map(p => (
            <Card key={p.name} className="bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Saldo Operacional</span>
                  <span className={`font-semibold ${p.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(p.balance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Investido</span>
                  <span className="font-semibold text-investment">{formatCurrency(p.investments)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Caixa Livre</span>
                  <span className={`font-bold text-lg ${p.freeCash >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(p.freeCash)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Balance vs Investment Analysis */}
      {monthlyBalanceVsInvestment.length > 0 && (
        <Card className="bg-card card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Saldo Mensal vs Reservas
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

// Inline editable goal input component
function GoalInput({ categoryKey, currentGoal, onSave }: { categoryKey: string; currentGoal: number; onSave: (key: string, amount: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentGoal > 0 ? currentGoal.toString() : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(currentGoal > 0 ? currentGoal.toString() : '');
  }, [currentGoal]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onSave(categoryKey, num);
    } else if (value === '' || value === '0') {
      onSave(categoryKey, 0);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-right w-full cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
      >
        {currentGoal > 0 ? (
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(currentGoal)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Definir meta</span>
        )}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      className="h-7 text-sm text-right w-[120px] ml-auto"
      placeholder="0"
    />
  );
}
