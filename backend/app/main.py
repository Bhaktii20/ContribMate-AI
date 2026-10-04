import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api import health, profile, repositories, issues, chat, contributions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(profile.router, prefix=settings.API_V1_STR, tags=["Profile"])
app.include_router(repositories.router, prefix=settings.API_V1_STR, tags=["Repositories"])
app.include_router(issues.router, prefix=settings.API_V1_STR, tags=["Issues"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["Chat"])
app.include_router(contributions.router, prefix=settings.API_V1_STR, tags=["Contributions"])

@app.get("/")
def root():
    return {
        "message": "Welcome to ContribMate AI API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
