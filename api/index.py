"""
Vercel Python Serverless entry point for RoadSense AI FastAPI backend.

This file wraps the FastAPI app with the Mangum ASGI adapter so Vercel
can invoke it as a serverless function.

Vercel routes all /api/v1/* requests here via vercel.json.
"""
import sys
import os

# Make the backend package importable from this file's location
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

# Import the FastAPI application
from main import app  # noqa: E402

# Wrap with Mangum for Vercel/AWS Lambda ASGI compatibility
from mangum import Mangum  # noqa: E402

handler = Mangum(app, lifespan="auto")
