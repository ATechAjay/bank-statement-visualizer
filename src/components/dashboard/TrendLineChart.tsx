"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import { format, startOfMonth } from "date-fns";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { formatCurrency } from "@/lib/currencyFormatter";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface TrendLineChartProps {
  transactions: Transaction[];
}

export function TrendLineChart({ transactions }: TrendLineChartProps) {
  const currency = useSettingsStore((state) => state.currency);

  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Use the actual date range from transactions instead of hardcoding "last 6 months"
    const dates = transactions
      .map((t) => (t.date instanceof Date ? t.date : new Date(t.date)))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return { labels: [], datasets: [] };
    }

    const firstDate = startOfMonth(dates[0]);
    const lastDate = startOfMonth(dates[dates.length - 1]);

    // Build months array from first to last transaction month
    const months: Date[] = [];
    let current = firstDate;
    while (current <= lastDate) {
      months.push(current);
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    // Cap at 12 months for readability
    const displayMonths = months.length > 12 ? months.slice(-12) : months;

    const labels = displayMonths.map((month) => format(month, "MMM yyyy"));

    const incomeByMonth: number[] = [];
    const expensesByMonth: number[] = [];

    displayMonths.forEach((month) => {
      const monthEnd = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const monthTransactions = transactions.filter((t) => {
        const d = t.date instanceof Date ? t.date : new Date(t.date);
        return d >= month && d <= monthEnd;
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      incomeByMonth.push(income);
      expensesByMonth.push(expenses);
    });

    return {
      labels,
      datasets: [
        {
          label: "Income",
          data: incomeByMonth,
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Expenses",
          data: expensesByMonth,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [transactions]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return `${label}: ${formatCurrency(value, currency, false)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value, currency, false);
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
