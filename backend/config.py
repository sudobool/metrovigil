import os

# Configuration variables
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./lmpc.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("reports", exist_ok=True)
