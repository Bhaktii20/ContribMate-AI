import Link from 'next/link';
import { GitPullRequest, ShieldCheck, Cpu, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-white">ContribMate AI</span>
            <span className="text-xs text-slate-500">— Find your first meaningful open-source contribution.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" /> Qwen3-Coder AI
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> RAG Grounded
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Code2 className="h-3.5 w-3.5 text-purple-400" /> GitHub REST API
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
