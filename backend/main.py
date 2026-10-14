"""
================================================================================
AquaMind AI - Main Application Entry Point
================================================================================
Run with:
    uvicorn main:app --reload --port 8000
================================================================================
"""

from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import water_allocation
import maintenance_prediction
import dashboard_data

app = FastAPI(
    title="AquaMind AI",
    description="Smart Hostel Water Allocation and Predictive Maintenance System",
    version="2.0",
)

# Enable CORS for local development and cross-port calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers from each module
app.include_router(water_allocation.router)
app.include_router(maintenance_prediction.router)
app.include_router(dashboard_data.router)

# Handle favicon.ico cleanly to avoid 404 warnings in terminal
FAVICON_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    '<text y=".9em" font-size="90">💧</text></svg>'
)

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(content=FAVICON_SVG, media_type="image/svg+xml")

# Mount the frontend directory if present
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
