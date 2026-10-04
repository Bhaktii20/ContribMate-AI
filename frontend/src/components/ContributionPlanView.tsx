'use client';

import { useState } from 'react';
import { ContributionPlan } from '../lib/types';
import TrustTag from './TrustTag';
import { CheckSquare, GitBranch, Code, Terminal, ExternalLink, Copy, Check, Clock, ShieldCheck } from 'lucide-react';

interface PlanViewProps {
  plan: ContributionPlan;
  repoUrl: string;
}

export default function ContributionPlanView({ plan, repoUrl }: PlanViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
              Contribution Roadmap
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" /> Est: {plan.estimated_time}
            </span>
          </div>

          <a
            href={`${repoUrl}/issues/${plan.issue_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            <span>Open Issue #{plan.issue_number} on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{plan.issue_title}</h2>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-slate-400 font-semibold self-center">Required Skills:</span>
          {plan.required_skills.map((skill) => (
            <span key={skill} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Grid: Files Involved & What to Understand */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Files Involved */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Code className="h-4 w-4 text-emerald-400" /> Files Involved & Verification
          </h3>
          <div className="space-y-2">
            {plan.files_involved.map((file, idx) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-200">{file.file_path}</span>
                  <TrustTag status={file.status} />
                </div>
                <p className="text-slate-400">{file.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to Understand */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" /> Key Concepts to Understand
          </h3>
          <div className="space-y-2">
            {plan.what_to_understand.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-Step Plan */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-emerald-400" /> Step-by-Step Contribution Plan
        </h3>

        <div className="space-y-3">
          {plan.step_by_step_plan.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                {idx + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Git Workflow Commands */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="h-5 w-5 text-purple-400" /> Git & Terminal Workflow
        </h3>

        <div className="space-y-2">
          {plan.git_workflow.map((cmd, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-400">
              <span className="truncate">$ {cmd}</span>
              <button
                onClick={() => copyToClipboard(cmd, idx)}
                className="text-slate-400 hover:text-white transition-colors shrink-0"
                title="Copy Command"
              >
                {copiedIndex === idx ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
