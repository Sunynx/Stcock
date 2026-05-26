'use client';

type Tab = { id: string; icon: string; label: string };

const tabs: Tab[] = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'expert_picks', icon: '🏆', label: 'Expert Picks' },
  { id: 'day_gainers', icon: '🔥', label: 'Top Gainers' },
  { id: 'us_momentum', icon: '⚡', label: 'Momentum US' },
  { id: 'most_actives', icon: '📊', label: 'Most Active' },
  { id: 'undervalued_growth_stocks', icon: '💎', label: 'Undervalued' },
  { id: 'watchlist', icon: '⭐', label: 'Watchlist' },
];

interface Props {
  activeTab: string;
  onSelect: (id: string) => void;
}

export default function CategoryTabs({ activeTab, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 snap-x px-4 md:px-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 border shrink-0 snap-start flex items-center gap-2 ${
            activeTab === tab.id
              ? 'bg-gradient-to-br from-accent to-accent2 border-transparent text-white shadow-lg shadow-accent/20'
              : 'bg-card/50 border-border/50 text-muted hover:border-accent hover:text-white backdrop-blur-sm'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
