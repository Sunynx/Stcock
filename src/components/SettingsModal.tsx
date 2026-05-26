'use client';

import { useEffect, useState } from 'react';
import { useStockContext } from '@/lib/StockContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export default function SettingsModal({ isOpen, onClose, onToggleTheme, isDarkMode }: SettingsModalProps) {
  const { alerts, addAlert, removeAlert } = useStockContext();
  const [newSymbol, setNewSymbol] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div 
        className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border/50 rounded-t-3xl z-[90] p-6 pb-safe shadow-[0_-20px_50px_rgba(0,0,0,0.5)] settings-slide-up"
      >
        <div className="w-12 h-1.5 bg-border/50 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text">ตั้งค่า (Settings)</h2>
          <button onClick={onClose} className="p-2 bg-card rounded-full text-muted hover:text-text transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {/* Theme Toggle - NOW FUNCTIONAL */}
          <div className="p-4 bg-card/50 border border-border/30 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">โหมดหน้าจอ (Theme)</div>
                <div className="text-xs text-muted">{isDarkMode ? 'โหมดมืด (Dark Mode)' : 'โหมดสว่าง (Light Mode)'}</div>
              </div>
            </div>
            <button 
              onClick={onToggleTheme}
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-all duration-300 cursor-pointer ${
                isDarkMode ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md ${
                isDarkMode ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          {/* Notifications */}
          <div className="p-4 bg-card/50 border border-border/30 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl text-green-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">การแจ้งเตือน (Notifications)</div>
                <div className="text-xs text-muted">รับการแจ้งเตือนหุ้นที่น่าสนใจ</div>
              </div>
            </div>
            <div className="w-12 h-6 bg-accent rounded-full flex items-center p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full translate-x-6 shadow-md"></div>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="p-4 bg-card/50 border border-border/30 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue/20 rounded-xl text-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">รีเฟรชอัตโนมัติ (Auto Refresh)</div>
                <div className="text-xs text-muted">ทุก 3 นาที</div>
              </div>
            </div>
            <div className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">3 min</div>
          </div>

          {/* Price Alerts */}
          <div className="p-4 bg-card/50 border border-border/30 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">แจ้งเตือนราคา (Price Alerts)</div>
                <div className="text-xs text-muted">ตั้งค่าการแจ้งเตือนเมื่อราคาถึงเป้าหมาย</div>
              </div>
            </div>
            
            {alerts.length > 0 && (
              <div className="space-y-2 mt-2">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex justify-between items-center bg-bg p-2 rounded-lg border border-border/50">
                    <span className="text-sm font-bold text-white">{alert.symbol}</span>
                    <span className="text-sm text-muted">
                      {alert.condition === 'above' ? '≥' : '≤'} ${alert.targetPrice}
                    </span>
                    <button onClick={() => removeAlert(i)} className="text-red-400 hover:text-red-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                placeholder="Symbol (e.g. AAPL)" 
                className="flex-1 min-w-0 bg-bg border border-border/50 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value.toUpperCase())}
              />
              <select 
                className="bg-bg border border-border/50 rounded-lg px-1 py-2 text-sm text-text focus:outline-none focus:border-accent"
                value={newCondition}
                onChange={e => setNewCondition(e.target.value as 'above'|'below')}
              >
                <option value="above">Above (≥)</option>
                <option value="below">Below (≤)</option>
              </select>
              <input 
                type="number" 
                placeholder="Price" 
                className="w-20 min-w-0 bg-bg border border-border/50 rounded-lg px-2 py-2 text-sm text-text focus:outline-none focus:border-accent"
                value={newTarget}
                onChange={e => setNewTarget(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                if (newSymbol && newTarget && !isNaN(Number(newTarget))) {
                  addAlert({ symbol: newSymbol, targetPrice: Number(newTarget), condition: newCondition });
                  setNewSymbol('');
                  setNewTarget('');
                }
              }}
              className="w-full py-2 bg-accent/10 text-accent font-bold rounded-lg hover:bg-accent/20 transition-colors text-sm"
            >
              + Add Alert
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-xs text-muted/50 pb-4">
          <p>StockSense Pro v0.2.0</p>
          <p className="mt-1">Powered by Yahoo Finance &amp; Gemini AI</p>
        </div>
      </div>
    </>
  );
}
