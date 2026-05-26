'use client';

import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import Sparkline from './Sparkline';
import { formatNumber } from '@/lib/utils';

export default function StockCard({ stock: initialStock, rank, onClick, onToggleWatchlist, isWatchlisted }: any) {
  const [stock, setStock] = useState(initialStock);
  const [loading, setLoading] = useState(false);

  // 3D tilt effect
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -4;
    const rotateY = (x - centerX) / centerX * 4;
    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)',
      transition: 'transform 0.5s ease-out'
    });
  };

  // Price flash
  const prevPrice = useRef(initialStock.price);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (prevPrice.current !== stock.price && stock.price != null) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 600);
      prevPrice.current = stock.price;
      return () => clearTimeout(timer);
    }
  }, [stock.price]);

  // Progressive Loading for Deep Data
  useEffect(() => {
    // If we only have basic screener data (no sparkline/news), fetch it silently
    if (!stock.sparkline && !stock.hasFundamentals) {
      setLoading(true);
      fetch(`/api/stock?symbol=${stock.symbol}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setStock((prev: any) => ({ ...prev, ...res.data, hasFundamentals: true }));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [stock.symbol, stock.sparkline, stock.hasFundamentals]);

  const up = (stock.changePct || 0) >= 0;
  
  // Swipe-to-action logic
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current > 0) {
      const diff = touchStartX.current - e.touches[0].clientX;
      if (diff > 0 && diff < 100) { // Only swipe left, max 100px
        setSwipeOffset(-diff);
      }
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -60) {
      try {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      } catch (e) {}
      onToggleWatchlist(stock.symbol);
    }
    setSwipeOffset(0);
    touchStartX.current = 0;
  };
  
  return (
    <div 
      className="relative group h-full card-entrance"
      style={{ animationDelay: `${(rank ? rank - 1 : 0) * 0.06}s` }}
    >
      {/* Swipe Background */}
      <div className="absolute inset-0 bg-accent/20 rounded-[2rem] flex items-center justify-end px-6 transition-opacity" style={{ opacity: swipeOffset < -30 ? 1 : 0 }}>
        <svg className="w-8 h-8 text-accent" fill={isWatchlisted ? "none" : "currentColor"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
      </div>

      <div 
        ref={cardRef}
        className="bg-surface/60 backdrop-blur-xl border border-border/60 hover:border-accent/50 rounded-[2rem] p-5 cursor-pointer hover:shadow-[0_15px_40px_rgba(124,92,252,0.15)] relative flex flex-col h-full overflow-hidden z-10 transition-shadow"
        style={{ ...(swipeOffset !== 0 ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' } : tiltStyle) }}
        onClick={() => onClick(stock)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-purple-500 to-accent2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Top Header Row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {rank && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-extrabold text-sm border border-accent/20 shrink-0">
              {rank}
            </div>
          )}
          <div>
            <h3 className="text-xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-accent/80 transition-all truncate max-w-[150px]">
              {stock.symbol}
            </h3>
            <p className="text-[0.65rem] text-muted font-medium uppercase tracking-widest truncate max-w-[140px]">{stock.exchange}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button 
            className={`p-1.5 -mr-1.5 -mt-1.5 rounded-full transition-all hover:bg-white/5 ${isWatchlisted ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(255,201,71,0.5)] scale-110' : 'text-muted hover:text-white'}`}
            onClick={(e) => { 
              e.stopPropagation(); 
              try {
                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(50);
                }
              } catch (e) {}
              onToggleWatchlist(stock.symbol); 
            }}
          >
            <svg className="w-5 h-5" fill={isWatchlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </button>
        </div>
      </div>

      {/* Main Price & Sparkline Row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className={`text-3xl font-black text-white tracking-tight ${isFlashing ? 'price-flash' : ''} rounded-lg px-1 -mx-1 transition-colors`}>
            ${stock.price?.toFixed(2) || '---'}
          </div>
          <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${up ? 'text-green-400' : 'text-red-400'}`}>
            {up ? '+' : ''}{(stock.changePct * 100).toFixed(2)}%
          </div>
        </div>

        <div className="flex-shrink-0">
          {loading ? (
             <div className="w-[100px] h-[40px] rounded-lg shimmer-bg opacity-30"></div>
          ) : stock.sparkline ? (
             <Sparkline data={stock.sparkline} width={100} height={40} />
          ) : null}
        </div>
      </div>

      {/* Dense Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-card/30 p-3 rounded-2xl border border-white/5">
        <div className="flex flex-col">
          <span className="text-[0.6rem] text-muted font-bold uppercase tracking-wider">Vol (Avg)</span>
          <span className="text-xs font-bold text-white/90">{formatNumber(stock.volume)} <span className="text-muted font-medium">({formatNumber(stock.avgVolume)})</span></span>
        </div>
        <div className="flex flex-col border-l border-white/5 pl-2">
          <span className="text-[0.6rem] text-muted font-bold uppercase tracking-wider">P/E</span>
          <span className="text-xs font-bold text-white/90">{stock.pe ? stock.pe.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex flex-col border-l border-white/5 pl-2">
          <span className="text-[0.6rem] text-muted font-bold uppercase tracking-wider">Support 1</span>
          <span className="text-xs font-bold text-white/90">
            {loading ? '...' : stock.support1 ? `$${stock.support1.toFixed(2)}` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Period Changes Grid */}
      <div className="flex justify-between items-center mb-4 px-1">
        {[
          { label: '5D', val: stock.d5 },
          { label: '1M', val: stock.m1 },
          { label: '6M', val: stock.m6 },
          { label: '1Y', val: stock.y1 },
        ].map((period, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[0.6rem] text-muted font-bold uppercase tracking-wider mb-0.5">{period.label}</span>
            {loading && !stock.hasFundamentals ? (
              <span className="w-8 h-3 rounded shimmer-bg opacity-30"></span>
            ) : period.val != null ? (
              <span className={`text-xs font-bold ${period.val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {period.val >= 0 ? '+' : ''}{(period.val * 100).toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs font-bold text-muted">---</span>
            )}
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {stock.action && stock.action.includes('🟢') && (
          <span className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
            Setup Active
          </span>
        )}
        {stock.sentiment && stock.sentiment.label !== 'neutral' && (
          <span className={`px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-lg border flex items-center gap-1 ${stock.sentiment.label === 'bullish' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {stock.sentiment.emoji} {stock.sentiment.label}
          </span>
        )}
      </div>

      {/* News Feed - Progressive Load */}
      <div className="mt-auto border-t border-border/50 pt-3 relative">
        <div className="text-[0.65rem] font-bold text-muted uppercase tracking-wider mb-2 flex justify-between">
          <span>Latest Catalysts</span>
          {loading && <span className="animate-pulse text-accent">Syncing...</span>}
        </div>
        
        {loading && !stock.news ? (
          <div className="space-y-2 opacity-50">
            <div className="h-3 w-full rounded shimmer-bg"></div>
            <div className="h-3 w-3/4 rounded shimmer-bg"></div>
          </div>
        ) : stock.news && stock.news.length > 0 ? (
          <div className="space-y-2">
            {stock.news.slice(0, 2).map((n: any, i: number) => {
              const dc = n.sentimentScore > 0 ? 'bg-green-400' : n.sentimentScore < 0 ? 'bg-red-400' : 'bg-yellow-400';
              return (
                <div key={i} className="flex gap-2 items-start text-[0.7rem] leading-snug">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${dc}`}></div>
                  <div className="truncate">
                    <span className="font-semibold text-white/80 hover:text-accent transition-colors mr-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(n.link, '_blank'); }}>
                      {n.title}
                    </span>
                    <span className="text-muted/70 whitespace-nowrap">— {n.publisher}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[0.7rem] text-muted italic">No catalysts found.</div>
        )}
      </div>

    </div>
    </div>
  );
}
