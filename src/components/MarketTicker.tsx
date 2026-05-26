'use client';

import { useState, useEffect } from 'react';

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePct: string;
  isUp: boolean;
}

const FALLBACK_INDICES: TickerItem[] = [
  { symbol: 'SPY', name: 'S&P 500', price: '---', change: '---', changePct: '---', isUp: true },
  { symbol: 'QQQ', name: 'NASDAQ', price: '---', change: '---', changePct: '---', isUp: true },
  { symbol: 'DIA', name: 'DOW', price: '---', change: '---', changePct: '---', isUp: true },
  { symbol: 'BTC-USD', name: 'Bitcoin', price: '---', change: '---', changePct: '---', isUp: true },
  { symbol: 'GC=F', name: 'Gold', price: '---', change: '---', changePct: '---', isUp: true },
];

export default function MarketTicker() {
  const [indices, setIndices] = useState<TickerItem[]>(FALLBACK_INDICES);

  useEffect(() => {
    async function fetchIndices() {
      try {
        const symbols = ['SPY', 'QQQ', 'DIA', 'BTC-USD', 'GC=F'];
        const names: Record<string, string> = { 'SPY': 'S&P 500', 'QQQ': 'NASDAQ', 'DIA': 'DOW', 'BTC-USD': 'Bitcoin', 'GC=F': 'Gold' };
        
        const results = await Promise.all(
          symbols.map(async (sym) => {
            try {
              const res = await fetch(`/api/stock?symbol=${sym}`);
              const data = await res.json();
              if (data.success && data.data) {
                const d = data.data;
                const price = d.sparkline?.[d.sparkline.length - 1];
                const prevPrice = d.sparkline?.[d.sparkline.length - 2];
                const change = price && prevPrice ? price - prevPrice : null;
                const changePct = d.d1;
                const isUp = (changePct ?? 0) >= 0;
                return {
                  symbol: sym,
                  name: names[sym] || sym,
                  price: price ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '---',
                  change: change ? (change >= 0 ? '+' : '') + change.toFixed(2) : '---',
                  changePct: changePct != null ? (changePct >= 0 ? '+' : '') + (changePct * 100).toFixed(2) + '%' : '---',
                  isUp,
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        
        const valid = results.filter(Boolean) as TickerItem[];
        if (valid.length > 0) setIndices(valid);
      } catch {
        // Keep fallback
      }
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 300000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Duplicate items for seamless infinite scroll
  const allItems = [...indices, ...indices];

  return (
    <div className="w-full bg-surface/80 backdrop-blur-xl border-b border-border/30 overflow-hidden relative z-40">
      <div className="flex items-center ticker-scroll whitespace-nowrap py-1.5 md:py-2">
        {allItems.map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 border-r border-border/20 last:border-r-0">
            <span className="text-[0.65rem] md:text-[0.7rem] font-bold text-muted uppercase tracking-wider">{item.name}</span>
            <span className="text-[0.7rem] md:text-xs font-bold text-text">{item.price}</span>
            <span className={`text-[0.6rem] md:text-[0.65rem] font-bold ${item.isUp ? 'text-green' : 'text-red'}`}>
              {item.changePct}
            </span>
            <span className={`w-0 h-0 ${item.isUp 
              ? 'border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] md:border-b-[5px] border-b-green' 
              : 'border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] md:border-t-[5px] border-t-red'
            }`}></span>
          </div>
        ))}
      </div>
    </div>
  );
}
