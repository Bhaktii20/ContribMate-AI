'use client';

import Link from 'next/link';
import { DEMO_REPOS, DEMO_ISSUES_MAP } from '@/lib/demo-data';
import ScoreBadge from '@/components/ScoreBadge';
import { LayoutDashboard, Compass, GitPullRequest, ArrowRight, Star, ExternalLink, FolderGit2 } from 'lucide-react';

export default function WorkspacePage() {
  const analyzedRepos = DEMO_REPOS.slice(0, 2);
  const savedIssues = DEMO_ISSUES_MAP['fastapi/fastapi'] || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-indigo-400" /> My Contribution Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track your saved repositories, issue roadmaps, and active contribution chats.
          </p>
        </div>

        <Link
          href="/discover"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Compass className="h-4 w-4" />
          <span>Find New Repositories</span>
        </Link>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analyzed Repositories */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-emerald-400" /> Recently Analyzed Repositories
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyzedRepos.map((repo) => (
              <div
                key={repo.full_name}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400">{repo.owner} /</span>
                    <ScoreBadge score={repo.match_score} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{repo.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{repo.description}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400" /> {repo.stars.toLocaleString()} stars
                  </span>

                  <Link
                    href={`/repository/${repo.owner}/${repo.name}`}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Issues Roadmap */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-purple-400" /> Saved Issue Roadmaps
          </h2>

          <div className="space-y-3">
            {savedIssues.map((issue) => (
              <div
                key={issue.number}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">fastapi/fastapi #{issue.number}</span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    🟢 {issue.difficulty}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2">{issue.title}</h4>
                <Link
                  href="/repository/fastapi/fastapi"
                  className="block text-[11px] font-semibold text-indigo-400 hover:underline pt-1"
                >
                  View Step-by-Step Plan →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
