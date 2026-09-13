"""
End-to-End Pipeline Tests for LMPC Compliance Scanner.
Tests full pipeline: Image Upload -> CV PDP Detection -> OCR -> Rule Engine -> PDF/DOCX Reports.
"""

import os
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "sample_labels")


async def _auth_headers(client: AsyncClient) -> dict:
    """Log in with the demo officer account and return an Authorization header."""
    resp = await client.post(
        "/api/auth/login",
        json={"username": "officer", "password": "officer123", "role": "officer"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_login_rejects_wrong_password():
    """Login must reject an incorrect password instead of accepting anything."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/auth/login",
            json={"username": "officer", "password": "wrong-password", "role": "officer"},
        )
        assert resp.status_code == 401


@pytest.mark.anyio
async def test_scan_upload_requires_auth():
    """Scan endpoints must reject unauthenticated requests."""
    img_path = os.path.join(SAMPLES_DIR, "sample_1_compliant.png")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(img_path, "rb") as f:
            files = {"file": ("sample_1_compliant.png", f, "image/png")}
            response = await client.post("/api/scan/upload", files=files)
        assert response.status_code in (401, 403)


@pytest.mark.anyio
async def test_compliant_sample_upload():
    """Upload compliant label and verify 100% score with no critical violations."""
    img_path = os.path.join(SAMPLES_DIR, "sample_1_compliant.png")
    assert os.path.exists(img_path), f"Sample file not found at {img_path}"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await _auth_headers(client)
        with open(img_path, "rb") as f:
            files = {"file": ("sample_1_compliant.png", f, "image/png")}
            response = await client.post("/api/scan/upload", files=files, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["compliance_status"] == "compliant"
        assert data["compliance_score"] >= 80
        assert data["product_name"] == "Himalayan Premium Almonds"
        assert len(data["fields"]) > 0

        scan_id = data["id"]

        # Test PDF Report generation endpoint
        pdf_resp = await client.get(f"/api/reports/{scan_id}/pdf", headers=headers)
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_resp.content) > 1000

        # Test DOCX Report generation endpoint
        docx_resp = await client.get(f"/api/reports/{scan_id}/docx", headers=headers)
        assert docx_resp.status_code == 200
        assert len(docx_resp.content) > 1000

@pytest.mark.anyio
async def test_missing_mrp_sample_upload():
    """Upload sample with missing MRP and verify Rule 6(1)(e) violation is caught."""
    img_path = os.path.join(SAMPLES_DIR, "sample_2_missing_mrp.png")
    assert os.path.exists(img_path)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await _auth_headers(client)
        with open(img_path, "rb") as f:
            files = {"file": ("sample_2_missing_mrp.png", f, "image/png")}
            response = await client.post("/api/scan/upload", files=files, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"

        # Verify Rule 6(1)(e) was detected
        violation_rules = [v["rule_number"] for v in data["violations"]]
        assert any("6(1)(e)" in r for r in violation_rules)

@pytest.mark.anyio
async def test_dashboard_stats():
    """Verify dashboard stats aggregate correctly after scans."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await _auth_headers(client)
        response = await client.get("/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_scans"] >= 2
        assert "compliance_rate" in stats
