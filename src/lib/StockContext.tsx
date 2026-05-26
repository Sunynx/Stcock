'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type MarketRegion = 'US' | 'TH';

interface StockContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  search: string;
  setSearch: (search: string) => void;
  marketRegion: MarketRegion;
  setMarketRegion: (region: MarketRegion) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [search, setSearch] = useState<string>('');
  const [marketRegion, setMarketRegion] = useState<MarketRegion>('US');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  
  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  return (
    <StockContext.Provider value={{
      activeTab, setActiveTab,
      search, setSearch,
      marketRegion, setMarketRegion,
      isDarkMode, toggleTheme,
      watchlist, toggleWatchlist
    }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockContext() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStockContext must be used within a StockProvider');
  }
  return context;
}
