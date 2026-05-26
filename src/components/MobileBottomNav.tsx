'use client';

interface MobileBottomNavProps {
  activeTab: string;
  onSelect: (tab: string) => void;
  onFocusSearch: () => void;
  onOpenSettings: () => void;
}

export default function MobileBottomNav({ activeTab, onSelect, onFocusSearch, onOpenSettings }: MobileBottomNavProps) {
  const vibrate = () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    } catch (e) {}
  };

  const handleSelect = (tab: string) => {
    vibrate();
    onSelect(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // We map the active category to one of the 4 bottom tabs roughly
  let currentNav = 'overview';
  if (activeTab === 'watchlist') currentNav = 'watchlist';
  if (activeTab === 'search') currentNav = 'search';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-xl border-t border-border/50 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
      
      <button 
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentNav === 'overview' ? 'text-accent' : 'text-muted hover:text-white'}`}
        onClick={() => handleSelect('us_momentum')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span className="text-[10px] font-bold">ภาพรวม</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentNav === 'watchlist' ? 'text-accent' : 'text-muted hover:text-white'}`}
        onClick={() => handleSelect('watchlist')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span className="text-[10px] font-bold">เฝ้าดู</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentNav === 'search' ? 'text-accent' : 'text-muted hover:text-white'}`}
        onClick={() => { vibrate(); onFocusSearch(); }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span className="text-[10px] font-bold">ค้นหา</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors text-muted hover:text-white active:scale-95`}
        onClick={() => { vibrate(); onOpenSettings(); }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span className="text-[10px] font-bold">ตั้งค่า</span>
      </button>

    </div>
  );
}
