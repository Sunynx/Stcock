import React from 'react';
import { Stock } from '@/lib/types';

interface PortfolioSummaryProps {
  stocks: Stock[];
}

export function PortfolioSummary({ stocks }: PortfolioSummaryProps) {
  if (!stocks || stocks.length === 0) return null;

  const totalItems = stocks.length;
  let bullish = 0;
  let bearish = 0;
  
  let topGainer: Stock | null = null;
  let topLoser: Stock | null = null;

  for (const stock of stocks) {
    // Determine bullish/bearish logic based on sentiment or change percentage
    if (stock.sentiment?.label === 'bullish' || (stock.changePct && stock.changePct > 0)) {
      bullish++;
    } else if (stock.sentiment?.label === 'bearish' || (stock.changePct && stock.changePct < 0)) {
      bearish++;
    }

    if (!topGainer || (stock.changePct !== null && topGainer.changePct !== null && stock.changePct > topGainer.changePct)) {
      topGainer = stock;
    }
    if (!topLoser || (stock.changePct !== null && topLoser.changePct !== null && stock.changePct < topLoser.changePct)) {
      topLoser = stock;
    }
  }

  const formatPct = (val?: number | null) => {
    if (val == null) return '0.00%';
    const pct = (val * 100).toFixed(2);
    return val > 0 ? `+${pct}%` : `${pct}%`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">ภาพรวมพอร์ตโฟลิโอ (Portfolio Summary)</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
          <div className="text-xs text-white/50 mb-1">จำนวนรายการ (Total Assets)</div>
          <div className="text-2xl font-bold text-white">{totalItems}</div>
        </div>

        {/* Bullish vs Bearish */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
          <div className="text-xs text-white/50 mb-1">ทิศทาง (Market Bias)</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-emerald-400 font-semibold">{bullish} 🟢</span>
            <span className="text-white/30">/</span>
            <span className="text-red-400 font-semibold">{bearish} 🔴</span>
          </div>
        </div>

        {/* Top Gainer */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
          <div className="text-xs text-white/50 mb-1">ผู้ชนะ (Top Gainer)</div>
          {topGainer ? (
            <div className="flex flex-col">
              <span className="font-bold text-white">{topGainer.symbol}</span>
              <span className="text-emerald-400 text-sm font-medium">{formatPct(topGainer.changePct)}</span>
            </div>
          ) : (
            <div className="text-white/40">-</div>
          )}
        </div>

        {/* Top Loser */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
          <div className="text-xs text-white/50 mb-1">ผู้แพ้ (Top Loser)</div>
          {topLoser ? (
            <div className="flex flex-col">
              <span className="font-bold text-white">{topLoser.symbol}</span>
              <span className="text-red-400 text-sm font-medium">{formatPct(topLoser.changePct)}</span>
            </div>
          ) : (
            <div className="text-white/40">-</div>
          )}
        </div>
      </div>
    </div>
  );
}
