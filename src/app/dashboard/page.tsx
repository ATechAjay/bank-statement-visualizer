'use client';

import { useMemo } from 'react';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { useCategoryStore } from '@/lib/store/categoryStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { TrendLineChart } from '@/components/dashboard/TrendLineChart';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Wallet, MessageSquare } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useChatStore } from '@/lib/store/chatStore';

export default function DashboardPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const chatContext = useChatStore((state) => state.statementContext);
  const router = useRouter();

  // Calculate stats - use all transactions
  const stats = useMemo(() => {
    // Get all transactions
    const allTxns = transactions;

    // If no transactions, return zeros
    if (allTxns.length === 0) {
      return { income: 0, expenses: 0, balance: 0, savingsRate: '0', period: 'No data' };
    }

    // Calculate totals
    const income = allTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = allTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';

    // Get date range for display (dates may be strings after JSON rehydration)
    const dates = allTxns
      .map(t => (t.date instanceof Date ? t.date : new Date(t.date)))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const period = firstDate && lastDate
      ? `${format(firstDate, 'MMM yyyy')} - ${format(lastDate, 'MMM yyyy')}`
      : 'All time';

    return { income, expenses, balance, savingsRate, period };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Yet</h2>
          <p className="text-muted-foreground mb-6">
            Upload your first statement to get started
          </p>
          <Button onClick={() => router.push('/')}>
            Upload Statement
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {transactions.length} transactions • {stats.period}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/transactions')}
              >
                View All Transactions
              </Button>
              <Button onClick={() => router.push('/budget')}>
                Plan Budget
              </Button>
              {chatContext && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/chat')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={stats.income}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="positive"
          />
          <StatCard
            title="Total Expenses"
            value={stats.expenses}
            icon={<TrendingDown className="w-5 h-5" />}
            trend="negative"
          />
          <StatCard
            title="Net Balance"
            value={stats.balance}
            icon={<Wallet className="w-5 h-5" />}
            trend={stats.balance >= 0 ? 'positive' : 'negative'}
          />
          <StatCard
            title="Savings Rate"
            value={`${stats.savingsRate}%`}
            icon={<DollarSign className="w-5 h-5" />}
            trend="neutral"
            isPercentage
          />
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <CategoryPieChart
            transactions={transactions}
            categories={categories}
          />
          <TrendLineChart transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
