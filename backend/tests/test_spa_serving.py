"""
Test that FastAPI successfully serves the built React SPA and API concurrently.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.anyio
async def test_spa_serving():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root should return index.html
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "text/html" in resp.headers["content-type"]
        assert 'id="root"' in resp.text

        # 2. Client-side route /dashboard should also serve index.html
        dash_resp = await client.get("/dashboard")
        assert dash_resp.status_code == 200
        assert 'id="root"' in dash_resp.text

        # 3. API endpoint should still work normally (now requires auth)
        login_resp = await client.post(
            "/api/auth/login",
            json={"username": "officer", "password": "officer123", "role": "officer"},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]

        api_resp = await client.get(
            "/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"}
        )
        assert api_resp.status_code == 200
        assert "application/json" in api_resp.headers["content-type"]
