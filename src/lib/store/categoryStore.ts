import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Category } from "@/types";

interface CategoryStore {
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  initializeDefaultCategories: () => void;
}

const defaultCategories: Category[] = [
  {
    id: "credit",
    name: "Credit",
    icon: "💰",
    keywords: [
      "salary",
      "paycheck",
      "deposit",
      "income",
      "payment received",
      "wage",
      "earnings",
      "credited",
      "received from",
      "refund",
      "cashback",
      "interest",
      "dividend",
      "bonus",
      "stipend",
      "freelance",
    ],
    color: "#10b981",
    type: "income",
  },
  {
    id: "debit",
    name: "Debit",
    icon: "💳",
    keywords: [
      "purchase",
      "payment",
      "withdrawal",
      "debit",
      "spent",
      "paid",
      "transfer",
      "sent",
      "expense",
    ],
    color: "#ef4444",
    type: "expense",
  },
  {
    id: "other",
    name: "Other",
    icon: "📌",
    keywords: [],
    color: "#6b7280",
    type: "both",
  },
];

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat,
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        })),

      getCategoryById: (id) => {
        return get().categories.find((cat) => cat.id === id);
      },

      initializeDefaultCategories: () => {
        const { categories } = get();
        // Always reset to simplified categories (credit/debit/other)
        // This ensures old complex categories from localStorage are replaced
        const hasNewFormat = categories.some((c) => c.id === "credit");
        if (categories.length === 0 || !hasNewFormat) {
          set({ categories: defaultCategories });
        }
      },
    }),
    {
      name: "category-storage",
    },
  ),
);
