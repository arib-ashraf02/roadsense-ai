# Thread-safe in-memory job store for video processing
# Replace with Redis-backed store in production
import threading
from typing import Dict, Optional
from datetime import datetime

_jobs: Dict[str, dict] = {}
_lock = threading.Lock()


def create_job(job_id: str, metadata: dict) -> dict:
    """Create a new job entry. Returns the created job dict."""
    with _lock:
        job = {
            "id": job_id,
            "status": "PENDING",
            "progress": 0,
            "result": None,
            "error": None,
            "created_at": datetime.utcnow().isoformat(),
            **metadata,
        }
        _jobs[job_id] = job
        return dict(job)


def update_job(job_id: str, **kwargs) -> Optional[dict]:
    """Update fields on an existing job. Returns updated job or None."""
    with _lock:
        if job_id in _jobs:
            _jobs[job_id].update(kwargs)
            return dict(_jobs[job_id])
        return None


def get_job(job_id: str) -> Optional[dict]:
    """Fetch a job by ID. Returns None if not found."""
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None


def list_jobs() -> list:
    """Return all jobs (for debugging/admin)."""
    with _lock:
        return [dict(j) for j in _jobs.values()]
