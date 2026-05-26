'use client';

import { useId } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ data, color = '#00e4a0', width = 120, height = 40 }: SparklineProps) {
  const id = useId();

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-white/5 rounded-lg"></div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  // Prevent division by zero
  const safeRange = range === 0 ? 1 : range;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / safeRange) * height;
    // Add some padding to Y so it doesn't clip
    const safeY = Math.max(2, Math.min(height - 2, y));
    return `${x},${safeY}`;
  });

  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#4ade80' : '#f87171'; // Green-400 or Red-400
  const gradientId = `grad-${id}-${isUp ? 'up' : 'down'}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
      />
      {/* Fill under line */}
      <polygon
        fill={`url(#${gradientId})`}
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
      />
    </svg>
  );
}
