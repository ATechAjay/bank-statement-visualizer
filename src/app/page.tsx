'use client';

import { useEffect } from 'react';
import { FileProcessor } from '@/components/upload/FileProcessor';
import { AIConnectionBar } from '@/components/upload/AIConnectionBar';
import { useCategoryStore } from '@/lib/store/categoryStore';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { useChatStore } from '@/lib/store/chatStore';
import {
  BarChart3,
  PiggyBank,
  MessageSquare,
} from 'lucide-react';

export default function Home() {
  const initializeDefaultCategories = useCategoryStore(
    (state) => state.initializeDefaultCategories
  );
  const transactions = useTransactionStore((state) => state.transactions);
  const chatContext = useChatStore((state) => state.statementContext);
  const router = useRouter();

  useEffect(() => {
    initializeDefaultCategories();
  }, [initializeDefaultCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bank Statement Visualizer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take control of your finances. Upload your statements and gain instant insights
            into your spending patterns — powered by local AI.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card p-6 rounded-lg border text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered Parsing</h3>
            <p className="text-sm text-muted-foreground">
              Local LLM reads your statements with 100% accuracy — no cloud, no login
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border text-center">
            <div className="inline-block p-3 bg-success/10 rounded-full mb-4">
              <PiggyBank className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold mb-2">Budget Planning</h3>
            <p className="text-sm text-muted-foreground">
              Plan next month&apos;s budget based on your spending trends
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border text-center">
            <div className="inline-block p-3 bg-warning/10 rounded-full mb-4">
              <MessageSquare className="w-6 h-6 text-warning" />
            </div>
            <h3 className="font-semibold mb-2">Chat with your Data</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions about your statement — the AI answers instantly
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto space-y-4">
          {transactions.length > 0 && (
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push('/dashboard')} size="lg">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
              {chatContext && (
                <Button
                  onClick={() => router.push('/chat')}
                  size="lg"
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat about Statement
                </Button>
              )}
            </div>
          )}

          {/* AI Connection + Model selector */}
          <AIConnectionBar />

          <FileProcessor />

          <div className="text-center text-sm text-muted-foreground">
            <p>🔒 Your data stays private — everything runs locally in your browser + Ollama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
