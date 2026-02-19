"use client";

import { useState, useMemo } from "react";
import { useTransactionStore } from "@/lib/store/transactionStore";
import { useCategoryStore } from "@/lib/store/categoryStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { formatCurrency } from "@/lib/currencyFormatter";

export default function TransactionsPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const updateTransaction = useTransactionStore(
    (state) => state.updateTransaction,
  );
  const currency = useSettingsStore((state) => state.currency);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = t.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          filterCategory === "all" || t.category === filterCategory;
        const matchesType = filterType === "all" || t.type === filterType;

        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [transactions, searchTerm, filterCategory, filterType]);

  const handleCategoryChange = (transactionId: string, newCategory: string) => {
    updateTransaction(transactionId, { category: newCategory });
  };

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
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Transactions</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and categorize your transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => {
                  const category = categories.find(
                    (c) => c.id === transaction.category,
                  );

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {format(
                          transaction.date instanceof Date
                            ? transaction.date
                            : new Date(transaction.date),
                          "MMM dd, yyyy",
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {transaction.merchant || transaction.description}
                          </div>
                          {transaction.merchant && (
                            <div className="text-xs text-muted-foreground">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          {formatCurrency(transaction.amount, currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "income"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.type === "income" ? "Credit" : "Debit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {transaction.balance !== undefined &&
                        transaction.balance !== null
                          ? formatCurrency(transaction.balance, currency, false)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category}
                          onValueChange={(value) =>
                            handleCategoryChange(transaction.id, value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue>
                              {category?.icon} {category?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter(
                                (c) =>
                                  c.type === transaction.type ||
                                  c.type === "both",
                              )
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredTransactions.length} of {transactions.length}{" "}
          transactions
        </div>
      </div>
    </div>
  );
}
