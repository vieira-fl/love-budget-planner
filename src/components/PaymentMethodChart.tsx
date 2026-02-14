import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '@/types/finance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentMethodChartProps {
  transactions: Transaction[];
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  'Cartão': 'hsl(200, 80%, 50%)',
  'PIX': 'hsl(160, 84%, 39%)',
  'TED': 'hsl(280, 70%, 55%)',
  'Cash': 'hsl(38, 92%, 50%)',
};

export function PaymentMethodChart({ transactions }: PaymentMethodChartProps) {
  const expenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.paymentMethod),
    [transactions]
  );

  const people = useMemo(() => {
    const set = new Set(expenses.map((t) => t.person));
    return Array.from(set).sort();
  }, [expenses]);

  const paymentMethods = useMemo(() => {
    const set = new Set(expenses.map((t) => t.paymentMethod!));
    return Array.from(set).sort();
  }, [expenses]);

  const chartData = useMemo(() => {
    const monthMap = new Map<string, Record<string, number>>();

    expenses.forEach((t) => {
      const monthKey = format(t.date, 'yyyy-MM');
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {});
      }
      const entry = monthMap.get(monthKey)!;

      people.forEach((person) => {
        paymentMethods.forEach((pm) => {
          const key = `${person}_${pm}`;
          if (!entry[key]) entry[key] = 0;
        });
      });

      const key = `${t.person}_${t.paymentMethod}`;
      entry[key] = (entry[key] || 0) + t.amount;
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, data]) => ({
        month: format(new Date(monthKey + '-15'), 'MMM/yy', { locale: ptBR }),
        ...data,
      }));
  }, [expenses, people, paymentMethods]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload
          .filter((p: any) => p.value > 0)
          .map((p: any) => {
            const [person, method] = p.dataKey.split('_');
            return (
              <div key={p.dataKey} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {person} - {method}
                </span>
                <span className="font-medium text-foreground">{formatCurrency(p.value)}</span>
              </div>
            );
          })}
      </div>
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 card-shadow h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">Adicione despesas para ver o gráfico</p>
      </div>
    );
  }

  // Generate bars: one per person+paymentMethod combination
  const bars = people.flatMap((person) =>
    paymentMethods.map((pm) => {
      const key = `${person}_${pm}`;
      const baseColor = PAYMENT_METHOD_COLORS[pm] || 'hsl(0, 0%, 60%)';
      // Differentiate people by opacity
      const personIndex = people.indexOf(person);
      const opacity = personIndex === 0 ? 1 : 0.6;
      return (
        <Bar
          key={key}
          dataKey={key}
          name={`${person} - ${pm}`}
          fill={baseColor}
          fillOpacity={opacity}
          stackId={person}
          radius={[2, 2, 0, 0]}
        />
      );
    })
  );

  return (
    <div className="bg-card rounded-xl p-6 card-shadow animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Despesas por Forma de Pagamento
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            wrapperStyle={{ paddingTop: '10px' }}
          />
          {bars}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
