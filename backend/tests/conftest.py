"""
Shared pytest setup.

Tests exercise the FastAPI app via httpx's ASGITransport, which does not
trigger FastAPI's startup/lifespan events on its own — so without this,
the `scans` table (normally created by `init_db()` in main.py's lifespan
handler) never gets created and every DB-touching test fails with
"no such table: scans".

This runs once at collection time (plain module-level code, not a pytest
fixture) so it applies uniformly to both the async (anyio-marked) tests
and the plain sync tests in this suite, without getting tangled up in
event-loop/fixture-scope interactions between the two.
"""

import asyncio

from backend.models.database import init_db

asyncio.run(init_db())
