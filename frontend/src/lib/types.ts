export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TimeCommitment = '1-2 hours' | '2-4 hours' | '4-8 hours' | '8+ hours';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type VerificationStatus = 'VERIFIED' | 'LIKELY' | 'NEEDS VERIFICATION';

export interface UserProfile {
  session_id: string;
  experience: ExperienceLevel;
  skills: string[];
  interests: string[];
  available_time: TimeCommitment;
  preferred_difficulty: DifficultyLevel;
  contribution_types?: string[];
}

export interface RepoRecommendation {
  full_name: string;
  owner: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  license?: string;
  html_url: string;
  default_branch?: string;
  last_updated?: string;
  match_score: number;
  beginner_issue_count: number;
  why_matched: string[];
}

export interface StructureDirectory {
  path: string;
  purpose: string;
}

export interface ContributorFile {
  file_path: string;
  category: string;
  description: string;
}

export interface RepoHealth {
  has_readme: boolean;
  has_contributing: boolean;
  has_tests: boolean;
  has_license: boolean;
  open_issues_count: number;
  stars_count: number;
  forks_count: number;
  license_name?: string;
  last_updated?: string;
  activity_status: string;
}

export interface BeginnerAssessment {
  score: number;
  difficulty_level: DifficultyLevel;
  explanation: string[];
  evidence_breakdown?: Record<string, string[]>;
}

export interface RepoAnalysis {
  full_name: string;
  owner?: string;
  name?: string;
  description?: string;
  html_url?: string;
  default_branch?: string;
  language?: string;
  topics?: string[];
  stars?: number;
  forks?: number;
  open_issues?: number;
  watchers?: number;
  license?: string;
  created_at?: string;
  updated_at?: string;

  what_it_does: string;
  why_suitable: string;
  getting_started_difficulty: string;
  tech_stack: string[];
  project_structure?: string;
  easier_parts?: string;
  harder_parts?: string;
  recommended_learnings?: string[];

  major_directories?: StructureDirectory[];
  contributor_files?: ContributorFile[];
  health?: RepoHealth;
  beginner_assessment?: BeginnerAssessment;
  evidence_indicators: Record<string, string>;
  evidence_map?: Record<string, string[]>;
  ai_generated?: boolean;
}

export interface IssueItem {
  number: number;
  title: string;
  body: string;
  labels: string[];
  comments_count: number;
  html_url: string;
  difficulty: DifficultyLevel;
  match_score: number;
  estimated_time: string;
  required_skills: string[];
  why_suitable: string[];
}

export interface FileInvolved {
  file_path: string;
  status: VerificationStatus;
  reason: string;
}

export interface ContributionPlan {
  repo_full_name: string;
  issue_number: number;
  issue_title: string;
  difficulty: string;
  estimated_time: string;
  required_skills: string[];
  files_involved: FileInvolved[];
  what_to_understand: string[];
  step_by_step_plan: string[];
  testing_plan: string[];
  git_workflow: string[];
}

export interface SourceReference {
  title: string;
  file_path?: string;
  url?: string;
}

export interface TrustRating {
  verified: string[];
  inferred: string[];
  unknown: string[];
}

export interface ChatResponse {
  reply: string;
  sources: SourceReference[];
  trust_ratings: TrustRating;
  suggested_questions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  trust_ratings?: TrustRating;
  timestamp: string;
}
