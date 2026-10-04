'use client';

import { Sparkles } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  showIcon?: boolean;
}

export default function ScoreBadge({ score, showIcon = true }: ScoreBadgeProps) {
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (score < 80) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (score < 70) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
      {showIcon && <Sparkles className="h-3 w-3" />}
      <span>{score}% Match</span>
    </div>
  );
}
