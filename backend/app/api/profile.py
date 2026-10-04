from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.schemas import UserProfileCreate, UserProfileResponse
from app.db.session import get_db
from app.models.models import UserProfile

router = APIRouter()

@router.post("/profile", response_model=UserProfileResponse)
def create_or_update_profile(profile_in: UserProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(UserProfile).filter(UserProfile.session_id == profile_in.session_id).first()
    if existing:
        existing.experience = profile_in.experience
        existing.skills = profile_in.skills
        existing.interests = profile_in.interests
        existing.available_time = profile_in.available_time
        existing.preferred_difficulty = profile_in.preferred_difficulty
        existing.contribution_types = profile_in.contribution_types
        db.commit()
        db.refresh(existing)
        return existing

    new_profile = UserProfile(**profile_in.model_dump())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.get("/profile/{session_id}", response_model=UserProfileResponse)
def get_profile(session_id: str, db: Session = Depends(get_db)):
    existing = db.query(UserProfile).filter(UserProfile.session_id == session_id).first()
    if not existing:
        # Default fallback profile
        return UserProfileResponse(
            id="default-id",
            session_id=session_id,
            experience="Beginner",
            skills=["Python", "AI/ML"],
            interests=["AI/ML", "Web Development"],
            available_time="2-4 hours",
            preferred_difficulty="Beginner",
            contribution_types=["Bug Fix", "Documentation"]
        )
    return existing
