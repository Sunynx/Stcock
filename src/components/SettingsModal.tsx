'use client';

import { useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export default function SettingsModal({ isOpen, onClose, onToggleTheme, isDarkMode }: SettingsModalProps) {
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
