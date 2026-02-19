'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="border-b shrink-0 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-8 w-8 sm:h-9 sm:w-9 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <h1 className="text-base sm:text-xl font-bold truncate">
              Chat with your Statement
            </h1>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </div>
        </div>
      </div>

      {/* Chat panel fills remaining height */}
      <div className="flex-1 overflow-hidden relative">
        <ChatPanel />
      </div>
    </div>
  );
}
