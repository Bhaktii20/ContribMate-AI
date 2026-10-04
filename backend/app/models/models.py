import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, unique=True, index=True, nullable=False)
    experience = Column(String, nullable=False) # Beginner, Intermediate, Advanced
    skills = Column(JSON, nullable=False) # List of skills e.g. ["Python", "React"]
    interests = Column(JSON, nullable=False) # List of interests
    available_time = Column(String, nullable=False) # 1-2 hours, 2-4 hours, etc.
    preferred_difficulty = Column(String, nullable=False) # Beginner, Intermediate, Advanced
    contribution_types = Column(JSON, nullable=True) # ["Bug Fix", "Documentation", etc.]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String, unique=True, index=True, nullable=False) # owner/repo
    owner = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    license = Column(String, nullable=True)
    html_url = Column(String, nullable=False)
    last_updated = Column(String, nullable=True)
    topics = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class RepositoryAnalysis(Base):
    __tablename__ = "repository_analyses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    repo_full_name = Column(String, ForeignKey("repositories.full_name"), nullable=False)
    summary = Column(Text, nullable=False)
    suitability_reason = Column(Text, nullable=False)
    getting_started_difficulty = Column(String, nullable=False)
    tech_stack = Column(JSON, default=list)
    project_structure_summary = Column(Text, nullable=True)
    evidence_indicators = Column(JSON, default=dict)
    indexed_at = Column(DateTime, default=datetime.utcnow)

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    repo_full_name = Column(String, nullable=False, index=True)
    number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    labels = Column(JSON, default=list)
    comments_count = Column(Integer, default=0)
    html_url = Column(String, nullable=False)
    created_at_github = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IssueRecommendation(Base):
    __tablename__ = "issue_recommendations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, nullable=False, index=True)
    repo_full_name = Column(String, nullable=False)
    issue_number = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=False) # Beginner, Intermediate, Advanced
    match_score = Column(Float, nullable=False)
    estimated_time = Column(String, nullable=False)
    required_skills = Column(JSON, default=list)
    why_suitable = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class ContributionPlan(Base):
    __tablename__ = "contribution_plans"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, nullable=False, index=True)
    repo_full_name = Column(String, nullable=False)
    issue_number = Column(Integer, nullable=False)
    issue_title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    estimated_time = Column(String, nullable=False)
    required_skills = Column(JSON, default=list)
    files_likely_involved = Column(JSON, default=list)
    prerequisites = Column(JSON, default=list)
    step_by_step_plan = Column(JSON, default=list)
    testing_plan = Column(JSON, default=list)
    git_workflow = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, nullable=False, index=True)
    repo_full_name = Column(String, nullable=False)
    selected_issue_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    chat_session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False) # user or assistant
    content = Column(Text, nullable=False)
    sources = Column(JSON, default=list) # List of source references
    trust_ratings = Column(JSON, default=dict) # {"verified": [], "inferred": [], "unknown": []}
    created_at = Column(DateTime, default=datetime.utcnow)
