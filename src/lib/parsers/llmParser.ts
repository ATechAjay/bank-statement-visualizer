import { Transaction, ParsedStatement, Currency, LLMStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useSettingsStore } from "@/lib/store/settingsStore";

/* ============================================================
   LLM-POWERED PARSER
   Works with PDF, CSV, and XLS files.
   Sends extracted text to local Ollama for transaction parsing.
   ============================================================ */

function getLLMSettings() {
  const { ollamaUrl, llmModel } = useSettingsStore.getState();
  return { ollamaUrl, model: llmModel };
}

/**
 * Extract raw text from a PDF file using pdfjs-dist (runs in browser).
 * Preserves spatial layout for better LLM comprehension.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Preserve spatial layout: group by Y, sort by X
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.str && item.str.trim().length > 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

    const lines: { y: number; items: { text: string; x: number }[] }[] = [];
    for (const item of items) {
      const existing = lines.find((l) => Math.abs(l.y - item.y) < 3);
      if (existing) {
        existing.items.push(item);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }

    lines.sort((a, b) => b.y - a.y);
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
      // Use tab separators between items that are far apart
      let prev = 0;
      const parts: string[] = [];
      for (const item of line.items) {
        if (prev > 0 && item.x - prev > 50) {
          parts.push("\t");
        }
        parts.push(item.text);
        prev = item.x + item.text.length * 5;
      }
      fullText += parts.join(" ") + "\n";
    }
    fullText += "\n--- PAGE BREAK ---\n\n";
  }

  return fullText;
}

/**
 * Extract raw text from a CSV or XLS file (for sending to LLM).
 */
export async function extractTextFromTabular(file: File): Promise<string> {
  const ext = file.name.toLowerCase();

  if (ext.endsWith(".csv")) {
    return await file.text();
  }

  // XLS/XLSX — convert to CSV text
  const XLSX = await import("xlsx");
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  let text = "";
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    text += `Sheet: ${sheetName}\n${csv}\n\n`;
  }
  return text;
}

/**
 * Parse any file (PDF, CSV, XLS) using the local LLM.
 */
export async function parseWithLLM(
  file: File,
  onProgress?: (status: string) => void,
): Promise<{
  statement: ParsedStatement;
  currency: Currency;
  rawText: string;
}> {
  const { ollamaUrl, model } = getLLMSettings();
  const ext = file.name.toLowerCase();
  const isPDF = ext.endsWith(".pdf");

  // 1 — Extract text
  onProgress?.("Extracting text from document...");
  const rawText = isPDF
    ? await extractTextFromPDF(file)
    : await extractTextFromTabular(file);

  if (!rawText.trim()) {
    throw new Error(
      "No text found in file. If it's a scanned PDF, try a text-based PDF instead.",
    );
  }

  // 2 — Send to LLM
  onProgress?.("AI is analysing your statement — this may take a moment...");

  const res = await fetch("/api/llm/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: rawText, model, ollamaUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "LLM parsing failed");
  }

  const result = await res.json();

  if (!result.transactions || result.transactions.length === 0) {
    throw new Error("AI could not find any transactions in the document.");
  }

  onProgress?.(`Found ${result.transactions.length} transactions!`);

  // 3 — Convert to Transaction objects
  const transactions: Transaction[] = result.transactions
    .map(
      (t: {
        date: string;
        description: string;
        amount: number;
        type: string;
      }) => ({
        id: uuidv4(),
        date: new Date(t.date),
        description: t.description,
        amount: t.type === "expense" ? -Math.abs(t.amount) : Math.abs(t.amount),
        category: "other",
        type: t.type as "income" | "expense",
        originalText: t.description,
      }),
    )
    .filter((t: Transaction) => !isNaN(t.date.getTime()) && t.amount !== 0);

  const currency: Currency = {
    code: result.currency?.code || "USD",
    symbol: result.currency?.symbol || "$",
    name: result.currency?.name || "US Dollar",
  };

  // Determine format
  let format: "pdf" | "csv" | "xlsx" | "xls" = "pdf";
  if (ext.endsWith(".csv")) format = "csv";
  else if (ext.endsWith(".xlsx")) format = "xlsx";
  else if (ext.endsWith(".xls")) format = "xls";

  return {
    statement: {
      transactions,
      format,
      fileName: file.name,
      parseDate: new Date(),
    },
    currency,
    rawText,
  };
}

/**
 * Check whether the LLM is reachable at the configured URL.
 */
export async function checkLLMStatus(ollamaUrl?: string): Promise<LLMStatus> {
  const url = ollamaUrl ?? useSettingsStore.getState().ollamaUrl;
  try {
    const res = await fetch(`/api/llm/status?url=${encodeURIComponent(url)}`);
    if (!res.ok) return { connected: false, models: [], selectedModel: null };
    return await res.json();
  } catch {
    return { connected: false, models: [], selectedModel: null };
  }
}

/**
 * Build a context string from parsed transactions for use in chat.
 */
export function buildChatContext(
  transactions: Transaction[],
  currency: Currency,
  fileName: string,
): string {
  if (transactions.length === 0) return "No transactions loaded.";

  const income = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");

  const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);

  const dates = transactions
    .map((t) => new Date(t.date))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  let ctx = `Bank Statement — "${fileName}"
Period: ${fmt(dates[0])} to ${fmt(dates[dates.length - 1])}
Currency: ${currency.name} (${currency.symbol}) [${currency.code}]
Total Transactions: ${transactions.length}
Total Income: ${currency.symbol}${totalIncome.toLocaleString()}
Total Expenses: ${currency.symbol}${totalExpenses.toLocaleString()}
Net: ${currency.symbol}${(totalIncome - totalExpenses).toLocaleString()}

All Transactions:
`;

  for (const t of transactions) {
    const sign = t.type === "income" ? "+" : "-";
    ctx += `${fmt(new Date(t.date))} | ${t.description} | ${sign}${currency.symbol}${Math.abs(t.amount).toLocaleString()} | ${t.type} | category: ${t.category}\n`;
  }

  return ctx;
}
