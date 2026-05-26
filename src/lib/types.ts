// Stock data interfaces
export interface Stock {
  symbol: string;
  shortName: string;
  longName: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  pe: number | null;
  forwardPE: number | null;
  eps: number | null;
  divYield: number | null;
  fiftyTwoWkPct: number | null;
  exchange: string;
  tier?: string;
  // Deep data (progressive loading)
  sparkline?: number[];
  hasFundamentals?: boolean;
  d1?: number | null;
  d5?: number | null;
  m1?: number | null;
  m6?: number | null;
  y1?: number | null;
  sma50?: number | null;
  ma20?: number | null;
  rsi?: number | null;
  support1?: number | null;
  support2?: number | null;
  resist1?: number | null;
  resist2?: number | null;
  // Business info
  biz?: string;
  sector?: string;
  industry?: string;
  roe?: number | null;
  netMargin?: number | null;
  targetPrice?: number | null;
  recommendation?: string | null;
  shortInterest?: number | null;
  beta?: number | null;
  floatShares?: number | null;
  sharesOutstanding?: number | null;
  // News & sentiment
  news?: StockNews[];
  newsBacklog?: string;
  sentiment?: Sentiment;
  // Analysis
  action?: string;
  reason?: string;
  entryPoint?: string;
  targetPriceStr?: string;
  stopLossStr?: string;
  macdHist?: number | null;
}

export interface StockNews {
  title: string;
  publisher: string;
  link: string;
  snippet: string;
  timestamp: number | null;
  thumbnail: string;
  sentimentScore?: number;
}

export interface Sentiment {
  score: number;
  label: 'bullish' | 'bearish' | 'neutral';
  emoji: string;
  items?: StockNews[];
}

export interface AIResult {
  aiAnalysis: string;
  aiNewsSummary: string;
  aiSentiment: {
    score: number;
    label: 'bullish' | 'bearish' | 'neutral';
    emoji: string;
    reason: string;
  };
}

export interface ScreenerResult {
  success: boolean;
  category: string;
  totalScanned: number;
  stocks: Stock[];
  error?: string;
}

export interface MultiPeriodData {
  d1: number | null;
  d5: number | null;
  m1: number | null;
  m6?: number | null;
  y1: number | null;
  sma50?: number;
  ma20?: number;
  rsi?: number | null;
  support1?: number;
  support2?: number;
  resist1?: number;
  resist2?: number;
  sparkline?: number[];
}

export interface BizInfo {
  biz: string;
  sector: string;
  industry: string;
  roe: number | null;
  netMargin: number | null;
  targetPrice: number | null;
  recommendation: string | null;
  shortInterest: number | null;
  beta: number | null;
  floatShares: number | null;
  sharesOutstanding: number | null;
}

export type MarketRegion = 'US' | 'TH';

export interface ExpertPick {
  sym: string;
  tier: string;
}
