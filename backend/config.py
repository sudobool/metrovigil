import logging
import os
import secrets

# Configuration variables
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./lmpc.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Application secret key ──────────────────────────────────────────────
# Previously this defaulted to a fixed, publicly-known string
# ("supersecretjwtkey") which meant anyone could forge valid login tokens
# for any account/role in a default install. We now require an explicit
# SECRET_KEY for production use, but auto-generate a random one at startup
# so the app still runs out of the box for local/demo use without any
# extra setup. A generated key changes every restart (all sessions are
# invalidated), which is expected for a demo environment.
_env_secret = os.getenv("SECRET_KEY", "").strip()
if _env_secret:
    SECRET_KEY = _env_secret
else:
    SECRET_KEY = secrets.token_hex(32)
    logging.getLogger("metrovigil.config").warning(
        "SECRET_KEY is not set in the environment — generated a random key "
        "for this run. Login tokens will stop working after a restart, and "
        "this is NOT safe for a real deployment. Set SECRET_KEY in your "
        "environment (see .env.example) before deploying MetroVigil."
    )

# Upload constraints
ALLOWED_UPLOAD_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_UPLOAD_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("reports", exist_ok=True)
