'use client';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
  onFocusSearch: () => void;
  marketRegion: 'US' | 'TH';
  onToggleMarket: () => void;
}

export default function MobileHeader({ onOpenSidebar, onToggleTheme, onFocusSearch, marketRegion, onToggleMarket }: MobileHeaderProps) {
  const vibrate = () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    } catch (e) {}
  };

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg/90 backdrop-blur-md sticky top-0 z-40 border-b border-border/30">
      {/* Hamburger Menu */}
      <button 
        className="p-2 text-muted hover:text-white rounded-full transition-colors active:bg-card"
        onClick={() => { vibrate(); onOpenSidebar(); }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="12" x2="20" y2="12"></line>
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-accent/20">
          S
        </div>
        <span className="text-xl font-black tracking-tight text-white">StockSense</span>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-2">
        <button 
          className="p-2 text-muted hover:text-white rounded-full transition-colors active:bg-card"
          onClick={() => { vibrate(); onFocusSearch(); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <button 
          className="p-2 text-muted hover:text-white rounded-full transition-colors active:bg-card"
          onClick={() => { vibrate(); onToggleTheme(); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button 
          className={`w-8 h-8 rounded-full font-bold text-[10px] border flex items-center justify-center transition-colors ml-1 ${
            marketRegion === 'US' 
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 active:bg-blue-500/40' 
              : 'bg-green-500/20 text-green-400 border-green-500/50 active:bg-green-500/40'
          }`}
          onClick={() => { vibrate(); onToggleMarket(); }}
        >
          {marketRegion}
        </button>
      </div>
    </header>
  );
}
