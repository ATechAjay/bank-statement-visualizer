import { NextRequest, NextResponse } from 'next/server';
import {
  checkOllamaRunning,
  listModels,
  validateOllamaUrl,
} from '@/lib/llm/ollamaClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let url: string;
  try {
    url = validateOllamaUrl(
      request.nextUrl.searchParams.get('url') || 'http://localhost:11434',
    );
  } catch {
    return NextResponse.json(
      { connected: false, models: [], selectedModel: null },
      { status: 400 },
    );
  }

  const connected = await checkOllamaRunning(url);

  if (!connected) {
    return NextResponse.json({
      connected: false,
      models: [],
      selectedModel: null,
    });
  }

  const models = await listModels(url);

  return NextResponse.json({
    connected: true,
    models,
    selectedModel: models[0] || null,
  });
}
