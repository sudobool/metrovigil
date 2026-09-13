import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models.database import init_db
from .routers import auth, scan, reports, dashboard
from .config import UPLOAD_DIR

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Ensure directories exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    # Initialize database tables
    await init_db()
    yield


app = FastAPI(
    title="MetroVigil – AI-Powered Legal Metrology Compliance Engine",
    description="Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving uploaded images, sample labels, and generated reports
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory="reports"), name="reports")
sample_dir = os.path.join(os.path.dirname(__file__), "..", "sample_labels")
if os.path.exists(sample_dir):
    app.mount("/sample_labels", StaticFiles(directory=sample_dir), name="sample_labels")


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(scan.router, prefix="/api/scan", tags=["Scanning"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# Serve built frontend SPA if available
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(DIST_DIR):
    from fastapi.responses import FileResponse
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve SPA client routes and static files."""
        if full_path:
            candidate = os.path.join(DIST_DIR, full_path)
            if os.path.exists(candidate) and os.path.isfile(candidate):
                return FileResponse(candidate)
        index_html = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_html):
            resp = FileResponse(index_html)
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            resp.headers["Pragma"] = "no-cache"
            resp.headers["Expires"] = "0"
            return resp
        return {"name": "MetroVigil AI Compliance Engine", "version": "1.0.0"}
else:
    @app.get("/")
    async def root():
        """Root endpoint returning API information."""
        return {
            "name": "LMPC Compliance Checker API",
            "version": "1.0.0",
            "description": "Legal Metrology (Packaged Commodities) Rules, 2011 Compliance Scanner",
            "docs": "/docs",
        }

