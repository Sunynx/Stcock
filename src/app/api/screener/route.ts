import { NextResponse } from 'next/server';
import { fetchScreener, fetchUsMomentumStocks_, fetchThaiMomentumStocks_ } from '@/lib/screenerLogic';
import { MarketRegion } from '@/lib/types';
import { MemoryCache } from '@/lib/memoryCache';

// Force dynamic execution, but we'll use Next.js fetch caching
export const dynamic = 'force-dynamic';

const screenerCache = new MemoryCache<any>(
  5 * 60 * 1000,   // 5 minutes TTL
  10 * 60 * 1000,  // 10 minutes Stale While Revalidate
  15 * 60 * 1000   // 15 minutes Cleanup interval
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'day_gainers';
  const region = (searchParams.get('region') || 'US') as MarketRegion;
  const symbolsStr = searchParams.get('symbols') || '';
  
  const cacheKey = `${category}_${region}_${symbolsStr}`;
  
  try {
    const result = await screenerCache.getOrUpdate(cacheKey, async () => {
      let fetchedResult;
      
      if (category === 'momentum' || category === 'us_momentum') {
        if (region === 'TH') {
          fetchedResult = await fetchThaiMomentumStocks_();
        } else {
          fetchedResult = await fetchUsMomentumStocks_();
        }
      } else if (category === 'expert_picks') {
        const { fetchFallbackStocks_, EXPERT_PICKS_, THAI_EXPERT_PICKS_ } = await import('@/lib/stockData');
        const stocks = await fetchFallbackStocks_(undefined, region);
        const picks = region === 'TH' ? THAI_EXPERT_PICKS_ : EXPERT_PICKS_;
        const tierMap: any = {};
        picks.forEach((e: any) => { tierMap[e.sym] = e.tier; });
        stocks.forEach((s: any) => { if (tierMap[s.symbol]) s.tier = tierMap[s.symbol]; });
        fetchedResult = { success: true, category, totalScanned: stocks.length, stocks };
      } else if (category === 'watchlist') {
        if (!symbolsStr) {
          fetchedResult = { success: true, category, totalScanned: 0, stocks: [] };
        } else {
          const { fetchFallbackStocks_ } = await import('@/lib/stockData');
          const symbols = symbolsStr.split(',').slice(0, 50);
          const stocks = await fetchFallbackStocks_(symbols, region);
          fetchedResult = { success: true, category, totalScanned: stocks.length, stocks };
        }
      } else {
        fetchedResult = await fetchScreener(category);
        if (!fetchedResult.stocks.length) {
           const { fetchFallbackStocks_ } = await import('@/lib/stockData');
           const stocks = await fetchFallbackStocks_(undefined, region);
           fetchedResult = { success: true, category, totalScanned: stocks.length, stocks };
        }
      }
      
      return fetchedResult;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

