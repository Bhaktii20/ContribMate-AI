from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserProfileCreate(BaseModel):
    session_id: str
    experience: str = Field(..., description="Beginner, Intermediate, Advanced")
    skills: List[str] = Field(..., description="List of technical skills")
    interests: List[str] = Field(..., description="List of domain interests")
    available_time: str = Field(..., description="1-2 hours, 2-4 hours, 4-8 hours, 8+ hours")
    preferred_difficulty: str = Field(..., description="Beginner, Intermediate, Advanced")
    contribution_types: Optional[List[str]] = Field(default_factory=list)

class UserProfileResponse(UserProfileCreate):
    id: str

class RepoSearchRequest(BaseModel):
    session_id: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    experience: Optional[str] = "Beginner"
    available_time: Optional[str] = "2-4 hours"
    query: Optional[str] = None

class RepoRecommendation(BaseModel):
    full_name: str
    owner: str
    name: str
    description: Optional[str] = ""
    language: Optional[str] = "Unknown"
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    license: Optional[str] = None
    html_url: str
    default_branch: Optional[str] = "main"
    last_updated: Optional[str] = None
    match_score: int
    beginner_issue_count: int = 0
    why_matched: List[str] = Field(default_factory=list)

class ContributorFile(BaseModel):
    file_path: str
    category: str # "Start Here", "Implementation", "Tests", "Configuration", "Documentation"
    description: str

class StructureDirectory(BaseModel):
    path: str
    purpose: str

class RepoHealth(BaseModel):
    has_readme: bool = False
    has_contributing: bool = False
    has_tests: bool = False
    has_license: bool = False
    open_issues_count: int = 0
    stars_count: int = 0
    forks_count: int = 0
    license_name: Optional[str] = "Not specified"
    last_updated: Optional[str] = None
    activity_status: str = "Active"

class BeginnerAssessment(BaseModel):
    score: int = 80
    difficulty_level: str = "Beginner" # Beginner, Intermediate, Advanced
    explanation: List[str] = Field(default_factory=list)
    evidence_breakdown: Dict[str, List[str]] = Field(default_factory=dict)

class RepoAnalysis(BaseModel):
    full_name: str
    owner: str = "unknown"
    name: str = "unknown"
    description: Optional[str] = ""
    html_url: str = ""
    default_branch: str = "main"
    language: Optional[str] = "Unknown"
    topics: List[str] = Field(default_factory=list)
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    watchers: int = 0
    license: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # Core AI / General Summaries (backward compatible)
    what_it_does: str
    why_suitable: str
    getting_started_difficulty: str = "Beginner"
    tech_stack: List[str] = Field(default_factory=list)
    project_structure: Optional[str] = None
    easier_parts: Optional[str] = None
    harder_parts: Optional[str] = None
    recommended_learnings: List[str] = Field(default_factory=list)

    # Detailed Real Analysis Fields
    major_directories: List[StructureDirectory] = Field(default_factory=list)
    contributor_files: List[ContributorFile] = Field(default_factory=list)
    health: Optional[RepoHealth] = None
    beginner_assessment: Optional[BeginnerAssessment] = None
    evidence_indicators: Dict[str, str] = Field(default_factory=dict)
    evidence_map: Dict[str, List[str]] = Field(default_factory=dict) # VERIFIED, INFERRED, UNKNOWN
    ai_generated: bool = False

class IssueResponse(BaseModel):
    number: int
    title: str
    body: Optional[str] = ""
    labels: List[str] = Field(default_factory=list)
    comments_count: int = 0
    html_url: str
    difficulty: str = "Beginner" # Beginner, Intermediate, Advanced
    match_score: int = 80
    estimated_time: str = "2-4 hours"
    required_skills: List[str] = Field(default_factory=list)
    why_suitable: List[str] = Field(default_factory=list)

class FileVerification(BaseModel):
    file_path: str
    status: str # VERIFIED, LIKELY, NEEDS VERIFICATION
    reason: str

class ContributionPlanResponse(BaseModel):
    repo_full_name: str
    issue_number: int
    issue_title: str
    difficulty: str
    estimated_time: str
    required_skills: List[str]
    files_involved: List[FileVerification]
    what_to_understand: List[str]
    step_by_step_plan: List[str]
    testing_plan: List[str]
    git_workflow: List[str]

class ChatRequest(BaseModel):
    session_id: str
    repo_full_name: str
    message: str
    selected_issue_number: Optional[int] = None
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class SourceReference(BaseModel):
    title: str
    file_path: Optional[str] = None
    url: Optional[str] = None

class TrustRating(BaseModel):
    verified: List[str] = Field(default_factory=list)
    inferred: List[str] = Field(default_factory=list)
    unknown: List[str] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    sources: List[SourceReference] = Field(default_factory=list)
    trust_ratings: TrustRating
    suggested_questions: List[str] = Field(default_factory=list)

class WorkspaceItem(BaseModel):
    repo: RepoRecommendation
    last_analyzed: str
    saved_issues: List[IssueResponse] = Field(default_factory=list)
    plan_available: bool = False
