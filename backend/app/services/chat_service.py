import logging
from typing import Dict, Any, List, Optional
from app.github.github_service import GitHubService
from app.rag.vector_store import vector_store
from app.rag.ingestion import IngestionPipeline
from app.rag.chunking import DocumentChunker
from app.ai.ai_service import AIService
from app.core.config import settings

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are ContribMate AI, an expert open-source repository mentor for repository '{repo_full_name}'.
You are helpful, encouraging, highly technical, and strictly grounded in the retrieved repository data and codebase context.

RULES:
1. The retrieved repository context and metadata are your primary source of truth.
2. Do NOT invent files, directories, or functions that do not exist in the retrieved context.
3. If asked about an issue or file, reference the actual file paths provided in context.
4. Distinguish verified facts (directly from retrieved context) from logical engineering inference.
5. If the required information is not available in the context, explicitly state: 'I couldn't verify that from the retrieved repository data.'
6. Answer arbitrary conversational questions from the user clearly, step-by-step, for a beginner contributor.
"""

class ChatService:
    def __init__(self):
        self.github = GitHubService()
        self.ai = AIService()
        self.indexed_repos = set()

    async def ensure_repo_indexed(self, owner: str, repo: str):
        full_name = f"{owner}/{repo}"
        if full_name in self.indexed_repos:
            return

        logger.info(f"[ChatRAG] Indexing repository {full_name} for vector search...")
        readme = await self.github.get_readme(owner, repo) or f"ContribMate AI Repository Guide for {full_name}."
        tree_data = await self.github.get_tree_data(owner, repo)
        tree = tree_data.get("tree", []) if tree_data else []

        filtered_tree = IngestionPipeline.filter_tree(tree, max_files=50)
        chunks = DocumentChunker.chunk_text(readme, "README.md", full_name)

        # Add tree file structure chunk
        tree_summary = "\n".join([f"{item['path']} ({item.get('type', 'file')})" for item in filtered_tree])
        chunks.extend(DocumentChunker.chunk_text(tree_summary, "REPOSITORY_TREE", full_name))

        vector_store.index_chunks(full_name, chunks)
        self.indexed_repos.add(full_name)

    async def chat(
        self,
        owner: str,
        repo: str,
        user_message: str,
        selected_issue_number: Optional[int] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        full_name = f"{owner}/{repo}"
        logger.info(f"[ChatService] Chat request for {full_name}, msg='{user_message[:60]}', DEMO_MODE={settings.DEMO_MODE}")

        # Index repo for RAG
        try:
            await self.ensure_repo_indexed(owner, repo)
        except Exception as e:
            logger.warning(f"[ChatRAG Warning] Failed to index repo {full_name}: {e}")

        # Vector RAG search for relevant chunks
        retrieved_chunks = vector_store.search(full_name, user_message, top_k=5)

        context_lines = []
        sources = []
        seen_sources = set()

        for chunk in retrieved_chunks:
            file_path = chunk.get("file_path", "README.md")
            context_lines.append(f"--- File: {file_path} ---\n{chunk.get('content', '')}\n")

            if file_path not in seen_sources:
                seen_sources.add(file_path)
                url = f"https://github.com/{full_name}/blob/main/{file_path}" if file_path != "README.md" else f"https://github.com/{full_name}"
                sources.append({
                    "title": file_path,
                    "file_path": file_path,
                    "url": url
                })

        grounding_context = "\n".join(context_lines) if context_lines else "No specific vector chunks matched."
        issue_info = f"Selected Issue #{selected_issue_number}" if selected_issue_number else "No specific issue selected"

        # Build prompt and messages history for multi-turn chat memory
        chat_messages = []
        if history and isinstance(history, list):
            # Take up to last 6 messages to keep token usage within limits
            for h in history[-6:]:
                role = "user" if h.get("role") == "user" else "assistant"
                chat_messages.append({"role": role, "content": h.get("content", "")})

        # Append current user prompt with grounded context
        current_prompt = (
            f"Context from Repository ({full_name}):\n"
            f"{grounding_context}\n\n"
            f"Issue Context: {issue_info}\n\n"
            f"User Question: {user_message}"
        )
        chat_messages.append({"role": "user", "content": current_prompt})

        system_prompt = CHAT_SYSTEM_PROMPT.format(repo_full_name=full_name)

        reply = None
        error_occurred = False

        # Attempt Real Qwen Model Inference
        if self.ai.provider:
            try:
                reply = await self.ai.generate_chat_messages(chat_messages, system_prompt=system_prompt)
            except Exception as e:
                logger.error(f"[ChatService Error] Real Qwen model call failed: {e}")
                error_occurred = True

        # STRICT TASK 3 REQUIREMENT: When DEMO_MODE=false, NO fake AI fallback!
        if not settings.DEMO_MODE:
            if not reply:
                err_text = (
                    "AI model is currently unavailable. Please check the AI configuration (GROQ_API_KEY and AI_MODEL in .env)."
                ) if (error_occurred or not self.ai.provider) else "Unable to generate response from Qwen model."

                return {
                    "reply": err_text,
                    "sources": [],
                    "trust_ratings": {
                        "verified": [],
                        "inferred": [],
                        "unknown": ["AI provider unconfigured or connection failed"]
                    },
                    "suggested_questions": [
                        "Check AI configuration in .env",
                        "Verify GROQ_API_KEY",
                        "Check AI_MODEL setting"
                    ],
                    "error": True
                }

        # DEMO_MODE=true Fallback
        if not reply:
            msg_lower = user_message.lower()
            if "do" in msg_lower or "what" in msg_lower or "overview" in msg_lower or "explain" in msg_lower:
                reply = (
                    f"[DEMO MODE] **{full_name}** is an open-source project. "
                    f"Based on the repository tree, core logic is organized into standard source modules. "
                    f"Read `README.md` and `CONTRIBUTING.md` to begin exploring."
                )
            elif "start" in msg_lower or "where" in msg_lower:
                reply = (
                    f"[DEMO MODE] To start contributing to **{full_name}**:\n"
                    f"1. Read `README.md` for local setup.\n"
                    f"2. Check existing tests in `tests/`.\n"
                    f"3. Pick an open issue labeled 'good first issue'."
                )
            else:
                reply = (
                    f"[DEMO MODE] Analyzed **{full_name}** for query: *'{user_message}'*.\n"
                    f"Inspect the codebase tree or check `README.md` for implementation details."
                )

        if not sources:
            sources.append({
                "title": "README.md",
                "file_path": "README.md",
                "url": f"https://github.com/{full_name}"
            })

        trust_ratings = {
            "verified": [
                f"Verified repository tree & README indexed for {full_name}",
                f"Qwen model inference executed ({settings.AI_MODEL})" if not settings.DEMO_MODE else "Demo Mode response"
            ],
            "inferred": [
                "Logical engineering explanation based on retrieved context"
            ],
            "unknown": [
                "Unspecified local build environment configuration"
            ]
        }

        suggested_questions = [
            f"Explain the architecture of {repo}",
            "Where should a beginner start in this codebase?",
            f"Which files are relevant to issue #{selected_issue_number}" if selected_issue_number else "How do I run tests?",
            "What should I verify before creating a PR?"
        ]

        return {
            "reply": reply,
            "sources": sources,
            "trust_ratings": trust_ratings,
            "suggested_questions": suggested_questions,
            "error": False
        }

