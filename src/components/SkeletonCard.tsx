'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-border/60 rounded-[2rem] p-5 flex flex-col h-[380px] overflow-hidden animate-pulse">
      {/* Top Header Row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full shimmer-bg"></div>
          <div>
            <div className="w-20 h-5 rounded-lg shimmer-bg mb-1.5"></div>
            <div className="w-14 h-3 rounded shimmer-bg"></div>
          </div>
        </div>
        <div className="w-5 h-5 rounded-full shimmer-bg"></div>
      </div>

      {/* Price & Sparkline Row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="w-28 h-8 rounded-lg shimmer-bg mb-2"></div>
          <div className="w-16 h-4 rounded shimmer-bg"></div>
        </div>
        <div className="w-[100px] h-[40px] rounded-lg shimmer-bg"></div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-card/30 p-3 rounded-2xl border border-white/5">
        <div className="flex flex-col gap-1.5">
          <div className="w-12 h-2.5 rounded shimmer-bg"></div>
          <div className="w-16 h-3 rounded shimmer-bg"></div>
        </div>
        <div className="flex flex-col gap-1.5 border-l border-white/5 pl-2">
          <div className="w-8 h-2.5 rounded shimmer-bg"></div>
          <div className="w-12 h-3 rounded shimmer-bg"></div>
        </div>
        <div className="flex flex-col gap-1.5 border-l border-white/5 pl-2">
          <div className="w-14 h-2.5 rounded shimmer-bg"></div>
          <div className="w-16 h-3 rounded shimmer-bg"></div>
        </div>
      </div>

      {/* Period Changes */}
      <div className="flex justify-between items-center mb-4 px-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-2.5 rounded shimmer-bg"></div>
            <div className="w-10 h-3.5 rounded shimmer-bg"></div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        <div className="w-20 h-6 rounded-lg shimmer-bg"></div>
        <div className="w-16 h-6 rounded-lg shimmer-bg"></div>
      </div>

      {/* News Feed */}
      <div className="mt-auto border-t border-border/50 pt-3">
        <div className="w-24 h-2.5 rounded shimmer-bg mb-3"></div>
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full shimmer-bg mt-1 shrink-0"></div>
            <div className="w-full h-3 rounded shimmer-bg"></div>
          </div>
          <div className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full shimmer-bg mt-1 shrink-0"></div>
            <div className="w-3/4 h-3 rounded shimmer-bg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
