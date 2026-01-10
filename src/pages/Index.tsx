import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { SummaryCard } from '@/components/SummaryCard';
import { CategoryAnalysisTable } from '@/components/CategoryAnalysisCard';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { ExpenseChart } from '@/components/ExpenseChart';
import { PersonSettings } from '@/components/PersonSettings';
import { Top10Expenses } from '@/components/Top10Expenses';
import { MonthlyComparisonTab } from '@/components/MonthlyComparisonTab';
import { ExpenseSplitCard } from '@/components/ExpenseSplitCard';
import { PersonSummaryCard } from '@/components/PersonSummaryCard';
import { DetailedSplitCard } from '@/components/DetailedSplitCard';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CumulativeChart } from '@/components/CumulativeChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportExpensesDialog } from '@/components/ImportExpensesDialog';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';

const Index = () => {
  const { isAuthenticated, loading: authLoading, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const {
    transactions,
    totalIncome,
    totalExpenses,
    balance,
    categoryAnalysis,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    person1Name,
    person2Name,
    setPerson1Name,
    setPerson2Name,
    expenseCategoryLabels,
    incomeCategoryLabels,
    addExpenseCategory,
    addIncomeCategory,
    top10Expenses,
    monthlyComparison,
    biggestCategoryIncrease,
    splitCalculation,
    incomeByPerson,
    expensesByPerson,
    monthlyBalanceSummary,
  } = useFinance({ startDate, endDate });

  const handleClearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const savingsOpportunities = categoryAnalysis.filter((c) => c.status === 'high');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2.5 rounded-xl">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Finanças do Casal</h1>
                <p className="text-sm text-muted-foreground">Controle e economia juntos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
              <PersonSettings
                person1Name={person1Name}
                person2Name={person2Name}
                onPerson1NameChange={setPerson1Name}
                onPerson2NameChange={setPerson2Name}
              />
              <div className="flex items-center gap-2">
                <AddTransactionDialog
                  onAdd={addTransaction}
                  onAddMultiple={addMultipleTransactions}
                  person1Name={person1Name}
                  person2Name={person2Name}
                  expenseCategoryLabels={expenseCategoryLabels}
                  incomeCategoryLabels={incomeCategoryLabels}
                  onAddExpenseCategory={addExpenseCategory}
                  onAddIncomeCategory={addIncomeCategory}
                />
                <ImportExpensesDialog
                  onImport={addMultipleTransactions}
                  person1Name={person1Name}
                  person2Name={person2Name}
                  expenseCategoryLabels={expenseCategoryLabels}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Period Filter */}
        <section>
          <PeriodFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClearFilter={handleClearFilter}
          />
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Receita Total"
            value={totalIncome}
            icon={TrendingUp}
            variant="income"
          />
          <SummaryCard
            title="Despesas Totais"
            value={totalExpenses}
            icon={TrendingDown}
            variant="expense"
          />
          <SummaryCard
            title="Saldo Total"
            value={balance}
            icon={Wallet}
            variant="balance"
          />
        </section>

        {/* Savings Alert */}
        {savingsOpportunities.length > 0 && (
          <section className="bg-warning/10 border border-warning/30 rounded-xl p-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="bg-warning/20 rounded-lg p-2">
                <PiggyBank className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Oportunidades de Economia Identificadas
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {savingsOpportunities.length === 1
                    ? 'Encontramos 1 categoria com gastos acima do recomendado:'
                    : `Encontramos ${savingsOpportunities.length} categorias com gastos acima do recomendado:`}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {savingsOpportunities.map((opportunity) => (
                    <span
                      key={opportunity.category}
                      className="px-3 py-1 bg-warning/20 text-warning-foreground rounded-full text-sm font-medium"
                    >
                      {opportunity.label} ({opportunity.percentage.toFixed(1)}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="split">Rateio</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cumulative Evolution Chart */}
            <section>
              <CumulativeChart transactions={transactions} />
            </section>

            {/* Charts and Analysis */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseChart data={categoryAnalysis} />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Análise por Categoria</h2>
                <div className="max-h-[340px] overflow-y-auto">
                  <CategoryAnalysisTable analysisData={categoryAnalysis} />
                </div>
              </div>
            </section>

            {/* Top 10 Expenses */}
            <section>
              <Top10Expenses
                expenses={top10Expenses}
                expenseCategoryLabels={expenseCategoryLabels}
                person1Name={person1Name}
                person2Name={person2Name}
              />
            </section>

            {/* Transactions */}
            <section>
              <TransactionList
                transactions={transactions}
                onDelete={deleteTransaction}
                onUpdate={updateTransaction}
                person1Name={person1Name}
                person2Name={person2Name}
                expenseCategoryLabels={expenseCategoryLabels}
                incomeCategoryLabels={incomeCategoryLabels}
              />
            </section>
          </TabsContent>

          <TabsContent value="split" className="space-y-6">
            {/* Person Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PersonSummaryCard
                personName={person1Name}
                income={incomeByPerson.pessoa1}
                expenses={expensesByPerson.pessoa1}
                variant="person1"
              />
              <PersonSummaryCard
                personName={person2Name}
                income={incomeByPerson.pessoa2}
                expenses={expensesByPerson.pessoa2}
                variant="person2"
              />
            </section>

            {/* Split Summary */}
            <ExpenseSplitCard
              splitCalculation={splitCalculation}
              person1Name={person1Name}
              person2Name={person2Name}
            />

            {/* Detailed Split Table */}
            <DetailedSplitCard
              transactions={transactions}
              splitCalculation={splitCalculation}
              person1Name={person1Name}
              person2Name={person2Name}
              expenseCategoryLabels={expenseCategoryLabels}
            />
          </TabsContent>

          <TabsContent value="comparison">
            <MonthlyComparisonTab
              monthlyData={monthlyComparison}
              biggestIncrease={biggestCategoryIncrease}
              expenseCategoryLabels={expenseCategoryLabels}
              monthlyBalanceSummary={monthlyBalanceSummary}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Controle suas finanças juntos e alcancem seus objetivos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
