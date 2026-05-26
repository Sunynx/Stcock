'use client';

type Tab = { id: string; icon: string; label: string; desc: string };

const tabs: Tab[] = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard', desc: 'Market overview' },
  { id: 'expert_picks', icon: '🏆', label: 'Expert Picks', desc: 'Curated by AI' },
  { id: 'us_momentum', icon: '⚡', label: 'Momentum US', desc: 'High risk, high reward' },
  { id: 'day_gainers', icon: '🔥', label: 'Top Gainers', desc: 'Daily strong movers' },
  { id: 'most_actives', icon: '📊', label: 'Most Active', desc: 'Highest volume' },
  { id: 'undervalued_growth_stocks', icon: '💎', label: 'Undervalued', desc: 'Value + Growth' },
  { id: 'watchlist', icon: '⭐', label: 'Watchlist', desc: 'Your saved stocks' },
];

interface Props {
  activeTab: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ activeTab, onSelect }: Props) {
  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
      <div className="hidden md:block px-4 py-6">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-accent to-accent2 drop-shadow-sm mb-1 tracking-tight">
          StockSense
        </h1>
        <p className="text-muted text-xs font-medium uppercase tracking-wider">Pro Dashboard</p>
      </div>

      <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 px-4 md:px-0 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-300 min-w-[160px] md:min-w-0 border ${
                isActive
                  ? 'bg-gradient-to-br from-accent/20 to-accent2/10 border-accent/50 shadow-[0_0_20px_rgba(124,92,252,0.15)] relative overflow-hidden'
                  : 'bg-transparent border-transparent hover:bg-card hover:border-border text-muted hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-accent2 rounded-l-2xl"></div>
              )}
              <span className="text-2xl drop-shadow-sm">{tab.icon}</span>
              <div>
                <div className={`font-semibold text-sm ${isActive ? 'text-white' : ''}`}>{tab.label}</div>
                <div className="text-[0.65rem] opacity-70 hidden md:block">{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
