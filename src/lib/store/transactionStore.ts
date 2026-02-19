import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction } from '@/types';

/**
 * Ensure a value is a proper Date object.
 * Zustand persist serializes Date → string; this converts it back.
 */
function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

/** Rehydrate all date fields in a transaction array */
function rehydrateDates(txns: Transaction[]): Transaction[] {
  return txns.map((t) => ({ ...t, date: toDate(t.date) }));
}

interface TransactionStore {
  transactions: Transaction[];
  addTransactions: (txns: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearAll: () => void;
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getTotalIncome: (startDate?: Date, endDate?: Date) => number;
  getTotalExpenses: (startDate?: Date, endDate?: Date) => number;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransactions: (txns) =>
        set((state) => ({
          transactions: [...state.transactions, ...rehydrateDates(txns)],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((txn) =>
            txn.id === id ? { ...txn, ...updates } : txn
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((txn) => txn.id !== id),
        })),

      clearAll: () => set({ transactions: [] }),

      getTransactionsByDateRange: (startDate, endDate) => {
        return get().transactions.filter((txn) => {
          const d = toDate(txn.date);
          return d >= startDate && d <= endDate;
        });
      },

      getTransactionsByCategory: (category) => {
        return get().transactions.filter((txn) => txn.category === category);
      },

      getTotalIncome: (startDate, endDate) => {
        let txns = get().transactions.filter((txn) => txn.type === 'income');
        if (startDate && endDate) {
          txns = txns.filter((txn) => {
            const d = toDate(txn.date);
            return d >= startDate && d <= endDate;
          });
        }
        return txns.reduce((sum, txn) => sum + txn.amount, 0);
      },

      getTotalExpenses: (startDate, endDate) => {
        let txns = get().transactions.filter((txn) => txn.type === 'expense');
        if (startDate && endDate) {
          txns = txns.filter((txn) => {
            const d = toDate(txn.date);
            return d >= startDate && d <= endDate;
          });
        }
        return txns.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
      },
    }),
    {
      name: 'transaction-storage',
      // Rehydrate dates from JSON strings back to Date objects on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transactions = rehydrateDates(state.transactions);
        }
      },
    }
  )
);
