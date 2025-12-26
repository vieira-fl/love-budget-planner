import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryAnalysis } from '@/types/finance';

interface ExpenseChartProps {
  data: CategoryAnalysis[];
}

const COLORS = [
  'hsl(160, 84%, 39%)',
  'hsl(200, 80%, 50%)',
  'hsl(280, 70%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(320, 70%, 50%)',
  'hsl(180, 70%, 45%)',
  'hsl(240, 60%, 55%)',
  'hsl(60, 70%, 45%)',
  'hsl(120, 50%, 45%)',
];

export function ExpenseChart({ data }: ExpenseChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const chartData = data.map((item) => ({
    name: item.label,
    value: item.total,
    percentage: item.percentage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
          <p className="text-sm font-medium text-primary">{data.percentage.toFixed(1)}% da receita</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 card-shadow h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">Adicione despesas para ver o gráfico</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 card-shadow animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-4">Distribuição de Despesas</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
