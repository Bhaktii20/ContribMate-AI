'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Search, ArrowRight, ShieldCheck, Sparkles, Code2, GitPullRequest, Layers, Cpu, CheckCircle2, Bot } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState('');
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    let clean = githubUrl.replace('https://github.com/', '').replace('http://github.com/', '').trim();
    if (clean.endsWith('.git')) clean = clean.slice(0, -4);
    
    const parts = clean.split('/');
    if (parts.length >= 2) {
      router.push(`/repository/${parts[0]}/${parts[1]}`);
    } else {
      router.push(`/repository/fastapi/fastapi`);
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-950">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-emerald-500/15 blur-3xl" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-Powered Open-Source Contribution Mentor</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6 leading-tight">
          Find your first <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            meaningful open-source
          </span>{' '}
          contribution.
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 mb-10 leading-relaxed">
          Tell us what you know. We’ll help you find a suitable project, understand the codebase architecture, choose the right issue, and generate an evidence-backed contribution plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/profile"
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Compass className="h-4 w-4" />
            <span>Find a Repository</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setShowAnalyzeModal(true)}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-8 text-sm font-semibold text-slate-200 shadow-md hover:border-slate-700 hover:bg-slate-850 transition-all active:scale-95"
          >
            <Search className="h-4 w-4 text-emerald-400" />
            <span>Analyze a Repository</span>
          </button>
        </div>

        {/* Visual Flow Diagram */}
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-6">
            The ContribMate Contribution Journey
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            {[
              { step: '1', title: 'YOUR SKILLS', icon: Code2, color: 'text-indigo-400' },
              { step: '2', title: 'AI MATCHING', icon: Cpu, color: 'text-purple-400' },
              { step: '3', title: 'REPOSITORY', icon: Layers, color: 'text-emerald-400' },
              { step: '4', title: 'ISSUE', icon: GitPullRequest, color: 'text-amber-400' },
              { step: '5', title: 'CODE RAG', icon: ShieldCheck, color: 'text-cyan-400' },
              { step: '6', title: 'CONTRIBUTE', icon: CheckCircle2, color: 'text-emerald-400' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <Icon className={`h-5 w-5 ${item.color} mb-2`} />
                  <span className="text-[10px] font-mono text-slate-500 font-bold mb-0.5">STEP {item.step}</span>
                  <span className="text-xs font-bold text-slate-200">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why ContribMate / Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Why ContribMate AI?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            GitHub is the source of truth. ContribMate AI is the intelligent recommendation, analysis, and guidance mentor layer built on top.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Deterministic Match Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We programmatically score repositories across your skills (30%), interests (20%), experience (20%), issue availability (15%), and repo activity (10%). Every match explains <em>WHY</em>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Zero-Hallucination Evidence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every step-by-step contribution plan explicitly classifies file references into <span className="text-emerald-400">✓ VERIFIED</span>, <span className="text-amber-400">⚠ LIKELY</span>, or <span className="text-slate-400">? NEEDS VERIFICATION</span>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Repository AI Mentor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inside every repository workspace, chat with an AI mentor powered by RAG chunking over README, docs, issues, and codebase structure.
            </p>
          </div>
        </div>
      </section>

      {/* Analyze Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-400" /> Analyze a GitHub Repository
            </h3>
            <p className="text-xs text-slate-400">
              Enter any public GitHub URL or repository slug (e.g. <code className="text-indigo-300">fastapi/fastapi</code> or <code className="text-indigo-300">scikit-learn/scikit-learn</code>).
            </p>

            <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAnalyzeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  Open Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
