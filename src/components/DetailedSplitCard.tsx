import { useState, useMemo } from 'react';
import { Transaction, SplitCalculation } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, CheckCircle2, XCircle, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DetailedSplitCardProps {
  transactions: Transaction[];
  splitCalculation: SplitCalculation;
  expenseCategoryLabels: Record<string, string>;
}

type SortField = 'date' | 'description' | 'category' | 'person' | 'paymentMethod' | 'tag' | 'amount';
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export function DetailedSplitCard({
  transactions,
  splitCalculation,
  expenseCategoryLabels,
}: DetailedSplitCardProps) {
  // Unified filters for both tables
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Separate sort states for each table
  const [sharedSort, setSharedSort] = useState<SortState>({ field: null, direction: null });
  const [personalSort, setPersonalSort] = useState<SortState>({ field: null, direction: null });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const expenses = transactions.filter(t => t.type === 'expense');
  const sharedExpenses = expenses.filter(t => t.includeInSplit);
  const personalExpenses = expenses.filter(t => !t.includeInSplit);

  // Get unique people from all expenses (for unified filter)
  const uniquePeople = useMemo(() => {
    const people = new Set(expenses.map(t => t.person));
    return Array.from(people).sort();
  }, [expenses]);

  // Get unique categories from all expenses (for unified filter)
  const uniqueCategories = useMemo(() => {
    const categories = new Set(expenses.map(t => t.category));
    return Array.from(categories).sort();
  }, [expenses]);

  // Get unique payment methods from all expenses
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(expenses.map(t => t.paymentMethod).filter(Boolean));
    return Array.from(methods).sort() as string[];
  }, [expenses]);

  // Get unique tags from all expenses
  const uniqueTags = useMemo(() => {
    const tags = new Set(expenses.map(t => t.tag).filter(Boolean));
    return Array.from(tags).sort() as string[];
  }, [expenses]);

  // Apply unified filters to expenses
  const applyFilters = (expenseList: Transaction[]) => {
    return expenseList.filter(expense => {
      const matchesPerson = personFilter === 'all' || expense.person === personFilter;
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      const matchesPaymentMethod = paymentMethodFilter === 'all' || expense.paymentMethod === paymentMethodFilter;
      const matchesTag = tagFilter === 'all' || expense.tag === tagFilter;
      return matchesPerson && matchesCategory && matchesPaymentMethod && matchesTag;
    });
  };

  // Sort expenses
  const sortExpenses = (expenseList: Transaction[], sortState: SortState) => {
    if (!sortState.field || !sortState.direction) return expenseList;

    return [...expenseList].sort((a, b) => {
      let comparison = 0;
      const field = sortState.field!;

      switch (field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'person':
          comparison = a.person.localeCompare(b.person);
          break;
        case 'paymentMethod':
          comparison = (a.paymentMethod || '').localeCompare(b.paymentMethod || '');
          break;
        case 'tag':
          comparison = (a.tag || '').localeCompare(b.tag || '');
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }

      return sortState.direction === 'desc' ? -comparison : comparison;
    });
  };

  // Filter shared expenses
  const filteredSharedExpenses = useMemo(() => {
    return applyFilters(sharedExpenses);
  }, [sharedExpenses, personFilter, categoryFilter, paymentMethodFilter, tagFilter]);

  // Filter personal expenses
  const filteredPersonalExpenses = useMemo(() => {
    return applyFilters(personalExpenses);
  }, [personalExpenses, personFilter, categoryFilter, paymentMethodFilter, tagFilter]);

  // Sorted shared expenses
  const sortedSharedExpenses = useMemo(() => {
    return sortExpenses(filteredSharedExpenses, sharedSort);
  }, [filteredSharedExpenses, sharedSort]);

  // Sorted personal expenses
  const sortedPersonalExpenses = useMemo(() => {
    return sortExpenses(filteredPersonalExpenses, personalSort);
  }, [filteredPersonalExpenses, personalSort]);

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const total = filteredSharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    return { total };
  }, [filteredSharedExpenses]);

  const hasActiveFilters = personFilter !== 'all' || categoryFilter !== 'all' || paymentMethodFilter !== 'all' || tagFilter !== 'all';

  const handleSort = (field: SortField, isShared: boolean) => {
    const currentSort = isShared ? sharedSort : personalSort;
    const setSort = isShared ? setSharedSort : setPersonalSort;

    if (currentSort.field === field) {
      if (currentSort.direction === 'asc') {
        setSort({ field, direction: 'desc' });
      } else if (currentSort.direction === 'desc') {
        setSort({ field: null, direction: null });
      } else {
        setSort({ field, direction: 'asc' });
      }
    } else {
      setSort({ field, direction: 'asc' });
    }
  };

  const getSortIcon = (field: SortField, sortState: SortState) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    if (sortState.direction === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1" />;
    }
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const clearFilters = () => {
    setPersonFilter('all');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setTagFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Unified Filters Card */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 cursor-pointer" onClick={clearFilters}>
                  Limpar
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Pessoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas pessoas</SelectItem>
                {uniquePeople.map(person => (
                  <SelectItem key={person} value={person}>{person}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
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

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Forma PGTO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas formas</SelectItem>
                {uniquePaymentMethods.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas tags</SelectItem>
                {uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shared Expenses Table */}
      <Card className="bg-card card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Despesas no Rateio
            <Badge variant="secondary" className="ml-2">
              {filteredSharedExpenses.length} {hasActiveFilters ? `de ${sharedExpenses.length}` : ''} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSharedExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('date', true)}
                    >
                      <div className="flex items-center">
                        Data
                        {getSortIcon('date', sharedSort)}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('description', true)}
                    >
                      <div className="flex items-center">
                        Descrição
                        {getSortIcon('description', sharedSort)}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('category', true)}
                    >
                      <div className="flex items-center">
                        Categoria
                        {getSortIcon('category', sharedSort)}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('person', true)}
                    >
                      <div className="flex items-center">
                        Pago por
                        {getSortIcon('person', sharedSort)}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('paymentMethod', true)}
                    >
                      <div className="flex items-center">
                        Forma PGTO
                        {getSortIcon('paymentMethod', sharedSort)}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('tag', true)}
                    >
                      <div className="flex items-center">
                        Tag
                        {getSortIcon('tag', sharedSort)}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('amount', true)}
                    >
                      <div className="flex items-center justify-end">
                        Valor
                        {getSortIcon('amount', sharedSort)}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSharedExpenses.map((expense) => (
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
                        <Badge variant="default" className="text-xs">
                          {expense.person}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.paymentMethod && (
                          <Badge variant="outline" className="text-xs">
                            {expense.paymentMethod}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.tag && (
                          <Badge variant="secondary" className="text-xs">
                            {expense.tag}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={6}>
                      Total {hasActiveFilters ? '(filtrado)' : 'no Rateio'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(filteredTotals.total)}
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
      {(filteredPersonalExpenses.length > 0 || (personalExpenses.length > 0 && hasActiveFilters)) && (
        <PersonalExpensesList
          personalExpenses={sortedPersonalExpenses}
          allPersonalExpenses={personalExpenses}
          expenseCategoryLabels={expenseCategoryLabels}
          formatCurrency={formatCurrency}
          hasActiveFilters={hasActiveFilters}
          sortState={personalSort}
          onSort={(field) => handleSort(field, false)}
          getSortIcon={(field) => getSortIcon(field, personalSort)}
        />
      )}
    </div>
  );
}

interface PersonalExpensesListProps {
  personalExpenses: Transaction[];
  allPersonalExpenses: Transaction[];
  expenseCategoryLabels: Record<string, string>;
  formatCurrency: (value: number) => string;
  hasActiveFilters: boolean;
  sortState: SortState;
  onSort: (field: SortField) => void;
  getSortIcon: (field: SortField) => React.ReactNode;
}

function PersonalExpensesList({
  personalExpenses,
  allPersonalExpenses,
  expenseCategoryLabels,
  formatCurrency,
  hasActiveFilters,
  sortState,
  onSort,
  getSortIcon,
}: PersonalExpensesListProps) {
  // Calculate totals per person from filtered expenses
  const personTotals = useMemo(() => {
    const totals = new Map<string, number>();
    personalExpenses.forEach(expense => {
      totals.set(expense.person, (totals.get(expense.person) || 0) + expense.amount);
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [personalExpenses]);

  const grandTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className="bg-card card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <XCircle className="h-5 w-5 text-muted-foreground" />
          Despesas Fora do Rateio
          <Badge variant="outline" className="ml-2">
            {personalExpenses.length} {hasActiveFilters ? `de ${allPersonalExpenses.length}` : ''} itens
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {personalExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('date')}
                  >
                    <div className="flex items-center">
                      Data
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('description')}
                  >
                    <div className="flex items-center">
                      Descrição
                      {getSortIcon('description')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('category')}
                  >
                    <div className="flex items-center">
                      Categoria
                      {getSortIcon('category')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('person')}
                  >
                    <div className="flex items-center">
                      Responsável
                      {getSortIcon('person')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('paymentMethod')}
                  >
                    <div className="flex items-center">
                      Forma PGTO
                      {getSortIcon('paymentMethod')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('tag')}
                  >
                    <div className="flex items-center">
                      Tag
                      {getSortIcon('tag')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => onSort('amount')}
                  >
                    <div className="flex items-center justify-end">
                      Valor
                      {getSortIcon('amount')}
                    </div>
                  </TableHead>
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
                      <Badge variant="default" className="text-xs">
                        {expense.person}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.paymentMethod && (
                        <Badge variant="outline" className="text-xs">
                          {expense.paymentMethod}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {expense.tag && (
                        <Badge variant="secondary" className="text-xs">
                          {expense.tag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Person totals */}
                {personTotals.map(([person, total]) => (
                  <TableRow key={`total-${person}`} className="bg-muted/30">
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Subtotal
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-xs">
                        {person}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(total)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Grand total */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6}>Total Fora do Rateio {hasActiveFilters ? '(filtrado)' : ''}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma despesa encontrada com os filtros selecionados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
