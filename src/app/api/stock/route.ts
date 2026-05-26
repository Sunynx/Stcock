import { NextResponse } from 'next/server';
import { fetchStockNews, fetchMultiPeriodChange_, fetchBizInfo_, analyzeNewsSentiment_, autoAnalyze_ } from '@/lib/stockData';
import { MemoryCache } from '@/lib/memoryCache';

export const dynamic = 'force-dynamic';

const stockCache = new MemoryCache<any>(
  2 * 60 * 1000,   // 2 minutes TTL
  5 * 60 * 1000,   // 5 minutes Stale While Revalidate
  10 * 60 * 1000   // 10 minutes Cleanup interval
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ success: false, error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const data = await stockCache.getOrUpdate(symbol, async () => {
      // 1. Fetch periods & try Alpha Vantage first
      const [periods, avNews, avOverview] = await Promise.all([
        fetchMultiPeriodChange_(symbol),
        import('@/lib/alphaVantage').then(m => m.fetchAlphaVantageNews(symbol)).catch(() => null),
        import('@/lib/alphaVantage').then(m => m.fetchAlphaVantageOverview(symbol)).catch(() => null)
      ]);
      
      // 2. Fallback to Yahoo if Alpha Vantage returns null (e.g. rate limit hit)
      const news = avNews || await fetchStockNews(symbol);
      const bizInfo = avOverview || await fetchBizInfo_(symbol);
      
      const sentiment = analyzeNewsSentiment_(news);
      
      const enriched = {
        ...periods,
        ...bizInfo,
        symbol,
        news: (sentiment.items || news).slice(0, 4),
        sentiment: { score: sentiment.score, label: sentiment.label, emoji: sentiment.emoji }
      };
      
      autoAnalyze_(enriched);
      
      return enriched;
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}
