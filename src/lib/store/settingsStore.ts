import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Currency, Settings } from "@/types";

const availableCurrencies: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
];

interface SettingsStore extends Settings {
  // LLM settings
  ollamaUrl: string;
  llmModel: string | null;

  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  getAvailableCurrencies: () => Currency[];
  setOllamaUrl: (url: string) => void;
  setLLMModel: (model: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      currency: { code: "USD", symbol: "$", name: "US Dollar" },
      dateFormat: "auto",
      theme: "light",

      // LLM defaults
      ollamaUrl: "http://localhost:11434",
      llmModel: null,

      setCurrency: (currency) => set({ currency }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setTheme: (theme) => set({ theme }),
      getAvailableCurrencies: () => availableCurrencies,
      setOllamaUrl: (url) => {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return;
          }
          // Strip trailing slash for consistency
          set({ ollamaUrl: url.replace(/\/+$/, "") });
        } catch {
          // Reject invalid URLs silently
        }
      },
      setLLMModel: (model) => set({ llmModel: model }),
    }),
    {
      name: "settings-storage",
    },
  ),
);
