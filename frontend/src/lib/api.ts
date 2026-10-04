import { UserProfile, RepoRecommendation, RepoAnalysis, IssueItem, ContributionPlan, ChatResponse } from './types';
import { DEMO_REPOS, DEMO_ISSUES_MAP, DEMO_ANALYSIS, DEMO_PLAN } from './demo-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithFallback<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[ContribMate API] Fetch to ${url} failed, using fallback data if available:`, err);
  }
  
  if (fallbackData !== undefined) {
    return fallbackData;
  }
  throw new Error(`API call failed for ${url}`);
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const session_id = profile.session_id || 'demo-session-' + Date.now();
  const payload = {
    session_id,
    experience: profile.experience || 'Beginner',
    skills: profile.skills || ['Python', 'AI/ML'],
    interests: profile.interests || ['AI/ML'],
    available_time: profile.available_time || '2-4 hours',
    preferred_difficulty: profile.preferred_difficulty || 'Beginner',
    contribution_types: profile.contribution_types || ['Bug Fix', 'Documentation']
  };

  return fetchWithFallback<UserProfile>(
    '/api/profile',
    { method: 'POST', body: JSON.stringify(payload) },
    payload as UserProfile
  );
}

export async function searchRepositories(profile?: Partial<UserProfile>, query?: string): Promise<RepoRecommendation[]> {
  const payload = {
    session_id: profile?.session_id,
    skills: profile?.skills || ['Python', 'AI/ML'],
    interests: profile?.interests || ['AI/ML'],
    experience: profile?.experience || 'Beginner',
    available_time: profile?.available_time || '2-4 hours',
    query
  };

  return fetchWithFallback<RepoRecommendation[]>(
    '/api/repositories/search',
    { method: 'POST', body: JSON.stringify(payload) },
    DEMO_REPOS
  );
}

export async function getRepoAnalysis(owner: string, repo: string): Promise<RepoAnalysis> {
  const fullName = `${owner}/${repo}`;
  return fetchWithFallback<RepoAnalysis>(
    `/api/repositories/${owner}/${repo}/analyze`,
    { method: 'POST' },
    DEMO_ANALYSIS[fullName] || DEMO_ANALYSIS['fastapi/fastapi']
  );
}

export async function getRepoIssues(owner: string, repo: string, skills?: string[]): Promise<IssueItem[]> {
  const fullName = `${owner}/${repo}`;
  const skillsQuery = skills ? `?skills=${encodeURIComponent(skills.join(','))}` : '';
  return fetchWithFallback<IssueItem[]>(
    `/api/repositories/${owner}/${repo}/issues${skillsQuery}`,
    { method: 'GET' },
    DEMO_ISSUES_MAP[fullName] || DEMO_ISSUES_MAP['fastapi/fastapi']
  );
}

export interface RepoTreeResponse {
  tree: Array<{ path: string; type: string }>;
  default_branch: string;
}

export async function getRepoTree(owner: string, repo: string): Promise<RepoTreeResponse> {
  return fetchWithFallback<RepoTreeResponse>(
    `/api/repositories/${owner}/${repo}/tree`,
    { method: 'GET' },
    {
      tree: [
        { path: 'README.md', type: 'blob' },
        { path: 'CONTRIBUTING.md', type: 'blob' },
        { path: 'fastapi', type: 'tree' },
        { path: 'fastapi/__init__.py', type: 'blob' },
        { path: 'fastapi/applications.py', type: 'blob' },
        { path: 'fastapi/exceptions.py', type: 'blob' },
        { path: 'tests', type: 'tree' },
        { path: 'tests/test_validation.py', type: 'blob' },
        { path: 'docs', type: 'tree' },
        { path: 'docs/index.md', type: 'blob' }
      ],
      default_branch: 'main'
    }
  );
}

export interface RepoFileResponse {
  path: string;
  is_binary: boolean;
  content: string | null;
  github_url: string;
  default_branch: string;
}

export async function getRepoFileContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<RepoFileResponse> {
  const branchQuery = branch ? `&branch=${encodeURIComponent(branch)}` : '';
  return fetchWithFallback<RepoFileResponse>(
    `/api/repositories/${owner}/${repo}/file?path=${encodeURIComponent(path)}${branchQuery}`,
    { method: 'GET' },
    {
      path,
      is_binary: path.endsWith('.svg') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.pdf') || path.endsWith('.zip'),
      content: path.endsWith('.svg') || path.endsWith('.png') ? null : `# ${path}\n\n// Sample file content for ${path}\nfunction example() {\n  return "ContribMate AI File Preview";\n}`,
      github_url: `https://github.com/${owner}/${repo}/blob/${branch || 'main'}/${path}`,
      default_branch: branch || 'main'
    }
  );
}

export interface RepoGuideResponse {
  readme?: string;
  contributing?: string;
  guide_content?: string;
  ai_generated?: boolean;
  error?: boolean;
}

export async function getRepoGuide(owner: string, repo: string): Promise<RepoGuideResponse> {
  return fetchWithFallback<RepoGuideResponse>(
    `/api/repositories/${owner}/${repo}/guide`,
    { method: 'GET' },
    {
      readme: `# ${owner}/${repo}\nRepository documentation`,
      contributing: `# Contributing to ${owner}/${repo}`,
      guide_content: `# Contribution Guide for ${owner}/${repo}\n\n1. Repository Overview\n...`,
      ai_generated: false
    }
  );
}

export async function generateContributionPlan(owner: string, repo: string, issue_number: number): Promise<ContributionPlan> {
  return fetchWithFallback<ContributionPlan>(
    `/api/issues/contribution-plan?owner=${owner}&repo=${repo}&issue_number=${issue_number}`,
    { method: 'POST' },
    { ...DEMO_PLAN, repo_full_name: `${owner}/${repo}`, issue_number }
  );
}

export async function sendChatMessage(
  owner: string,
  repo: string,
  message: string,
  selected_issue_number?: number,
  history?: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const payload = {
    session_id: 'session-' + Date.now(),
    repo_full_name: `${owner}/${repo}`,
    message,
    selected_issue_number,
    history
  };

  return fetchWithFallback<ChatResponse>(
    `/api/repositories/${owner}/${repo}/chat`,
    { method: 'POST', body: JSON.stringify(payload) },
    {
      reply: `[Demo Mode] Analyzed **${owner}/${repo}** for query: "${message}". Inspect README.md and source structure.`,
      sources: [
        { title: `${owner}/${repo} README.md`, file_path: 'README.md', url: `https://github.com/${owner}/${repo}` }
      ],
      trust_ratings: {
        verified: [`✓ Indexed repository tree for ${owner}/${repo}`],
        inferred: ['⚠ Demo response fallback'],
        unknown: []
      },
      suggested_questions: [
        'Explain this repository structure',
        'Where should I start reading code?',
        'How do I run tests?'
      ]
    }
  );
}

export interface AiStatusResponse {
  status: string;
  model: string;
  provider: string;
  demo_mode: boolean;
}

export async function getAiStatus(): Promise<AiStatusResponse> {
  return fetchWithFallback<AiStatusResponse>(
    '/api/health/ai-status',
    { method: 'GET' },
    { status: 'unavailable', model: 'qwen-2.5-coder-32b', provider: 'Groq', demo_mode: true }
  );
}
