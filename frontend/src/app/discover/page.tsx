'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RepoRecommendation } from '@/lib/types';
import { searchRepositories } from '@/lib/api';
import ScoreBadge from '@/components/ScoreBadge';
import { Star, GitFork, AlertCircle, ExternalLink, ArrowRight, Search, RefreshCw, Filter, ChevronDown } from 'lucide-react';

export default function DiscoverPage() {
  const [repos, setRepos] = useState<RepoRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'stars' | 'updated' | 'issues'>('match');
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async (query?: string) => {
    setLoading(true);
    try {
      let savedProfile = null;
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('contribmate_profile');
        if (raw) savedProfile = JSON.parse(raw);
      }

      const results = await searchRepositories(savedProfile, query);
      setRepos(results);
      setDisplayLimit(10); // Reset initial display limit to 10 on new search
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRepositories(searchQuery);
  };

  const sortedRepos = [...repos].sort((a, b) => {
    if (sortBy === 'match') return b.match_score - a.match_score;
    if (sortBy === 'stars') return b.stars - a.stars;
    if (sortBy === 'issues') return b.beginner_issue_count - a.beginner_issue_count;
    return (b.last_updated || '').localeCompare(a.last_updated || '');
  });

  const displayedRepos = sortedRepos.slice(0, displayLimit);
  const hasMore = sortedRepos.length > displayLimit;

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 10);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 flex items-center gap-3">
            AI Recommended Repositories
            {!loading && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
                {repos.length} matches
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Scored deterministically based on your skill match, experience fit, and beginner issue count.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g. machine learning, fastapi)..."
              className="w-64 rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          </form>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="match">Best Match</option>
              <option value="stars">Most Stars</option>
              <option value="issues">Beginner Friendly</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-xs font-semibold">Executing multi-query discovery and scoring repositories...</p>
        </div>
      ) : sortedRepos.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400 space-y-3">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No matching repositories found</h3>
          <p className="text-xs">Try adjusting your search terms or expanding your technical skills in your profile.</p>
        </div>
      ) : (
        /* Repository Cards Grid */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedRepos.map((repo) => (
              <div
                key={repo.full_name}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700 hover:bg-slate-900 shadow-xl"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 font-semibold">{repo.owner} /</span>
                      <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {repo.name}
                      </h2>
                    </div>
                    <ScoreBadge score={repo.match_score} />
                  </div>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed line-clamp-2">
                    {repo.description || 'No description provided for this repository.'}
                  </p>

                  {/* Match Reasons */}
                  {repo.why_matched && repo.why_matched.length > 0 && (
                    <div className="mb-4 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Why Recommended
                      </span>
                      {repo.why_matched.map((reason, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 shrink-0">✓</span>
                          <span>{reason.replace(/^✓\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats Footer */}
                <div>
                  <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/80 pt-4 mb-4 text-xs text-slate-400">
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-400 border border-indigo-500/20">
                      {repo.language}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400" /> {repo.stars.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5 text-purple-400" /> {repo.forks.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      {repo.beginner_issue_count} beginner issues
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/repository/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <span>Analyze Repository</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                      title="Open on GitHub"
                    >
                      <span>Open GitHub</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button & Counter */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{displayedRepos.length}</span> of{' '}
              <span className="font-bold text-white">{sortedRepos.length}</span> recommended repositories
            </div>

            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-slate-850 hover:border-slate-600 transition-all shadow-lg active:scale-95"
              >
                <span>Load More Repositories ({sortedRepos.length - displayLimit} remaining)</span>
                <ChevronDown className="h-4 w-4 text-emerald-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
