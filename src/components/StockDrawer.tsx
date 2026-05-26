'use client';

import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';

const DetailRow = ({ label, val, highlight }: { label: string; val: React.ReactNode, highlight?: boolean }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-1 border ${highlight ? 'bg-accent/10 border-accent/20' : 'bg-card border-white/5'}`}>
    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">{label}</label>
    <div className={`text-lg font-bold ${highlight ? 'text-accent' : 'text-white'}`}>{val}</div>
  </div>
);

const ChgPill = ({ label, val }: { label: string; val: number }) => {
  if (val == null) return null;
  const up = val >= 0;
  return (
    <div className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center ${up ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
      <span className="text-[0.65rem] font-bold uppercase tracking-wider opacity-80 mb-0.5">{label}</span>
      <span className="font-bold text-sm">{up ? '+' : ''}{(val * 100).toFixed(2)}%</span>
    </div>
  );
};

const RSIGauge = ({ value }: { value: number | null | undefined }) => {
  if (value == null) return <div className="text-muted text-sm">N/A</div>;
  const clamped = Math.max(0, Math.min(100, value));
  const angle = -90 + (clamped / 100) * 180; // -90 to 90 degrees
  const color = clamped > 70 ? '#ff4a6e' : clamped < 30 ? '#00e4a0' : '#ffc947';
  const label = clamped > 70 ? 'Overbought' : clamped < 30 ? 'Oversold' : 'Neutral';
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Background arc */}
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="6" className="text-card" />
          {/* Green zone */}
          <path d="M 5 50 A 45 45 0 0 1 23 14" fill="none" stroke="#00e4a0" strokeWidth="6" strokeOpacity="0.3" />
          {/* Yellow zone */}
          <path d="M 23 14 A 45 45 0 0 1 77 14" fill="none" stroke="#ffc947" strokeWidth="6" strokeOpacity="0.3" />
          {/* Red zone */}
          <path d="M 77 14 A 45 45 0 0 1 95 50" fill="none" stroke="#ff4a6e" strokeWidth="6" strokeOpacity="0.3" />
        </svg>
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-0.5 h-14 origin-bottom gauge-animate"
          style={{ 
            transform: `translateX(-50%) rotate(${angle}deg)`,
            background: `linear-gradient(to top, ${color}, transparent)` 
          }}
        >
          <div className="w-2 h-2 rounded-full absolute -top-1 -left-[3px]" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
        </div>
        {/* Center dot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-surface border-2" style={{ borderColor: color }}></div>
      </div>
      <div className="text-2xl font-black mt-1" style={{ color }}>{clamped.toFixed(0)}</div>
      <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted">{label}</div>
    </div>
  );
};

export default function StockDrawer({ stock, onClose }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'ai' | 'news'>('overview');
  const [aiError, setAiError] = useState<string | null>(null);

  // Slide-in animation state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (stock) {
      setMounted(true);
      setData(stock);
      setAiResult(null);
      setActiveTab('overview');
      if (!stock.hasFundamentals) {
        setLoading(true);
        fetch(`/api/stock?symbol=${stock.symbol}`)
          .then(res => res.json())
          .then(res => {
            if (res.success) setData((prev: any) => ({ ...prev, ...res.data, hasFundamentals: true }));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    } else {
      setMounted(false);
    }
  }, [stock]);

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const fundamentals = `ราคา: ${data.price}, P/E: ${data.pe}, RSI: ${data.rsi}, MACD: ${data.macdHist}, 5D: ${data.d5}`;
      const headlines = data.news?.map((n: any) => `${n.title}\n  Summary: ${n.snippet || ''}\n  Sentiment Score: ${n.sentimentScore !== undefined ? n.sentimentScore : 'N/A'}`).join('\n\n') || '';
      
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: data.symbol, fundamentals, headlines })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setAiError(errJson.error || 'Unknown error');
        setAiLoading(false);
        return;
      }

      setAiLoading(false);
      setAiResult('');

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAiResult((prev: any) => (prev || '') + chunk);
      }
    } catch (e) {
      setAiError('ไม่สามารถเชื่อมต่อ AI ได้');
      setAiLoading(false);
    }
  };

  const displayData = data || stock;
  if (!displayData) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[600px] bg-surface/95 backdrop-blur-2xl border-l border-border/50 z-50 shadow-2xl flex flex-col transition-transform duration-500 ease-out ${mounted ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-accent/80">
                {displayData.symbol}
              </h2>
              {displayData.sentiment?.emoji && (
                <span className="text-2xl">{displayData.sentiment.emoji}</span>
              )}
            </div>
            <p className="text-muted text-sm font-medium">{displayData.longName || displayData.shortName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-white/5 text-muted hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex gap-6 px-6 pt-4 border-b border-border/30 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'chart', label: 'Chart' },
            { id: 'ai', label: 'AI Analysis', highlight: true },
            { id: 'news', label: 'News Feed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${
                activeTab === tab.id 
                  ? tab.highlight ? 'text-accent2 drop-shadow-[0_0_8px_rgba(0,228,160,0.5)]' : 'text-white' 
                  : 'text-muted hover:text-white/80'
              }`}
            >
              {tab.highlight && activeTab !== tab.id && <span className="mr-1.5 opacity-80">✨</span>}
              {tab.label}
              {activeTab === tab.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${tab.highlight ? 'bg-accent2 shadow-[0_0_10px_rgba(0,228,160,1)]' : 'bg-accent'}`}></div>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm font-medium text-muted animate-pulse">Syncing deep market data...</div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {displayData.biz && (
                    <div className="text-sm text-muted/90 leading-relaxed font-medium bg-card/30 p-5 rounded-2xl border border-white/5 fade-in-up">
                      {displayData.biz}
                    </div>
                  )}

                  <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Key Metrics</h3>
                    <div className="flex gap-6 mb-5">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <DetailRow label="Price" val={displayData.price ? `$${displayData.price.toFixed(2)}` : '---'} highlight />
                        <DetailRow label="P/E Ratio" val={displayData.pe ? displayData.pe.toFixed(1) : '---'} />
                        <DetailRow label="Target Price" val={displayData.targetPrice ? `$${displayData.targetPrice.toFixed(2)}` : '---'} />
                        <DetailRow label="SMA 50" val={displayData.sma50 ? `$${displayData.sma50.toFixed(2)}` : '---'} />
                        <DetailRow label="Short %" val={displayData.shortInterest ? `${(displayData.shortInterest * 100).toFixed(2)}%` : '---'} />
                      </div>
                      <div className="flex flex-col items-center justify-center bg-card/30 rounded-2xl border border-white/5 p-4 min-w-[160px]">
                        <h4 className="text-[0.6rem] font-bold uppercase tracking-widest text-muted mb-2">RSI (14)</h4>
                        <RSIGauge value={displayData.rsi} />
                      </div>
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Support & Resistance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <DetailRow label="Resistance 2" val={displayData.resist2 ? `$${displayData.resist2.toFixed(2)}` : '---'} />
                      <DetailRow label="Resistance 1" val={displayData.resist1 ? `$${displayData.resist1.toFixed(2)}` : '---'} />
                      <DetailRow label="Support 1" val={displayData.support1 ? `$${displayData.support1.toFixed(2)}` : '---'} />
                      <DetailRow label="Support 2" val={displayData.support2 ? `$${displayData.support2.toFixed(2)}` : '---'} />
                    </div>
                  </div>

                  <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Momentum (Change)</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <ChgPill label="1 Day" val={displayData.d1} />
                      <ChgPill label="5 Day" val={displayData.d5} />
                      <ChgPill label="1 Mth" val={displayData.m1} />
                      <ChgPill label="6 Mth" val={displayData.m6} />
                      <ChgPill label="1 Yr" val={displayData.y1} />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CHART */}
              {activeTab === 'chart' && (
                <div className="h-[400px] md:h-[500px] w-full bg-bg rounded-2xl overflow-hidden border border-border">
                  <iframe 
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_123&symbol=${displayData.symbol.endsWith('.BK') ? 'SET:' + displayData.symbol.replace('.BK', '') : displayData.symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=161628&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    allowFullScreen={true}
                  ></iframe>
                </div>
              )}

              {/* TAB: AI ANALYSIS */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {!aiResult && !aiLoading && (
                    <div className="text-center py-10 bg-card/30 rounded-3xl border border-white/5">
                      <div className="text-5xl mb-4 opacity-80">🤖</div>
                      <h3 className="text-lg font-bold text-white mb-2">StockSense Pro AI</h3>
                      <p className="text-sm text-muted max-w-sm mx-auto mb-6">
                        Unlock deep insights using Gemini 2.0. We will analyze the technicals, fundamentals, and latest news simultaneously.
                      </p>
                      <button 
                        onClick={handleAiAnalyze} 
                        className="px-6 py-3 text-sm bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      >
                        ✨ Run Full Analysis
                      </button>
                    </div>
                  )}
                  
                  {aiLoading && (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xl">✨</div>
                      </div>
                      <div className="text-sm font-bold text-accent animate-pulse tracking-widest uppercase">Processing millions of data points...</div>
                    </div>
                  )}

                  {aiError && (
                    <div className="text-center py-8 bg-red-500/5 rounded-3xl border border-red-500/20">
                      <div className="text-4xl mb-3 opacity-80">⚠️</div>
                      <h3 className="text-sm font-bold text-red-400 mb-2">AI Analysis Failed</h3>
                      <p className="text-xs text-muted mb-4">{aiError}</p>
                      <button
                        onClick={handleAiAnalyze}
                        className="px-4 py-2 text-xs bg-card border border-white/10 rounded-full font-bold text-white hover:bg-white/10 transition-all"
                      >
                        🔄 ลองใหม่
                      </button>
                    </div>
                  )}

                  {aiResult !== null && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-gradient-to-br from-card to-bg p-6 rounded-3xl border border-accent/20 shadow-[0_10px_40px_rgba(124,92,252,0.1)]">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                          Live Analysis
                        </h3>
                        <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-medium">
                          {aiResult || <span className="animate-pulse">Analyzing...</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: NEWS */}
              {activeTab === 'news' && (
                <div className="space-y-4">
                  {displayData.news && displayData.news.length > 0 ? (
                    displayData.news.map((n: any, i: number) => {
                      const dc = n.sentimentScore > 0 ? 'bg-green-400 shadow-[0_0_10px_rgba(0,228,160,0.5)]' : n.sentimentScore < 0 ? 'bg-red-400 shadow-[0_0_10px_rgba(255,74,110,0.5)]' : 'bg-yellow-400 shadow-[0_0_10px_rgba(255,201,71,0.5)]';
                      return (
                        <a 
                          key={i} 
                          href={n.link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="group flex gap-4 p-4 rounded-2xl bg-card/30 border border-white/5 hover:bg-card hover:border-white/10 transition-all duration-300"
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dc}`}></div>
                          <div>
                            <h4 className="text-sm font-semibold text-white/90 group-hover:text-accent transition-colors leading-snug mb-1">
                              {n.title}
                            </h4>
                            <div className="text-xs text-muted font-medium">{n.publisher}</div>
                          </div>
                        </a>
                      );
                    })
                  ) : (
                    <div className="text-center py-20 text-muted">
                      No recent news found for this symbol.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
