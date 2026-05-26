'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import StockCard from '@/components/StockCard';
import StockDrawer from '@/components/StockDrawer';
import MobileHeader from '@/components/MobileHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileSidebarDrawer from '@/components/MobileSidebarDrawer';
import SettingsModal from '@/components/SettingsModal';
import CategoryTabs from '@/components/CategoryTabs';
import MarketTicker from '@/components/MarketTicker';
import SkeletonCard from '@/components/SkeletonCard';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { CompareDrawer } from '@/components/CompareDrawer';

export default function Home() {
  const [activeTab, setActiveTab] = useState('us_momentum');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ category: string, totalScanned: number, stocks: any[] } | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  
  // Mobile specific states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [marketRegion, setMarketRegion] = useState<'US' | 'TH'>('US');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('stocksense_watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
    
    // Check initial theme
    const theme = localStorage.getItem('stocksense_theme');
    if (theme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.add('light');
    }
  }, []);

  const saveWatchlist = (newWl: string[]) => {
    setWatchlist(newWl);
    localStorage.setItem('stocksense_watchlist', JSON.stringify(newWl));
  };

  const fetchFeed = useCallback(async (tab: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      let url = `/api/screener?category=${tab}`;
      if (tab === 'watchlist') {
        const saved = JSON.parse(localStorage.getItem('stocksense_watchlist') || '[]');
        if (saved.length === 0) {
          setData({ category: 'watchlist', totalScanned: 0, stocks: [] });
          setLoading(false);
          return;
        }
        url += `&symbols=${saved.join(',')}`;
      }

      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  // Initial load & Tab change
  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab, fetchFeed]);

  // 3-minute Silent Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedStock) { // don't refresh if drawer is open to save resources
        fetchFeed(activeTab, true);
      }
    }, 180000);
    return () => clearInterval(interval);
  }, [activeTab, fetchFeed, selectedStock]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      setActiveTab(''); // clear tab
      setLoading(true);
      fetch(`/api/stock?symbol=${search.trim().toUpperCase()}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setData({ category: 'search', totalScanned: 1, stocks: [res.data] });
          } else {
            setError(res.error);
            setData({ category: 'search', totalScanned: 0, stocks: [] });
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Search failed');
          setLoading(false);
        });
    }
  };

  const toggleWatchlist = (symbol: string) => {
    const newWl = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    saveWatchlist(newWl);
    
    if (activeTab === 'watchlist' && watchlist.includes(symbol)) {
      setData(prev => prev ? { ...prev, stocks: prev.stocks.filter(s => s.symbol !== symbol) } : null);
    }
  };

  // Quick stats summary for the top bar
  const bullishCount = data?.stocks.filter(s => s.sentiment?.label === 'bullish').length || 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0) {
      touchCurrentY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current > 0 && touchCurrentY.current - touchStartY.current > 100) {
      try {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      } catch (e) {}
      setIsRefreshing(true);
      fetchFeed(activeTab).finally(() => setIsRefreshing(false));
    }
    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('stocksense_theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('stocksense_theme', 'light');
      }
      return newMode;
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col overflow-x-hidden w-full">
      {/* Market Ticker at the absolute top */}
      <MarketTicker />
      
      <div className="flex flex-col md:flex-row max-w-[1600px] mx-auto relative pb-16 md:pb-0 w-full flex-1">
      {/* Mobile Header */}
      <MobileHeader 
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        onToggleTheme={toggleTheme}
        onFocusSearch={() => { document.getElementById('search-input')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        marketRegion={marketRegion}
        onToggleMarket={() => setMarketRegion(prev => prev === 'US' ? 'TH' : 'US')}
      />

      {/* Sidebar (Desktop Only) */}
      <div className="hidden md:flex w-full md:w-64 md:sticky md:top-0 md:h-screen z-20 shrink-0">
        <Sidebar activeTab={activeTab} onSelect={setActiveTab} />
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 flex flex-col pb-24 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 md:px-8 flex-1 flex flex-col mt-4">
        {/* Top Bar */}
        <header className="md:sticky top-0 z-30 py-2 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 md:mb-6">
          <div className="flex-1 max-w-xl relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input 
              id="search-input"
              type="text" 
              placeholder="Search symbol (e.g. AAPL, NVDA) & press Enter..." 
              className="w-full bg-card/50 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent focus:bg-card focus:shadow-[0_0_20px_rgba(124,92,252,0.1)] transition-all backdrop-blur-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          
          <div className="flex items-center gap-4 text-xs md:text-sm text-muted font-medium bg-card/30 px-4 py-2 rounded-xl border border-white/5">
            {loading && !data ? (
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent animate-ping"></span> Syncing...</span>
            ) : error ? (
              <span className="text-red-400">❌ {error}</span>
            ) : data && activeTab !== 'watchlist' ? (
              <div className="flex gap-4">
                <span>Scanned: <strong className="text-white">{data.totalScanned}</strong></span>
                <span className="w-px h-4 bg-border"></span>
                <span className="flex items-center gap-1">🟢 Bullish: <strong className="text-green-400">{bullishCount}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span>Your Watchlist</span>
                {watchlist.length > 1 && (
                  <>
                    <span className="w-px h-4 bg-border"></span>
                    <button 
                      onClick={() => setIsCompareOpen(true)}
                      className="text-accent hover:text-accent2 transition-colors flex items-center gap-1 font-bold"
                    >
                      <span>📊</span> Compare
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Category Tabs inside the header area */}
          <div className="md:hidden w-full -mx-4 px-4 overflow-x-auto scrollbar-hide pt-2 pb-2 border-b border-border/30">
            <CategoryTabs activeTab={activeTab} onSelect={setActiveTab} />
          </div>
        </header>

        {/* Portfolio Summary for Watchlist */}
        {activeTab === 'watchlist' && data?.stocks && data.stocks.length > 0 && (
          <PortfolioSummary stocks={data.stocks} />
        )}

        {/* LAYOUT: Dynamic Grid Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading && !data ? (
            [1,2,3,4,5,6].map(i => (
              <SkeletonCard key={i} />
            ))
          ) : data?.stocks.length === 0 ? (
            <div className="col-span-full text-center py-32 text-muted">
              <div className="text-5xl mb-6 opacity-50">🧭</div>
              <h3 className="text-2xl font-bold text-white mb-2">No signals found</h3>
              <p>Try switching categories or searching for a specific stock.</p>
            </div>
          ) : (
            data?.stocks.map((stock: any, i: number) => (
              <StockCard 
                key={stock.symbol} 
                stock={stock} 
                rank={i + 1}
                isWatchlisted={watchlist.includes(stock.symbol)}
                onToggleWatchlist={toggleWatchlist}
                onClick={setSelectedStock}
              />
            ))
          )}
        </div>
        </div>
      </main>

      {/* Slide-over Drawer */}
      <StockDrawer 
        stock={selectedStock} 
        onClose={() => setSelectedStock(null)} 
      />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebarDrawer 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        activeTab={activeTab} 
        onSelect={setActiveTab} 
      />

      {/* Compare Drawer */}
      {isCompareOpen && (
        <CompareDrawer 
          symbols={watchlist.slice(0, 5)} 
          onClose={() => setIsCompareOpen(false)} 
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onToggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onSelect={setActiveTab} 
        onFocusSearch={() => { document.getElementById('search-input')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      </div>
    </div>
  );
}
