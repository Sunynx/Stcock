import { fetchScreener as fetchScreenerRaw, fetchStockNews, analyzeNewsSentiment_, fetchMultiPeriodChange_, fetchBizInfo_, buildNewsBacklog_, THAI_EXPERT_PICKS_, fetchFallbackStocks_ } from './stockData';

export async function fetchScreener(category: string) {
  const stocks = await fetchScreenerRaw(category);
  // Just return them without deep enrichment to emulate the fast default tabs
  return { success: true, category, totalScanned: stocks.length, stocks };
}

export async function fetchUsMomentumStocks_() {
  try {
    const [g1, g2] = await Promise.all([
      fetchScreenerRaw('day_gainers', 250),
      fetchScreenerRaw('small_cap_gainers', 250)
    ]);
    const combined = [...g1, ...g2];
    
    const seen = new Set();
    const allowedExchanges = ['NMS', 'NGM', 'NCM', 'NYQ', 'NYSE', 'NASDAQ', 'ASE', 'AMEX'];
    let initial = combined.filter((s: any) => {
      if (seen.has(s.symbol)) return false;
      seen.add(s.symbol);
      const ex = s.exchange?.toUpperCase() || '';
      return allowedExchanges.includes(ex) || ex.includes('NYSE') || ex.includes('NASDAQ');
    });

    let phase1 = initial.filter((s: any) => {
      const capOk = s.marketCap != null && s.marketCap < 3e9;
      const priceOk = s.price != null && s.price < 30; 
      const volOk = s.volume != null && ((s.avgVolume && s.volume > (s.avgVolume * 1.5)) || s.volume > 500000); 
      const chgOk = s.changePct != null && s.changePct > 0.03;
      return capOk && priceOk && volOk && chgOk;
    });

    phase1.sort((a: any, b: any) => b.changePct - a.changePct);
    phase1 = phase1.slice(0, 25);
    
    // Process in chunks to prevent Yahoo Finance from blocking us
    const results = [];
    const chunkSize = 5;
    for (let i = 0; i < phase1.length; i += chunkSize) {
      const chunk = phase1.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(async (stock: any) => {
        const news = await fetchStockNews(stock.symbol);
        const sentiment = analyzeNewsSentiment_(news);
        const periods = await fetchMultiPeriodChange_(stock.symbol);
        const bizInfo = await fetchBizInfo_(stock.symbol);
        
        const enriched = {
          ...stock, ...periods, ...bizInfo,
          news: (sentiment.items || news).slice(0, 4),
          newsBacklog: buildNewsBacklog_(sentiment.items || news),
          sentiment: { score: sentiment.score, label: sentiment.label, emoji: sentiment.emoji }
        };

        let floatPct = 1;
        if (bizInfo.floatShares && bizInfo.sharesOutstanding) {
          floatPct = bizInfo.floatShares / bizInfo.sharesOutstanding;
        }
        
        const price = enriched.price || 0;
        const ma20 = enriched.ma20 || 0;
        const rsi = enriched.rsi || 50;
        const macdHist = enriched.macdHist || 0;
        
        const atr = price * 0.08;
        enriched.entryPoint = price.toFixed(2);
        enriched.targetPriceStr = (price + (atr * 2)).toFixed(2);
        enriched.stopLossStr = (price - atr).toFixed(2);

        let theme = 'Momentum Run';
        if (sentiment.label === 'bullish' && enriched.news.length > 0) {
          theme = enriched.news[0].title;
        }
        let techStr = '';
        if (price > ma20) techStr += '📈 เหนือเส้น MA20 ';
        if (macdHist > 0) techStr += '| MACD ตัดขึ้น (Bullish) ';
        if (rsi > 65) techStr += '| RSI แรง (Momentum) ';
        enriched.reason = '🔥 Theme: ' + theme + '\n' + techStr + (floatPct < 0.35 ? '\n🎈 Low Float (' + (floatPct*100).toFixed(0) + '%) ดันราคาง่าย' : '');
        enriched.action = '🔴 High Risk / High Reward Setup';

        return enriched;
      }));
      results.push(...chunkResults);
    }
    
    results.sort((a: any, b: any) => (b.volume / b.avgVolume) - (a.volume / a.avgVolume));
    
    return {
      success: true,
      category: 'us_momentum',
      totalScanned: initial.length,
      stocks: results
    };

  } catch(e: any) {
    console.error('Momentum error:', e);
    return { success: false, error: e.message, stocks: [] };
  }
}

export async function fetchThaiMomentumStocks_() {
  try {
    const fallbackStocks = await fetchFallbackStocks_(THAI_EXPERT_PICKS_.map(s => s.sym), 'TH');
    
    const results = [];
    const chunkSize = 5;
    for (let i = 0; i < fallbackStocks.length; i += chunkSize) {
      const chunk = fallbackStocks.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(async (stock: any) => {
        const news = await fetchStockNews(stock.symbol);
        const sentiment = analyzeNewsSentiment_(news);
        const periods = await fetchMultiPeriodChange_(stock.symbol);
        const bizInfo = await fetchBizInfo_(stock.symbol);
        
        const enriched = {
          ...stock, ...periods, ...bizInfo,
          news: (sentiment.items || news).slice(0, 4),
          newsBacklog: buildNewsBacklog_(sentiment.items || news),
          sentiment: { score: sentiment.score, label: sentiment.label, emoji: sentiment.emoji }
        };

        const price = enriched.price || 0;
        const ma20 = enriched.ma20 || 0;
        const atr = price * 0.08;
        enriched.entryPoint = price.toFixed(2);
        enriched.targetPriceStr = (price + (atr * 2)).toFixed(2);
        enriched.stopLossStr = (price - atr).toFixed(2);

        let theme = 'Thai Momentum';
        if (sentiment.label === 'bullish' && enriched.news.length > 0) {
          theme = enriched.news[0].title;
        }
        enriched.reason = '🇹🇭 Theme: ' + theme;
        enriched.action = price > ma20 ? '🟢 Uptrend' : '🟡 Neutral';

        return enriched;
      }));
      results.push(...chunkResults);
    }
    
    results.sort((a: any, b: any) => (b.changePct || 0) - (a.changePct || 0));
    
    return {
      success: true,
      category: 'momentum',
      totalScanned: THAI_EXPERT_PICKS_.length,
      stocks: results
    };
  } catch(e: any) {
    console.error('Thai Momentum error:', e);
    return { success: false, error: e.message, stocks: [] };
  }
}
