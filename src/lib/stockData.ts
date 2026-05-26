import { simpleFetch_, authFetch_, getYFAuth_ } from './yahoo';

export const EXPERT_PICKS_ = [
  { sym: 'NVDA',  tier: '🔵 AI Infra' },   { sym: 'MSFT',  tier: '🔵 AI Infra' },
  { sym: 'GOOGL', tier: '🔵 AI Infra' },   { sym: 'META',  tier: '🔵 AI Infra' },
  { sym: 'AVGO',  tier: '🔵 AI Infra' },   { sym: 'AAPL',  tier: '⚪ Consumer' },
  { sym: 'AMZN',  tier: '⚪ Consumer' },   { sym: 'LLY',   tier: '🟢 Healthcare' },
  { sym: 'UNH',   tier: '🟢 Healthcare' }, { sym: 'V',     tier: '🟡 Financials' },
  { sym: 'JPM',   tier: '🟡 Financials' }, { sym: 'XOM',   tier: '🔴 Energy' },
  { sym: 'CRM',   tier: '⚪ SaaS' },       { sym: 'COST',  tier: '⚪ Consumer' },
  { sym: 'PG',    tier: '⚪ Consumer' },    { sym: 'TSLA',  tier: '🔵 Tech' },
  { sym: 'AMD',   tier: '🔵 AI Infra' },   { sym: 'PLTR',  tier: '🔵 AI Software' },
  { sym: 'NFLX',  tier: '⚪ Consumer' },   { sym: 'ARM',   tier: '🔵 AI Infra' },
];

export const THAI_EXPERT_PICKS_: { sym: string, tier: string }[] = [
  { sym: 'PTT.BK', tier: '🔴 Energy' },      { sym: 'AOT.BK', tier: '🔵 Transportation' },
  { sym: 'CPALL.BK', tier: '⚪ Commerce' },  { sym: 'ADVANC.BK', tier: '🔵 ICT' },
  { sym: 'BDMS.BK', tier: '🟢 Healthcare' }, { sym: 'DELTA.BK', tier: '🔵 Tech' },
  { sym: 'SCB.BK', tier: '🟡 Financials' },  { sym: 'KBANK.BK', tier: '🟡 Financials' },
  { sym: 'GULF.BK', tier: '🔴 Energy' },     { sym: 'SCC.BK', tier: '⚪ Materials' },
];

export const POPULAR_STOCKS_ = EXPERT_PICKS_.map(e => e.sym);

import { MarketRegion } from './types';

export async function fetchFallbackStocks_(customSymbols?: string[], region: MarketRegion = 'US') {
  const symbols = customSymbols || (region === 'TH' ? THAI_EXPERT_PICKS_.map(e => e.sym) : POPULAR_STOCKS_);
  const results = [];
  
  // Use Promise.all for parallel fetching in Node.js
  const fetchPromises = symbols.map(async (sym) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d&includePrePost=false`;
      const j = await simpleFetch_(url);
      const meta = j?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;

      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const ch = price - prev;
      const chP = prev ? ch / prev : 0;

      return {
        symbol: sym,
        shortName: meta.shortName || sym,
        longName: meta.longName || meta.shortName || sym,
        price: price,
        change: ch,
        changePct: chP,
        volume: meta.regularMarketVolume ?? null,
        avgVolume: meta.averageDailyVolume3Month ?? null,
        marketCap: null,
        pe: null, forwardPE: null, eps: null, divYield: null,
        fiftyTwoWkPct: null,
        exchange: meta.exchangeName ?? ''
      };
    } catch (_) {
      return null;
    }
  });

  const resolved = await Promise.all(fetchPromises);
  const valid = resolved.filter(Boolean);
  // Sort by absolute change% descending
  valid.sort((a, b) => Math.abs(b!.changePct ?? 0) - Math.abs(a!.changePct ?? 0));
  return valid;
}

export async function fetchScreener(category: string, count = 25) {
  const scrIds: Record<string, string> = {
    'day_gainers':              'day_gainers',
    'most_actives':             'most_actives',
    'undervalued_growth_stocks':'undervalued_growth_stocks',
    'small_cap_gainers':        'small_cap_gainers'
  };
  const scrId = scrIds[category] || 'day_gainers';

  try {
    const auth = await getYFAuth_();
    const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&scrIds=${scrId}&start=0&count=${count}&corsDomain=finance.yahoo.com`;
    
    let j = await authFetch_(url, auth);
    if (!j) j = await simpleFetch_(url);
    if (!j) throw new Error('HTTP request failed');

    const quotes = j?.finance?.result?.[0]?.quotes ?? [];

    return quotes.map((q: any) => ({
      symbol:     q.symbol || '',
      shortName:  q.shortName || q.longName || q.symbol || '',
      longName:   q.longName || q.shortName || '',
      price:      q.regularMarketPrice?.raw ?? q.regularMarketPrice ?? null,
      change:     q.regularMarketChange?.raw ?? q.regularMarketChange ?? null,
      changePct:  ((q.regularMarketChangePercent?.raw ?? q.regularMarketChangePercent ?? 0) / 100),
      volume:     q.regularMarketVolume?.raw ?? q.regularMarketVolume ?? null,
      avgVolume:  q.averageDailyVolume3Month?.raw ?? q.averageDailyVolume3Month ?? null,
      marketCap:  q.marketCap?.raw ?? q.marketCap ?? null,
      pe:         q.trailingPE?.raw ?? q.trailingPE ?? null,
      forwardPE:  q.forwardPE?.raw ?? q.forwardPE ?? null,
      eps:        q.epsTrailingTwelveMonths?.raw ?? q.epsTrailingTwelveMonths ?? null,
      divYield:   q.trailingAnnualDividendYield?.raw ?? q.dividendYield?.raw ?? null,
      fiftyTwoWkPct: q.fiftyTwoWeekChangePercent?.raw ?? null,
      exchange:   q.exchange ?? q.fullExchangeName ?? ''
    }));
  } catch (e) {
    console.error('fetchScreener error:', e);
    return [];
  }
}

export async function fetchStockNews(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=6&quotesCount=0&listsCount=0&enableFuzzyQuery=false&lang=en-US`;
    const j = await simpleFetch_(url);
    if (!j) return [];

    const news = j?.news ?? [];

    return news.map((n: any) => ({
      title:     n.title || '',
      publisher: n.publisher || '',
      link:      n.link || '',
      snippet:   n.title || '',
      timestamp: n.providerPublishTime ?? null,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url ?? ''
    }));
  } catch (e) {
    console.error('fetchStockNews error for ' + symbol + ':', e);
    return [];
  }
}

const POS_EN_ = ['profit','growth','record','beat','beats','upgrade','upgraded','surge','surges','surged','rally','rallies','bullish','soar','soars','soared','jump','jumps','jumped','gain','gains','gained','strong','boom','breakout','outperform','buy','positive','optimistic','expansion','revenue','dividend','innovation','launch','partnership','deal','milestone','exceed','exceeds','exceeded','approve','approved','breakthrough','recovery','recover','recovered'];
const NEG_EN_ = ['loss','losses','decline','declined','downgrade','downgraded','crash','crashed','bear','bearish','plunge','plunged','drop','drops','dropped','fell','fall','falls','weak','sell','negative','pessimistic','layoff','layoffs','lawsuit','debt','default','bankruptcy','fraud','warning','miss','missed','cut','cuts','risk','recession','inflation','investigation','probe','scandal','suspend','suspended'];
const POS_TH_ = ['กำไร','เติบโต','สูงสุด','พุ่ง','ทะยาน','บวก','ปันผล','รายได้เพิ่ม','แนวโน้มดี','ผลประกอบการดี','เป้าหมาย','โต','ขยาย','นวัตกรรม','ดีล','ร่วมมือ','อนุมัติ','ฟื้นตัว','สัญญาณซื้อ','มูลค่าเพิ่ม','โตแกร่ง'];
const NEG_TH_ = ['ขาดทุน','ร่วง','ดิ่ง','ลบ','ตก','หนี้','ฟ้อง','ปรับลด','เตือน','ความเสี่ยง','ขายทิ้ง','พักการซื้อขาย','ผิดนัด','ล้มละลาย','สอบสวน','ปลด','เลิกจ้าง'];

export function analyzeNewsSentiment_(newsItems: any[]) {
  if (!newsItems || !newsItems.length) return { score: 0, label: 'neutral', emoji: '🟡' };

  let totalScore = 0;
  const analyzed = newsItems.map(item => {
    const text = ((item.title || '') + ' ' + (item.snippet || '')).toLowerCase();
    let s = 0;
    POS_EN_.forEach(w => { if (text.includes(w)) s++; });
    NEG_EN_.forEach(w => { if (text.includes(w)) s--; });
    POS_TH_.forEach(w => { if (text.includes(w)) s++; });
    NEG_TH_.forEach(w => { if (text.includes(w)) s--; });
    totalScore += s;
    return { ...item, sentimentScore: s };
  });

  const avg = totalScore / newsItems.length;
  let label, emoji;
  if (avg > 0.3) { label = 'bullish'; emoji = '🟢'; }
  else if (avg < -0.3) { label = 'bearish'; emoji = '🔴'; }
  else { label = 'neutral'; emoji = '🟡'; }

  return { score: Math.round(avg * 100) / 100, label, emoji, items: analyzed };
}

export async function fetchBizInfo_(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile,financialData,defaultKeyStatistics`;
    let j = await simpleFetch_(url);
    if (!j) return {};
    
    const profile = j?.quoteSummary?.result?.[0]?.assetProfile ?? {};
    const fin = j?.quoteSummary?.result?.[0]?.financialData ?? {};
    const stats = j?.quoteSummary?.result?.[0]?.defaultKeyStatistics ?? {};

    let biz = '';
    const summary = profile.longBusinessSummary || '';
    if (summary) {
      const sentences = summary.split(/\.\s+/);
      const picked = sentences.slice(0, 3).join('. ');
      biz = picked.length > 300 ? picked.substring(0, 297) + '...' : (picked.endsWith('.') ? picked : picked + '.');
    }

    return {
      biz: biz,
      sector: profile.sector || '',
      industry: profile.industry || '',
      roe: fin.returnOnEquity?.raw ?? null,
      netMargin: fin.profitMargins?.raw ?? null,
      targetPrice: fin.targetMeanPrice?.raw ?? null,
      recommendation: fin.recommendationKey ?? null,
      shortInterest: stats.shortPercentOfFloat?.raw ?? null,
      beta: stats.beta?.raw ?? null,
      floatShares: stats.floatShares?.raw ?? null,
      sharesOutstanding: stats.sharesOutstanding?.raw ?? null
    };
  } catch (e) {
    console.error('fetchBizInfo_ error:', e);
    return {};
  }
}

export function buildNewsBacklog_(news: any[]) {
  if (!news || !news.length) return '';
  const items = news.slice(0, 5);
  const headlines = items.map(n => {
    const short = n.title.length > 80 ? n.title.substring(0, 77) + '...' : n.title;
    return '• ' + short;
  });
  return headlines.join('\n');
}

function calculateRSI_(closes: number[], period: number = 14): number | null {
  if (!closes || closes.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Smooth RSI using Wilder's method
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Keep it simple for Momentum pipeline, skipped full technical calculations for speed
export async function fetchMultiPeriodChange_(symbol: string) {
  const result: any = { d1: null, d5: null, m1: null, y1: null, supports: [], resistances: [] };
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y&includePrePost=false`;
    const j = await simpleFetch_(url);
    if (!j) return result;
    
    const res = j?.chart?.result?.[0];
    if (!res) return result;

    const closes = res.indicators?.quote?.[0]?.close ?? [];
    const highs = res.indicators?.quote?.[0]?.high ?? [];
    const lows = res.indicators?.quote?.[0]?.low ?? [];
    
    const price  = res.meta?.regularMarketPrice;
    if (!price || !closes.length) return result;

    result.price = price;
    const prevPrice = res.meta?.chartPreviousClose ?? res.meta?.previousClose ?? price;
    result.change = price - prevPrice;

    const valid = closes.filter((c: number | null) => c != null);
    const len = valid.length;
    if (len < 2) return result;

    const calcPct = (daysBack: number) => {
      const idx = Math.max(0, len - 1 - daysBack);
      const old = valid[idx];
      return old ? (price - old) / old : null;
    };
    result.d1 = calcPct(1);
    result.d5 = calcPct(5);
    result.m1 = calcPct(21);
    result.m6 = calcPct(126);
    result.y1 = calcPct(len - 1);
    
    // SMA50 and MA20
    if (len >= 50) result.sma50 = valid.slice(len - 50).reduce((a:number, b:number) => a + b, 0) / 50;
    if (len >= 20) result.ma20 = valid.slice(len - 20).reduce((a:number, b:number) => a + b, 0) / 20;

    // RSI(14)
    result.rsi = calculateRSI_(valid);

    // Support & Resistance Math (Using local extrema)
    const validHighs = highs.filter((c: number | null) => c != null);
    const validLows = lows.filter((c: number | null) => c != null);
    const hLen = validHighs.length;
    const lLen = validLows.length;
    
    if (hLen >= 20 && lLen >= 20) {
      const last20H = validHighs.slice(hLen - 20);
      const last20L = validLows.slice(lLen - 20);
      result.resist1 = Math.max(...last20H);
      result.support1 = Math.min(...last20L);
      
      if (hLen >= 60 && lLen >= 60) {
        const last60H = validHighs.slice(hLen - 60);
        const last60L = validLows.slice(lLen - 60);
        // Ensure R2 is strictly greater than R1 or distinct
        result.resist2 = Math.max(...last60H);
        result.support2 = Math.min(...last60L);
      }
    }
    
    // Sparkline for 30 days
    if (len > 0) {
      result.sparkline = valid.slice(Math.max(0, len - 30));
    }

  } catch (e) {
    console.error('fetchMultiPeriodChange_ error:', e);
  }
  return result;
}

export function autoAnalyze_(stock: any) {
  // Simple scoring for UI
  let score = 0;
  if (stock.pe != null && stock.pe > 0 && stock.pe < 15) score += 2;
  if (stock.roe != null && stock.roe > 0.25) score += 1;
  if (stock.changePct > 0.03) score += 1;
  if (score >= 3) stock.action = '🟢 ซื้อ — สัญญาณเชิงบวก';
  else if (score >= 1) stock.action = '🟢 น่าสนใจ';
  else stock.action = '🟡 รอจังหวะ';
}
