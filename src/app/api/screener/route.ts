import { NextResponse } from 'next/server';
import { fetchScreener, fetchUsMomentumStocks_, fetchThaiMomentumStocks_ } from '@/lib/screenerLogic';
import { MarketRegion } from '@/lib/types';

// Force dynamic execution, but we'll use Next.js fetch caching
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'day_gainers';
  const region = (searchParams.get('region') || 'US') as MarketRegion;
  
  try {
    let result;
    if (category === 'momentum' || category === 'us_momentum') {
      if (region === 'TH') {
        result = await fetchThaiMomentumStocks_();
      } else {
        result = await fetchUsMomentumStocks_();
      }
    } else if (category === 'expert_picks') {
      const { fetchFallbackStocks_, EXPERT_PICKS_, THAI_EXPERT_PICKS_ } = await import('@/lib/stockData');
      const stocks = await fetchFallbackStocks_(undefined, region);
      const picks = region === 'TH' ? THAI_EXPERT_PICKS_ : EXPERT_PICKS_;
      const tierMap: any = {};
      picks.forEach((e: any) => { tierMap[e.sym] = e.tier; });
      stocks.forEach((s: any) => { if (tierMap[s.symbol]) s.tier = tierMap[s.symbol]; });
      result = { success: true, category, totalScanned: stocks.length, stocks };
    } else if (category === 'watchlist') {
      const symbolsStr = searchParams.get('symbols');
      if (!symbolsStr) {
        result = { success: true, category, totalScanned: 0, stocks: [] };
      } else {
        const { fetchFallbackStocks_ } = await import('@/lib/stockData');
        const symbols = symbolsStr.split(',').slice(0, 50);
        const stocks = await fetchFallbackStocks_(symbols, region);
        result = { success: true, category, totalScanned: stocks.length, stocks };
      }
    } else {
      result = await fetchScreener(category);
      if (!result.stocks.length) {
         const { fetchFallbackStocks_ } = await import('@/lib/stockData');
         const stocks = await fetchFallbackStocks_(undefined, region);
         result = { success: true, category, totalScanned: stocks.length, stocks };
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

