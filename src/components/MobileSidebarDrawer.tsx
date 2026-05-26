'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelect: (id: string) => void;
}

export default function MobileSidebarDrawer({ isOpen, onClose, activeTab, onSelect }: MobileSidebarDrawerProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`md:hidden fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-surface z-[70] border-r border-border/30 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-accent/20">
              S
            </div>
            <span className="text-xl font-black tracking-tight text-white">StockSense</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-white bg-card rounded-full transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <Sidebar activeTab={activeTab} onSelect={(id) => {
            onSelect(id);
            onClose(); // Close drawer after selection
          }} />
        </div>
      </div>
    </>
  );
}
