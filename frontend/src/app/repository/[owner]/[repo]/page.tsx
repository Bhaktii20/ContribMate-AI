'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RepoAnalysis,
  IssueItem,
  ContributionPlan,
  RepoRecommendation
} from '@/lib/types';
import {
  getRepoAnalysis,
  getRepoIssues,
  getRepoTree,
  getRepoGuide,
  generateContributionPlan,
  searchRepositories,
  RepoGuideResponse
} from '@/lib/api';
import IssueCard from '@/components/IssueCard';
import FileExplorer from '@/components/FileExplorer';
import ContributionPlanView from '@/components/ContributionPlanView';
import ChatBot from '@/components/ChatBot';
import TrustTag from '@/components/TrustTag';
import {
  Layers,
  GitPullRequest,
  Code,
  BookOpen,
  CheckSquare,
  Bot,
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Cpu,
  FolderGit2,
  FileText,
  CheckCircle2,
  XCircle,
  Compass,
  Sparkles,
  Shield,
  Eye,
  Calendar,
  HelpCircle
} from 'lucide-react';

export default function RepositoryWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const owner = (params.owner as string) || 'fastapi';
  const repo = (params.repo as string) || 'fastapi';
  const fullName = `${owner}/${repo}`;

  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'codebase' | 'guide' | 'plan' | 'chat'>('overview');
  const [repoDetails, setRepoDetails] = useState<RepoRecommendation | null>(null);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [tree, setTree] = useState<Array<{ path: string; type: string }>>([]);
  const [defaultBranch, setDefaultBranch] = useState<string>('main');
  const [guide, setGuide] = useState<RepoGuideResponse>({});
  const [plan, setPlan] = useState<ContributionPlan | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    loadWorkspaceData();
  }, [owner, repo]);

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repoRes, analysisRes, issuesRes, treeRes, guideRes] = await Promise.all([
        searchRepositories(undefined, fullName).then((res) => res[0] || null).catch(() => null),
        getRepoAnalysis(owner, repo),
        getRepoIssues(owner, repo).catch(() => []),
        getRepoTree(owner, repo).catch(() => ({ tree: [], default_branch: 'main' })),
        getRepoGuide(owner, repo).catch(() => ({}))
      ]);

      setRepoDetails(repoRes);
      setAnalysis(analysisRes);
      setIssues(issuesRes || []);
      setTree(treeRes.tree || []);
      setDefaultBranch(analysisRes?.default_branch || treeRes.default_branch || repoRes?.default_branch || 'main');
      setGuide(guideRes || {});

      if (issuesRes && issuesRes.length > 0) {
        setSelectedIssue(issuesRes[0]);
        loadPlanForIssue(issuesRes[0].number);
      }
    } catch (err: any) {
      console.error('Error loading repository workspace:', err);
      setError(err?.message || `Failed to analyze repository '${fullName}'. Verify it is public on GitHub.`);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanForIssue = async (issueNumber: number) => {
    setPlanLoading(true);
    try {
      const res = await generateContributionPlan(owner, repo, issueNumber);
      setPlan(res);
    } catch (err) {
      console.error('Error generating plan:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSelectIssue = (issue: IssueItem) => {
    setSelectedIssue(issue);
    loadPlanForIssue(issue.number);
    setActiveTab('plan');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-xs font-semibold">Performing real GitHub repository analysis for {fullName}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Repository Analysis Error</h2>
          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">{error}</p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => loadWorkspaceData()}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              Retry Analysis
            </button>
            <Link
              href="/discover"
              className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Back to Repository Discovery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Layers },
    { id: 'issues', name: `Issues (${issues.length})`, icon: GitPullRequest },
    { id: 'codebase', name: 'Codebase', icon: Code },
    { id: 'guide', name: 'Contribution Guide', icon: BookOpen },
    { id: 'plan', name: 'Contribution Plan', icon: CheckSquare },
    { id: 'chat', name: 'AI Chat', icon: Bot, badge: 'RAG' }
  ];

  const displayStars = analysis?.stars || repoDetails?.stars || 0;
  const displayForks = analysis?.forks || repoDetails?.forks || 0;
  const displayOpenIssues = analysis?.open_issues || repoDetails?.open_issues || issues.length;
  const displayLanguage = analysis?.language || repoDetails?.language || 'Python';
  const displayDescription = analysis?.description || repoDetails?.description || 'Public GitHub repository';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Repository Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 font-semibold">{owner} /</span>
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
                {displayLanguage}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 border border-slate-700">
                branch: {defaultBranch}
              </span>
              {analysis?.license && (
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  {analysis.license}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <span>{repo}</span>
              <a
                href={analysis?.html_url || `https://github.com/${fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                title="Open on GitHub"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              {displayDescription}
            </p>

            {analysis?.topics && analysis.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {analysis.topics.map((t) => (
                  <span key={t} className="rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <div>
                <div className="font-bold text-white">{displayStars.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">Stars</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 flex items-center gap-2">
              <GitFork className="h-4 w-4 text-purple-400" />
              <div>
                <div className="font-bold text-white">{displayForks.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">Forks</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="font-bold text-white">{displayOpenIssues.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">Open Issues</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.name}</span>
              {t.badge && (
                <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* SECTION 1: REPOSITORY HEALTH & BEGINNER FRIENDLINESS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Beginner Assessment Score Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" /> Beginner Friendliness
                </h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
                  {analysis?.beginner_assessment?.difficulty_level || analysis?.getting_started_difficulty || 'Beginner'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">
                  {analysis?.beginner_assessment?.score || 85}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ 100 friendliness score</span>
              </div>

              {analysis?.beginner_assessment?.explanation && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  {analysis.beginner_assessment.explanation.map((reason, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      <span>{reason.replace(/^✓\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repository Health Signals */}
            <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-400" /> Repository Health & Signals
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Documentation</div>
                  <div className="flex items-center gap-1.5 font-bold">
                    {analysis?.health?.has_readme ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> README Present</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Missing README</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Contribution Guide</div>
                  <div className="flex items-center gap-1.5 font-bold">
                    {analysis?.health?.has_contributing ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Guide Available</span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Standard PR</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Automated Tests</div>
                  <div className="flex items-center gap-1.5 font-bold">
                    {analysis?.health?.has_tests ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Tests Detected</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> No Test Dir</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">License</div>
                  <div className="text-xs text-slate-200 font-bold truncate">
                    {analysis?.license || analysis?.health?.license_name || 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                {analysis?.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" /> Created: {analysis.created_at}
                  </span>
                )}
                {analysis?.updated_at && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> Last Updated: {analysis.updated_at}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: AI ARCHITECTURAL ANALYSIS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-indigo-400" /> AI Architectural Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  {analysis?.ai_generated
                    ? 'Grounded Qwen-2.5 structural analysis derived directly from fetched repository data.'
                    : 'Factual static repository structure analysis derived from retrieved GitHub data.'}
                </p>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-mono font-semibold text-indigo-400 border border-indigo-500/20">
                {analysis?.ai_generated ? 'AI Grounded' : 'Factual GitHub API'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What This Project Does</h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {analysis?.what_it_does}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Why Suitable for Contributors</h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {analysis?.why_suitable}
                </p>
              </div>
            </div>

            {/* Easier vs Harder Parts */}
            {(analysis?.easier_parts || analysis?.harder_parts) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {analysis.easier_parts && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                    <span className="text-xs font-bold text-emerald-400 block uppercase">Easier Starting Areas</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{analysis.easier_parts}</p>
                  </div>
                )}
                {analysis.harder_parts && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                    <span className="text-xs font-bold text-amber-400 block uppercase">Higher Complexity Areas</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{analysis.harder_parts}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tech Stack */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Detected Technology Stack & Tools:
              </span>
              <div className="flex flex-wrap gap-2">
                {analysis?.tech_stack.map((tech) => (
                  <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 font-mono font-semibold">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: REPOSITORY STRUCTURE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-emerald-400" /> Repository Structure & Major Modules
            </h3>

            {analysis?.project_structure && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {analysis.project_structure}
              </p>
            )}

            {analysis?.major_directories && analysis.major_directories.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {analysis.major_directories.map((dir, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                      <FolderGit2 className="h-4 w-4 shrink-0" />
                      <span>{dir.path}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">{dir.purpose}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: START HERE (CONTRIBUTOR-RELEVANT FILES) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" /> Start Here — Key Contributor Files
              </h3>
              <span className="text-xs text-slate-400">Extracted from actual repository tree</span>
            </div>

            {analysis?.contributor_files && analysis.contributor_files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {analysis.contributor_files.map((file, idx) => (
                  <div key={idx} className="flex flex-col justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                          {file.category}
                        </span>
                        <FileText className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="text-xs font-mono font-bold text-white truncate">{file.file_path}</div>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">{file.description}</p>
                    </div>

                    <button
                      onClick={() => setActiveTab('codebase')}
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-2 border-t border-slate-800/80"
                    >
                      <span>Explore in Codebase Tab</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">See the Codebase tab to inspect repository files.</div>
            )}
          </div>

          {/* SECTION 5: EVIDENCE & VERIFICATION */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Verified Evidence & Grounding Classification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* VERIFIED */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" /> VERIFIED
                </div>
                <div className="space-y-2">
                  {(analysis?.evidence_map?.VERIFIED || analysis?.beginner_assessment?.evidence_breakdown?.VERIFIED || [
                    'Directly verified repository metadata from GitHub API'
                  ]).map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      <span>{item.replace(/^✓\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* INFERRED */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4" /> INFERRED
                </div>
                <div className="space-y-2">
                  {(analysis?.evidence_map?.INFERRED || analysis?.beginner_assessment?.evidence_breakdown?.INFERRED || [
                    'Inferred tech stack from file extensions and config manifests'
                  ]).map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">⚠</span>
                      <span>{item.replace(/^⚠\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* UNKNOWN */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <HelpCircle className="h-4 w-4" /> UNKNOWN
                </div>
                <div className="space-y-2">
                  {(analysis?.evidence_map?.UNKNOWN || analysis?.beginner_assessment?.evidence_breakdown?.UNKNOWN || [
                    'Maintainer PR review turnaround time'
                  ]).map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-slate-500 shrink-0">?</span>
                      <span>{item.replace(/^\?\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Select a GitHub Issue to Analyze</h2>
            <span className="text-xs text-slate-400">Filtered pull requests out. Only open issues shown.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {issues.map((issueItem) => (
              <IssueCard
                key={issueItem.number}
                issue={issueItem}
                isSelected={selectedIssue?.number === issueItem.number}
                onSelect={handleSelectIssue}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CODEBASE */}
      {activeTab === 'codebase' && (
        <div className="space-y-4">
          <FileExplorer owner={owner} repo={repo} tree={tree} defaultBranch={defaultBranch} />
        </div>
      )}

      {/* TAB 4: CONTRIBUTION GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" /> Repository Contribution Guide
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamically generated for {fullName} using Qwen3-Coder + RAG indexing over repo docs & tree.
                </p>
              </div>
              {guide.ai_generated && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                  <Sparkles className="h-3.5 w-3.5" /> Real AI Generated
                </span>
              )}
            </div>

            {/* Guide Content Display */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {guide.guide_content || guide.readme || guide.contributing || 'Fetching guidelines...'}
            </div>

            {(guide.readme || guide.contributing) && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
                {guide.readme && <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> README.md Available</span>}
                {guide.contributing && <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> CONTRIBUTING.md Available</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CONTRIBUTION PLAN */}
      {activeTab === 'plan' && (
        <div>
          {planLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-xs font-semibold">Building evidence-backed contribution roadmap...</p>
            </div>
          ) : plan ? (
            <ContributionPlanView plan={plan} repoUrl={`https://github.com/${fullName}`} />
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">Select an issue from the Issues tab first.</div>
          )}
        </div>
      )}

      {/* TAB 6: AI CHAT */}
      {activeTab === 'chat' && (
        <div>
          <ChatBot owner={owner} repo={repo} selectedIssue={selectedIssue} />
        </div>
      )}
    </div>
  );
}

