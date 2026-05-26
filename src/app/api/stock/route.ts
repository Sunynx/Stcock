import { NextResponse } from 'next/server';
import { fetchStockNews, fetchMultiPeriodChange_, fetchBizInfo_, analyzeNewsSentiment_, autoAnalyze_ } from '@/lib/stockData';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ success: false, error: 'Symbol is required' }, { status: 400 });
  }

  const now = Date.now();
  const cached = cache.get(symbol);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return NextResponse.json({ success: true, data: cached.data });
  }
  
  try {
    const [news, periods, bizInfo] = await Promise.all([
      fetchStockNews(symbol),
      fetchMultiPeriodChange_(symbol),
      fetchBizInfo_(symbol)
    ]);
    
    const sentiment = analyzeNewsSentiment_(news);
    
    const enriched = {
      ...periods,
      ...bizInfo,
      symbol,
      news: (sentiment.items || news).slice(0, 4),
      sentiment: { score: sentiment.score, label: sentiment.label, emoji: sentiment.emoji }
    };
    
    autoAnalyze_(enriched);
    
    cache.set(symbol, { data: enriched, timestamp: now });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}
