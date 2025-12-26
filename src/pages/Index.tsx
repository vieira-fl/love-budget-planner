import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { SummaryCard } from '@/components/SummaryCard';
import { CategoryAnalysisCard } from '@/components/CategoryAnalysisCard';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { ExpenseChart } from '@/components/ExpenseChart';
import { PersonSettings } from '@/components/PersonSettings';

const Index = () => {
  const {
    transactions,
    totalIncome,
    totalExpenses,
    balance,
    categoryAnalysis,
    addTransaction,
    deleteTransaction,
    person1Name,
    person2Name,
    setPerson1Name,
    setPerson2Name,
  } = useFinance();

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
              <PersonSettings
                person1Name={person1Name}
                person2Name={person2Name}
                onPerson1NameChange={setPerson1Name}
                onPerson2NameChange={setPerson2Name}
              />
              <AddTransactionDialog
                onAdd={addTransaction}
                person1Name={person1Name}
                person2Name={person2Name}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
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
            title="Saldo do Mês"
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

        {/* Charts and Analysis */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseChart data={categoryAnalysis} />
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Análise por Categoria</h2>
            <div className="grid gap-4 max-h-[340px] overflow-y-auto pr-2">
              {categoryAnalysis.length > 0 ? (
                categoryAnalysis.map((analysis, index) => (
                  <CategoryAnalysisCard key={analysis.category} analysis={analysis} index={index} />
                ))
              ) : (
                <div className="bg-card rounded-xl p-6 card-shadow text-center">
                  <p className="text-muted-foreground">
                    Adicione despesas para ver a análise por categoria
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section>
          <TransactionList
            transactions={transactions}
            onDelete={deleteTransaction}
            person1Name={person1Name}
            person2Name={person2Name}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Controle suas finanças juntos e alcancem seus objetivos 💚
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
