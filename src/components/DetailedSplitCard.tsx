import { useState, useMemo } from 'react';
import { Transaction, SplitCalculation } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DetailedSplitCardProps {
  transactions: Transaction[];
  splitCalculation: SplitCalculation;
  person1Name: string;
  person2Name: string;
  expenseCategoryLabels: Record<string, string>;
}

export function DetailedSplitCard({
  transactions,
  splitCalculation,
  person1Name,
  person2Name,
  expenseCategoryLabels,
}: DetailedSplitCardProps) {
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const expenses = transactions.filter(t => t.type === 'expense');
  const sharedExpenses = expenses.filter(t => t.includeInSplit);
  const personalExpenses = expenses.filter(t => !t.includeInSplit);

  // Get unique categories from shared expenses
  const uniqueCategories = useMemo(() => {
    const categories = new Set(sharedExpenses.map(t => t.category));
    return Array.from(categories).sort();
  }, [sharedExpenses]);

  // Filter shared expenses
  const filteredSharedExpenses = useMemo(() => {
    return sharedExpenses.filter(expense => {
      const matchesPerson = personFilter === 'all' || expense.person === personFilter;
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesPerson && matchesCategory;
    });
  }, [sharedExpenses, personFilter, categoryFilter]);

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const total = filteredSharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const person1Share = (splitCalculation.person1IncomePercentage / 100) * total;
    const person2Share = (splitCalculation.person2IncomePercentage / 100) * total;
    return { total, person1Share, person2Share };
  }, [filteredSharedExpenses, splitCalculation]);

  const getPersonName = (person: 'pessoa1' | 'pessoa2') => {
    return person === 'pessoa1' ? person1Name : person2Name;
  };

  const hasActiveFilters = personFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Shared Expenses Table */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Despesas no Rateio
              <Badge variant="secondary" className="ml-2">
                {filteredSharedExpenses.length} {hasActiveFilters ? `de ${sharedExpenses.length}` : ''} itens
              </Badge>
            </CardTitle>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas pessoas</SelectItem>
                  <SelectItem value="pessoa1">{person1Name}</SelectItem>
                  <SelectItem value="pessoa2">{person2Name}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {expenseCategoryLabels[category] || category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSharedExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pago por</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">{person1Name}</TableHead>
                    <TableHead className="text-right">{person2Name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSharedExpenses.map((expense) => {
                    const person1Share = (splitCalculation.person1IncomePercentage / 100) * expense.amount;
                    const person2Share = (splitCalculation.person2IncomePercentage / 100) * expense.amount;
                    
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(expense.date), 'dd/MM', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {expenseCategoryLabels[expense.category] || expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={expense.person === 'pessoa1' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {getPersonName(expense.person)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(person1Share)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(person2Share)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={4}>
                      Total {hasActiveFilters ? '(filtrado)' : 'no Rateio'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(filteredTotals.total)}
                    </TableCell>
                    <TableCell className="text-right text-primary">
                      {formatCurrency(filteredTotals.person1Share)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(filteredTotals.person2Share)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{hasActiveFilters ? 'Nenhuma despesa encontrada com os filtros selecionados' : 'Nenhuma despesa marcada para rateio'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Expenses (Not in Split) */}
      {personalExpenses.length > 0 && (
        <Card className="bg-card card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              Despesas Fora do Rateio
              <Badge variant="outline" className="ml-2">
                {personalExpenses.length} itens
              </Badge>
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
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personalExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(expense.date), 'dd/MM', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {expenseCategoryLabels[expense.category] || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={expense.person === 'pessoa1' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {getPersonName(expense.person)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
