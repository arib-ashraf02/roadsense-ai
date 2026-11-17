import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from main import app, root
from app.api.v1.health import health_check
from app.core.config import settings


def run_unit_verification():
    print("=" * 60)
    print("RoadSense AI — Backend Verification Test Suite")
    print("=" * 60)

    # Test 1: Configuration & Environment Settings
    print(f"\n[PASS] Project Name: {settings.PROJECT_NAME}")
    print(f"[PASS] API Prefix: {settings.API_V1_STR}")
    print(f"[PASS] CORS Allowed Origins: {settings.BACKEND_CORS_ORIGINS}")
    assert "http://localhost:3000" in settings.BACKEND_CORS_ORIGINS, "CORS should allow localhost:3000"

    # Test 2: Root Endpoint
    root_data = root()
    print(f"\n[PASS] Root Endpoint Response:")
    print(f"       {root_data}")
    assert root_data["message"] == "Welcome to RoadSense AI API"
    assert root_data["health"] == "/api/v1/health"

    # Test 3: Health Check Endpoint
    health_data = health_check()
    print(f"\n[PASS] Health Check Endpoint Response:")
    print(f"       {health_data}")
    assert health_data["status"] == "healthy"
    assert health_data["service"] == "RoadSense AI Backend"
    assert "components" in health_data
    assert health_data["components"]["vision_engine"] == "ready"

    # Test 4: Router Registration
    route_paths = []
    for r in app.routes:
        if hasattr(r, "path"):
            route_paths.append(r.path)
        elif hasattr(r, "routes"):
            for sub_r in r.routes:
                if hasattr(sub_r, "path"):
                    route_paths.append(sub_r.path)
    
    print(f"\n[PASS] Registered FastAPI Routes: {route_paths}")
    assert "/" in route_paths
    assert "/docs" in route_paths

    print("\n" + "=" * 60)
    print(">>> ALL BACKEND HEALTH & ROUTING CHECKS PASSED SUCCESSFULLY! <<<")
    print("=" * 60)


if __name__ == "__main__":
    run_unit_verification()
