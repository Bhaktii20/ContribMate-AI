'use client';

import { IssueItem } from '../lib/types';
import ScoreBadge from './ScoreBadge';
import { Clock, MessageSquare, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';

interface IssueCardProps {
  issue: IssueItem;
  isSelected?: boolean;
  onSelect: (issue: IssueItem) => void;
}

export default function IssueCard({ issue, isSelected, onSelect }: IssueCardProps) {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">🟢 Beginner</span>;
      case 'Intermediate':
        return <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30">🟡 Intermediate</span>;
      default:
        return <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/30">🔴 Advanced</span>;
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all ${
        isSelected
          ? 'border-emerald-500/60 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      <div>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400 font-semibold">#{issue.number}</span>
            {getDifficultyBadge(issue.difficulty)}
            <ScoreBadge score={issue.match_score} />
          </div>
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
          {issue.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
          {issue.body || 'No issue description provided.'}
        </p>

        {/* Reasons why suitable */}
        {issue.why_suitable && issue.why_suitable.length > 0 && (
          <div className="mb-4 space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Why Suitable for You
            </span>
            {issue.why_suitable.map((reason, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>{reason.replace(/^✓\s*/, '')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-indigo-400" /> {issue.estimated_time}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> {issue.comments_count} comments
          </span>
        </div>

        <button
          onClick={() => onSelect(issue)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            isSelected
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600/80 text-white hover:bg-indigo-500'
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Selected
            </>
          ) : (
            <>
              Select Issue <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
