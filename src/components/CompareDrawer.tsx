'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/lib/types';

interface CompareDrawerProps {
  symbols: string[];
  onClose: () => void;
}

export function CompareDrawer({ symbols, onClose }: CompareDrawerProps) {
  const [data, setData] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (symbols && symbols.length > 0) {
      setMounted(true);
      setLoading(true);
      // Fetch data for all symbols
      Promise.all(symbols.map(sym => fetch(`/api/stock?symbol=${sym}`).then(res => res.json())))
        .then(results => {
          const validData = results.filter(r => r.success).map(r => r.data);
          setData(validData);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setMounted(false);
      setData([]);
    }
  }, [symbols]);

  if (!symbols || symbols.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div 
        className={`fixed bottom-0 left-0 w-full h-[80vh] md:h-[60vh] bg-surface/95 backdrop-blur-2xl border-t border-border/50 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-500 ease-out rounded-t-3xl ${mounted ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-accent">📊</span> เปรียบเทียบหุ้น (Compare)
            </h2>
            <p className="text-sm text-white/50 font-medium mt-1">{symbols.length} items selected for comparison</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-all border border-white/5"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4">
               <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
               <div className="text-sm font-medium text-muted animate-pulse">Syncing comparison data...</div>
             </div>
          ) : (
            <div className="overflow-x-auto pb-6">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-white/10 text-xs text-muted uppercase tracking-widest font-bold">Symbol</th>
                    <th className="p-4 border-b border-white/10 text-xs text-muted uppercase tracking-widest font-bold">Price</th>
                    <th className="p-4 border-b border-white/10 text-xs text-muted uppercase tracking-widest font-bold">P/E Ratio</th>
                    <th className="p-4 border-b border-white/10 text-xs text-muted uppercase tracking-widest font-bold">RSI (14)</th>
                    <th className="p-4 border-b border-white/10 text-xs text-muted uppercase tracking-widest font-bold">1M Change</th>
                    <th className="p-4 border-b border-white/10 text-xs text-muted uppercase tracking-widest font-bold">Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(stock => (
                    <tr key={stock.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="font-black text-xl text-white group-hover:text-accent transition-colors">{stock.symbol}</div>
                        <div className="text-xs text-white/40 truncate max-w-[200px] font-medium mt-0.5">{stock.longName || stock.shortName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-lg text-white">
                          {stock.price ? `$${stock.price.toFixed(2)}` : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white/90">
                          {stock.pe ? stock.pe.toFixed(2) : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        {stock.rsi ? (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 w-max ${
                            stock.rsi > 70 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            stock.rsi < 30 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {stock.rsi.toFixed(1)}
                            <span className="opacity-70">
                              {stock.rsi > 70 ? 'Overbought' : stock.rsi < 30 ? 'Oversold' : 'Neutral'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-white/40 text-sm font-medium">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        {stock.m1 != null ? (
                          <span className={`font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 w-max ${stock.m1 >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {stock.m1 >= 0 ? '↗' : '↘'}
                            {stock.m1 >= 0 ? '+' : ''}{(stock.m1 * 100).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-white/40 text-sm font-medium">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        {stock.sentiment ? (
                          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-max">
                            <span className="text-2xl drop-shadow-md">{stock.sentiment.emoji || '🟡'}</span>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{stock.sentiment.label || 'NEUTRAL'}</span>
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm font-medium">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
