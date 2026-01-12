import { useMemo } from 'react';
import { Transaction, SplitCalculation } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PieChart, LayoutGrid } from 'lucide-react';

interface SplitCategoryBreakdownProps {
  transactions: Transaction[];
  splitCalculation: SplitCalculation;
  expenseCategoryLabels: Record<string, string>;
  uniquePeople: string[];
}

export function SplitCategoryBreakdown({
  transactions,
  splitCalculation,
  expenseCategoryLabels,
  uniquePeople,
}: SplitCategoryBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const sharedExpenses = transactions.filter(t => t.type === 'expense' && t.includeInSplit);

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const breakdown = new Map<string, { total: number; byPerson: Record<string, number> }>();

    sharedExpenses.forEach(expense => {
      const existing = breakdown.get(expense.category) || {
        total: 0,
        byPerson: {},
      };
      existing.total += expense.amount;
      existing.byPerson[expense.person] = (existing.byPerson[expense.person] || 0) + expense.amount;
      breakdown.set(expense.category, existing);
    });

    return Array.from(breakdown.entries())
      .map(([category, data]) => ({
        category,
        label: expenseCategoryLabels[category] || category,
        ...data,
      }))
      .sort((a, b) => b.total - a.total);
  }, [sharedExpenses, expenseCategoryLabels]);

  // Breakdown by person
  const personBreakdown = useMemo(() => {
    const breakdown = new Map<string, { total: number; byCategory: Record<string, number> }>();

    sharedExpenses.forEach(expense => {
      const existing = breakdown.get(expense.person) || {
        total: 0,
        byCategory: {},
      };
      existing.total += expense.amount;
      existing.byCategory[expense.category] = (existing.byCategory[expense.category] || 0) + expense.amount;
      breakdown.set(expense.person, existing);
    });

    return Array.from(breakdown.entries())
      .map(([person, data]) => ({
        person,
        ...data,
      }))
      .sort((a, b) => b.total - a.total);
  }, [sharedExpenses]);

  const totalShared = splitCalculation.totalSharedExpenses;

  if (sharedExpenses.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Breakdown */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  {uniquePeople.slice(0, 2).map(person => (
                    <TableHead key={person} className="text-right">{person}</TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map((row) => {
                  const percentage = totalShared > 0 ? (row.total / totalShared) * 100 : 0;
                  return (
                    <TableRow key={row.category}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {row.label}
                        </Badge>
                      </TableCell>
                      {uniquePeople.slice(0, 2).map(person => (
                        <TableCell key={person} className="text-right text-muted-foreground">
                          {row.byPerson[person] ? formatCurrency(row.byPerson[person]) : '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(row.total)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total</TableCell>
                  {uniquePeople.slice(0, 2).map(person => {
                    const personTotal = personBreakdown.find(p => p.person === person)?.total || 0;
                    return (
                      <TableCell key={person} className="text-right">
                        {formatCurrency(personTotal)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    {formatCurrency(totalShared)}
                  </TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Person Breakdown */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Por Pessoa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personBreakdown.map((personData) => {
              const percentage = totalShared > 0 ? (personData.total / totalShared) * 100 : 0;
              const topCategories = Object.entries(personData.byCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

              return (
                <div key={personData.person} className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{personData.person}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({percentage.toFixed(1)}% do rateio)
                      </span>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(personData.total)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topCategories.map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate">
                          {expenseCategoryLabels[category] || category}
                        </span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
