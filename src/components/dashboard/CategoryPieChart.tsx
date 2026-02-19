'use client';

import { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, Category } from '@/types';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { formatCurrency } from '@/lib/currencyFormatter';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryPieChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export function CategoryPieChart({ transactions, categories }: CategoryPieChartProps) {
  const currency = useSettingsStore((state) => state.currency);

  const chartData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};

    // Sum expenses by category
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const amount = Math.abs(t.amount);
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amount;
      });

    // Sort by amount and get top categories
    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8); // Top 8 categories

    const labels = sortedCategories.map(([categoryId]) => {
      const category = categories.find((c) => c.id === categoryId);
      return category ? `${category.icon} ${category.name}` : categoryId;
    });

    const data = sortedCategories.map(([, amount]) => amount);

    const backgroundColors = sortedCategories.map(([categoryId]) => {
      const category = categories.find((c) => c.id === categoryId);
      return category?.color || '#6b7280';
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.8)',
        },
      ],
    };
  }, [transactions, categories]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${formatCurrency(value, currency, false)}`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Pie data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
