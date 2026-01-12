import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Loader2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { SummaryCard } from '@/components/SummaryCard';
import { CategoryAnalysisTable } from '@/components/CategoryAnalysisCard';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { ExpenseChart } from '@/components/ExpenseChart';
import { Top10Expenses } from '@/components/Top10Expenses';
import { MonthlyComparisonTab } from '@/components/MonthlyComparisonTab';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CumulativeChart } from '@/components/CumulativeChart';
import { ExpenseSplitCard } from '@/components/ExpenseSplitCard';
import { SplitCategoryBreakdown } from '@/components/SplitCategoryBreakdown';
import { DetailedSplitCard } from '@/components/DetailedSplitCard';
import { PersonSummaryCard } from '@/components/PersonSummaryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportExpensesDialog } from '@/components/ImportExpensesDialog';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, loading: authLoading, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const {
    transactions,
    loading: transactionsLoading,
    totalIncome,
    totalExpenses,
    balance,
    categoryAnalysis,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    expenseCategoryLabels,
    incomeCategoryLabels,
    addExpenseCategory,
    addIncomeCategory,
    top10Expenses,
    monthlyComparison,
    biggestCategoryIncrease,
    monthlyBalanceSummary,
    splitCalculation,
    uniquePeople,
    personSummaries,
  } = useTransactions({ startDate, endDate });

  const handleClearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const savingsOpportunities = categoryAnalysis.filter((c) => c.status === 'high');

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
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
              <Button onClick={() => setShowAuthModal(true)} className="gradient-primary border-0">
                Entrar
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="gradient-primary p-4 rounded-2xl w-fit mx-auto">
              <PiggyBank className="h-16 w-16 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Organize suas finanças juntos
            </h2>
            <p className="text-lg text-muted-foreground">
              Controle seus gastos, identifique oportunidades de economia e alcance seus objetivos financeiros como casal ou família.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => setShowAuthModal(true)}
                className="gradient-primary border-0"
              >
                Criar conta grátis
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowAuthModal(true)}
              >
                Já tenho conta
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <div className="p-6 rounded-xl bg-card border border-border">
                <TrendingUp className="h-8 w-8 text-income mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Controle de Receitas</h3>
                <p className="text-sm text-muted-foreground">
                  Registre todas as suas fontes de renda e acompanhe a evolução.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <TrendingDown className="h-8 w-8 text-expense mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Análise de Gastos</h3>
                <p className="text-sm text-muted-foreground">
                  Identifique onde seu dinheiro está indo e encontre oportunidades.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <Wallet className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Saldo em Tempo Real</h3>
                <p className="text-sm text-muted-foreground">
                  Veja seu saldo atualizado e tome decisões informadas.
                </p>
              </div>
            </div>
          </div>
        </main>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

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
                <p className="text-sm text-muted-foreground">Olá, {profile?.username || 'Usuário'}!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
              <div className="flex items-center gap-2">
                <AddTransactionDialog
                  onAdd={addTransaction}
                  onAddMultiple={addMultipleTransactions}
                  username={profile?.username || 'Usuário'}
                  expenseCategoryLabels={expenseCategoryLabels}
                  incomeCategoryLabels={incomeCategoryLabels}
                  onAddExpenseCategory={addExpenseCategory}
                  onAddIncomeCategory={addIncomeCategory}
                />
                <ImportExpensesDialog
                  onImport={addMultipleTransactions}
                  username={profile?.username || 'Usuário'}
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

        {/* Loading indicator for transactions */}
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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

            {/* Empty state */}
            {transactions.length === 0 && (
              <section className="text-center py-12">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto">
                    <PiggyBank className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Nenhuma transação ainda
                  </h3>
                  <p className="text-muted-foreground">
                    Comece adicionando sua primeira transação para visualizar seus dados financeiros.
                  </p>
                </div>
              </section>
            )}

            {/* Tabs - only show if there are transactions */}
            {transactions.length > 0 && (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="comparison">Comparativo</TabsTrigger>
                  <TabsTrigger value="split">Rateio</TabsTrigger>
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
                    />
                  </section>

                  {/* Transactions */}
                  <section>
                    <TransactionList
                      transactions={transactions}
                      onDelete={deleteTransaction}
                      onUpdate={updateTransaction}
                      expenseCategoryLabels={expenseCategoryLabels}
                      incomeCategoryLabels={incomeCategoryLabels}
                    />
                  </section>
                </TabsContent>

                <TabsContent value="comparison">
                  <MonthlyComparisonTab
                    monthlyData={monthlyComparison}
                    biggestIncrease={biggestCategoryIncrease}
                    expenseCategoryLabels={expenseCategoryLabels}
                    monthlyBalanceSummary={monthlyBalanceSummary}
                  />
                </TabsContent>

                <TabsContent value="split" className="space-y-6">
                  {uniquePeople.length >= 2 && splitCalculation ? (
                    <>
                      {/* Person Summary Cards */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PersonSummaryCard
                          personName={uniquePeople[0]}
                          income={personSummaries[uniquePeople[0]]?.income || 0}
                          expenses={personSummaries[uniquePeople[0]]?.expenses || 0}
                          variant="person1"
                        />
                        <PersonSummaryCard
                          personName={uniquePeople[1]}
                          income={personSummaries[uniquePeople[1]]?.income || 0}
                          expenses={personSummaries[uniquePeople[1]]?.expenses || 0}
                          variant="person2"
                        />
                      </section>

                      {/* Expense Split Calculation */}
                      <section>
                        <ExpenseSplitCard
                          splitCalculation={splitCalculation}
                          person1Name={uniquePeople[0]}
                          person2Name={uniquePeople[1]}
                        />
                      </section>

                      {/* Category and Person Breakdown */}
                      <section>
                        <SplitCategoryBreakdown
                          transactions={transactions}
                          splitCalculation={splitCalculation}
                          expenseCategoryLabels={expenseCategoryLabels}
                          uniquePeople={uniquePeople}
                        />
                      </section>

                      {/* Detailed Split */}
                      <section>
                        <DetailedSplitCard
                          transactions={transactions}
                          splitCalculation={splitCalculation}
                          expenseCategoryLabels={expenseCategoryLabels}
                        />
                      </section>
                    </>
                  ) : (
                    <section className="text-center py-12">
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto">
                          <PiggyBank className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">
                          Rateio não disponível
                        </h3>
                        <p className="text-muted-foreground">
                          Para calcular o rateio, é necessário que haja transações de pelo menos duas pessoas diferentes.
                        </p>
                      </div>
                    </section>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
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
