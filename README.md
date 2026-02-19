# Bank Statement Visualizer

**AI-powered bank statement parser & visualizer — runs 100% locally, no cloud, no login.**

Upload a PDF / CSV / Excel bank statement → AI extracts every transaction with the correct currency → interactive dashboard & charts → chat with your data.

---

## Features

| Feature | Description |
|---|---|
| **AI Parsing** | Uses a local LLM (via Ollama) to extract transactions from PDFs with near-perfect accuracy |
| **Any Model** | Works with *any* Ollama model — Gemma, Llama, Mistral, Phi, Qwen, DeepSeek, etc. |
| **Auto Currency** | AI detects the currency from your statement automatically |
| **Dashboard** | Pie charts, trend lines, income vs expense breakdowns |
| **Chat** | Ask questions about your statement in natural language ("What was my highest expense?") |
| **Budget** | Plan next month's budget based on spending patterns |
| **Privacy** | Everything stays on your machine — no data leaves your browser + local Ollama |
| **Multi-format** | PDF, CSV, XLS, XLSX supported |

---

## Quick Start

### 1. Install Ollama

Download from [ollama.com](https://ollama.com) or:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull a Model

Pick any model you like. Smaller models are faster; larger models are more accurate.

```bash
# Small & fast (recommended for parsing)
ollama pull gemma3:1b
ollama pull llama3.2:1b
ollama pull phi4-mini

# Medium (good balance)
ollama pull gemma3:4b
ollama pull llama3.2:3b
ollama pull mistral

# Large (most accurate)
ollama pull llama3.1:8b
ollama pull gemma3:12b
ollama pull qwen2.5:7b
```

### 3. Start Ollama

```bash
ollama serve
```

> Ollama runs on `http://localhost:11434` by default. You can change the port or run it on another machine — just update the URL in Settings.

### 4. Run the App

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Connect

1. Go to **Settings** (top-right on dashboard)
2. Under **AI Connection**, the default URL `http://localhost:11434` should auto-connect
3. Select your preferred model from the dropdown
4. Done — go back to the home page and upload a statement!

---

## How It Works

```
┌──────────────────────────────────────────────────────┐
│                      Browser                         │
│                                                      │
│  ┌──────────┐    ┌────────────┐    ┌──────────────┐  │
│  │  Upload   │───▶│ PDF Text   │───▶│  Review &    │  │
│  │  PDF/CSV  │    │ Extraction │    │  Confirm     │  │
│  └──────────┘    └─────┬──────┘    └──────┬───────┘  │
│                        │                  │          │
│                        ▼                  ▼          │
│               ┌────────────────┐  ┌──────────────┐   │
│               │  Next.js API   │  │  Dashboard   │   │
│               │  /api/llm/*    │  │  + Charts    │   │
│               └───────┬────────┘  └──────────────┘   │
│                       │                              │
└───────────────────────┼──────────────────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │    Ollama      │
               │  (local LLM)   │
               │                │
               │  Any model:    │
               │  gemma, llama, │
               │  mistral, etc. │
               └────────────────┘
```

### Parsing Flow

1. **Text extraction** — `pdfjs-dist` runs in the browser and extracts raw text from the PDF
2. **LLM parsing** — The extracted text is sent to your local Ollama model via Next.js API routes. The model returns structured JSON with dates, descriptions, amounts, types, and auto-detected currency
3. **Chunking** — Long statements are automatically split into chunks so they fit within the model's context window
4. **Validation** — Every transaction is validated (date, amount, type) before being shown
5. **Fallback** — If Ollama is not running, a regex-based parser is used as fallback

### Chat Flow

1. After importing transactions, the app builds a summary context (all transactions + totals)
2. When you ask a question, the context + your question are sent to Ollama
3. Responses stream back in real-time (Server-Sent Events)

---

## Supported Models

**Any model available in Ollama works.** Here are some tested recommendations:

| Model | Size | Speed | Accuracy | Best For |
|---|---|---|---|---|
| `gemma3:1b` | 1B | ⚡ Very fast | Good | Quick parsing |
| `llama3.2:1b` | 1B | ⚡ Very fast | Good | Quick parsing |
| `phi4-mini` | 3.8B | Fast | Very good | Balanced |
| `gemma3:4b` | 4B | Fast | Very good | Balanced |
| `llama3.2:3b` | 3B | Fast | Very good | Balanced |
| `mistral` | 7B | Medium | Excellent | Best accuracy |
| `llama3.1:8b` | 8B | Medium | Excellent | Best accuracy |
| `qwen2.5:7b` | 7B | Medium | Excellent | Best accuracy |
| `deepseek-r1:1.5b` | 1.5B | Fast | Good | Reasoning |

> **Tip:** Start with a small model for speed. If parsing isn't accurate enough, switch to a larger one in Settings.

---

## Project Structure

```
src/
├── app/
│   ├── api/llm/           # API routes for Ollama communication
│   │   ├── status/         # GET  — check connection & list models
│   │   ├── parse/          # POST — parse statement text with LLM
│   │   └── chat/           # POST — streaming chat with LLM
│   ├── chat/               # Chat page
│   ├── dashboard/          # Dashboard with charts
│   ├── review/             # Review parsed transactions before import
│   ├── settings/           # Settings (AI connection, currency, data)
│   ├── budget/             # Budget planning
│   └── transactions/       # Transaction list
├── components/
│   ├── chat/               # Chat UI components
│   ├── dashboard/          # Dashboard chart components
│   ├── ui/                 # shadcn/ui primitives
│   └── upload/             # File upload & processing
├── lib/
│   ├── llm/
│   │   └── ollamaClient.ts # Ollama REST API client (server-side)
│   ├── parsers/
│   │   ├── llmParser.ts    # LLM-powered parser (client-side)
│   │   ├── pdfParser.ts    # Regex fallback parser
│   │   ├── csvParser.ts    # CSV parser
│   │   └── xlsParser.ts    # Excel parser
│   └── store/
│       ├── settingsStore.ts  # Settings (Ollama URL, model, currency)
│       ├── chatStore.ts      # Chat messages & context
│       ├── transactionStore.ts
│       ├── categoryStore.ts
│       └── budgetStore.ts
└── types/
    └── index.ts
```

---

## Configuration

### Environment Variables (optional)

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Fallback Ollama URL (UI setting takes priority) |

### Ollama on a Different Machine

If Ollama runs on another computer on your network:

```bash
# On the Ollama machine, start with:
OLLAMA_HOST=0.0.0.0 ollama serve

# Then in the app Settings, use:
http://<machine-ip>:11434
```

---

## Tech Stack

- **Framework:** Next.js 16 (React 19, App Router)
- **UI:** shadcn/ui + Tailwind CSS v4
- **State:** Zustand (persisted to localStorage / sessionStorage)
- **Charts:** Chart.js + react-chartjs-2
- **PDF:** pdfjs-dist (text extraction)
- **AI:** Ollama (local LLM inference)
- **Language:** TypeScript

---

## FAQ

**Q: Does my data leave my computer?**
No. PDF parsing happens in your browser. The LLM runs on your machine via Ollama. Nothing is sent to any cloud service.

**Q: Do I need an internet connection?**
Only to install dependencies and download models. After that, everything works offline.

**Q: What if Ollama isn't running?**
The app falls back to a regex-based parser for PDFs. CSV and Excel files don't need AI. You'll see an "AI Offline" badge on the home page.

**Q: Can I use models from OpenAI / Anthropic?**
Not currently — this app is designed for local-only inference via Ollama. No API keys needed.

**Q: My PDF isn't parsing correctly.**
Try a larger model (e.g. `mistral` or `llama3.1:8b`). Scanned/image PDFs won't work — the PDF must contain selectable text.

---

## License

MIT
