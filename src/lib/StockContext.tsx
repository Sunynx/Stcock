'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type MarketRegion = 'US' | 'TH';

export interface StockAlert {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

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
  alerts: StockAlert[];
  addAlert: (alert: StockAlert) => void;
  removeAlert: (index: number) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [search, setSearch] = useState<string>('');
  const [marketRegion, setMarketRegion] = useState<MarketRegion>('US');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    const savedAlerts = localStorage.getItem('stock_alerts');
    if (savedAlerts) {
      try { setAlerts(JSON.parse(savedAlerts)); } catch (e) {}
    }
  }, []);

  const addAlert = (alert: StockAlert) => {
    setAlerts(prev => {
      const newAlerts = [...prev, alert];
      localStorage.setItem('stock_alerts', JSON.stringify(newAlerts));
      return newAlerts;
    });
  };

  const removeAlert = (index: number) => {
    setAlerts(prev => {
      const newAlerts = prev.filter((_, i) => i !== index);
      localStorage.setItem('stock_alerts', JSON.stringify(newAlerts));
      return newAlerts;
    });
  };

  useEffect(() => {
    if (alerts.length === 0) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    const checkPrices = async () => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

      for (const alert of alerts) {
        try {
          const res = await fetch(`/api/stock?symbol=${alert.symbol}`);
          const json = await res.json();
          if (json.success && json.data && json.data.price) {
            const currentPrice = json.data.price;
            let triggered = false;
            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
              triggered = true;
            } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
              triggered = true;
            }
            if (triggered) {
              new Notification(`Price Alert: ${alert.symbol}`, {
                body: `${alert.symbol} is now $${currentPrice} (${alert.condition} $${alert.targetPrice})`,
              });
            }
          }
        } catch (e) {
          console.error('Failed to check price for alert', e);
        }
      }
    };

    const interval = setInterval(checkPrices, 60000);
    return () => clearInterval(interval);
  }, [alerts]);

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
      watchlist, toggleWatchlist,
      alerts, addAlert, removeAlert
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
