'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useChatStore } from '@/lib/store/chatStore';
import { checkLLMStatus } from '@/lib/parsers/llmParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Plug,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  const clearAllTransactions = useTransactionStore((state) => state.clearAll);
  const clearChat = useChatStore((state) => state.clearAll);

  // Currency settings
  const currency = useSettingsStore((state) => state.currency);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const getAvailableCurrencies = useSettingsStore(
    (state) => state.getAvailableCurrencies
  );
  const availableCurrencies = getAvailableCurrencies();

  // LLM settings
  const ollamaUrl = useSettingsStore((state) => state.ollamaUrl);
  const llmModel = useSettingsStore((state) => state.llmModel);
  const setOllamaUrl = useSettingsStore((state) => state.setOllamaUrl);
  const setLLMModel = useSettingsStore((state) => state.setLLMModel);

  // Local state for the URL input (so we can edit before saving)
  const [urlInput, setUrlInput] = useState(ollamaUrl);
  const [models, setModels] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connected' | 'failed'
  >('idle');

  // Test connection on mount with saved URL
  useEffect(() => {
    testConnection(ollamaUrl, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testConnection = useCallback(
    async (url: string, silent = false) => {
      if (!silent) setIsConnecting(true);
      setConnectionStatus('idle');

      try {
        const status = await checkLLMStatus(url);

        if (status.connected) {
          setConnectionStatus('connected');
          setModels(status.models);
          setOllamaUrl(url);

          // If the currently saved model isn't in the new list, auto-select first
          if (
            status.models.length > 0 &&
            (!llmModel || !status.models.includes(llmModel))
          ) {
            setLLMModel(status.models[0]);
          }
        } else {
          setConnectionStatus('failed');
          setModels([]);
        }
      } catch {
        setConnectionStatus('failed');
        setModels([]);
      } finally {
        setIsConnecting(false);
      }
    },
    [llmModel, setOllamaUrl, setLLMModel]
  );

  const handleClearData = () => {
    if (
      confirm(
        'Are you sure you want to clear all transactions? This cannot be undone.'
      )
    ) {
      clearAllTransactions();
      clearChat();
      alert('All data cleared successfully!');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage AI connection, preferences, and data
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* ─── AI Connection ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>AI Connection</CardTitle>
              </div>
              {connectionStatus === 'connected' && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'failed' && (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            <CardDescription>
              Connect to any Ollama instance — local or remote. Use any model
              you like (Gemma, Llama, Mistral, Phi, Qwen, etc.).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Ollama URL */}
            <div className="space-y-2">
              <Label htmlFor="ollama-url">Ollama Server URL</Label>
              <div className="flex gap-2">
                <Input
                  id="ollama-url"
                  placeholder="http://localhost:11434"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => testConnection(urlInput)}
                  disabled={isConnecting || !urlInput.trim()}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plug className="w-4 h-4 mr-2" />
                  )}
                  Connect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Default: <code>http://localhost:11434</code>. Change if Ollama
                runs on another port or machine.
              </p>
            </div>

            <Separator />

            {/* Model selector */}
            <div className="space-y-2">
              <Label htmlFor="model-select">Model</Label>
              {models.length > 0 ? (
                <Select
                  value={llmModel || ''}
                  onValueChange={(v) => setLLMModel(v)}
                >
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Choose a model…" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {connectionStatus === 'failed'
                    ? 'Connect to Ollama first to see available models.'
                    : 'No models found. Pull one with: ollama pull <model>'}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Any model works — smaller models (1-4 B) are faster, larger
                models are more accurate.
              </p>
            </div>

            {/* Refresh models */}
            {connectionStatus === 'connected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection(urlInput, false)}
                disabled={isConnecting}
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh models
              </Button>
            )}

            {/* Quick-start tips */}
            {connectionStatus === 'failed' && (
              <div className="rounded-md bg-muted p-4 text-sm space-y-2">
                <p className="font-medium">Quick Start</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>
                    Install Ollama →{' '}
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary"
                    >
                      ollama.com
                    </a>
                  </li>
                  <li>
                    Start the server: <code>ollama serve</code>
                  </li>
                  <li>
                    Pull any model: <code>ollama pull llama3.2</code>
                  </li>
                  <li>Click &quot;Connect&quot; above</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Currency ─── */}
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Select your preferred display currency (AI also auto-detects from
              statements)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={currency.code}
                onValueChange={(code) => {
                  const sel = availableCurrencies.find((c) => c.code === code);
                  if (sel) setCurrency(sel);
                }}
              >
                <SelectTrigger id="currency">
                  <SelectValue>
                    {currency.symbol} {currency.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Data Management ─── */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your transaction data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Transactions Loaded</p>
                <p className="text-sm text-muted-foreground">
                  {transactions.length} transactions in storage
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleClearData}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>

            <p className="text-xs text-muted-foreground">
              All data is stored locally in your browser. Clearing removes
              transactions, budgets, and chat history.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
