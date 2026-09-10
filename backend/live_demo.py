"""
Live Demonstration Script for SIH 2026 Legal Metrology Scanner.
Uploads all 4 sample packaging labels to the running server, displays the
extracted declarations, statutory violations, compliance scores, and generated reports.
"""

import os
import sys
import httpx

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


BASE_URL = "http://127.0.0.1:8000"
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_labels")

def main():
    print("\n" + "=" * 75)
    print("  ⚖️  LMPC COMPLIANCE SCANNER — LIVE DEMONSTRATION RUN")
    print("  Legal Metrology (Packaged Commodities) Rules, 2011")
    print("=" * 75)

    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Test Server Connectivity
    try:
        r = client.get("/")
        print(f"\n[1] Connecting to Server: {BASE_URL}")
        print(f"    Server Response Code: {r.status_code} OK")
    except Exception as e:
        print(f"[!] Could not connect to {BASE_URL}: {e}")
        return

    # 2. Login
    login_resp = client.post("/api/auth/login", json={"username": "rajesh_officer", "role": "officer"})
    token = login_resp.json()["token"]
    user = login_resp.json()["user"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[2] Authenticated as: {user['username']} (Role: {user['role'].upper()})")

    # 3. Process Sample Labels
    labels = [
        ("sample_1_compliant.png", "Roasted Almonds Packaging"),
        ("sample_2_missing_mrp.png", "Wheat Atta 5kg Pack"),
        ("sample_3_missing_mfg_address.png", "Spicy Bhujia Namkeen"),
        ("sample_4_missing_origin_import.png", "Imported Swiss Chocolate")
    ]

    scans_data = []

    print("\n" + "-" * 75)
    print("  SCANNING SAMPLES AGAINST STATUTORY RULES")
    print("-" * 75)

    for filename, description in labels:
        file_path = os.path.join(SAMPLES_DIR, filename)
        if not os.path.exists(file_path):
            print(f"[!] File not found: {file_path}")
            continue

        print(f"\n[*] Uploading & Scanning: {filename} ({description})...")
        with open(file_path, "rb") as f:
            resp = client.post("/api/scan/upload", files={"file": (filename, f, "image/png")})

        if resp.status_code != 200:
            print(f"    [!] Error scanning {filename}: {resp.text}")
            continue

        data = resp.json()
        scans_data.append(data)

        # Status badge
        status = data["compliance_status"].upper()
        score = data["compliance_score"]
        status_icon = "✅" if status == "COMPLIANT" else ("❌" if status == "NON_COMPLIANT" else "⚠️")

        print(f"    Result: {status_icon} {status} (Score: {score:.1f}/100)")
        print(f"    Product Name: {data.get('product_name') or 'N/A'}")
        
        # Extracted fields summary
        fields_present = [f['field_name'] for f in data['fields'] if f['is_present']]
        fields_missing = [f['field_name'] for f in data['fields'] if not f['is_present']]
        print(f"    Declarations Detected ({len(fields_present)}): {', '.join(fields_present[:5])}...")
        if fields_missing:
            print(f"    Declarations Missing  ({len(fields_missing)}): {', '.join(fields_missing)}")

        # Violations detected
        violations = data["violations"]
        if violations:
            print(f"    Violations Detected ({len(violations)}):")
            for v in violations:
                sev_icon = "🔴" if v['severity'] == 'critical' else ("🟠" if v['severity'] == 'major' else "🟡")
                print(f"      {sev_icon} [{v['severity'].upper()}] Rule {v['rule_number']}: {v['rule_description']}")
                print(f"         Details:    {v['details']}")
                print(f"         Remedy:     {v['suggestion']}")
        else:
            print("    Violations Detected: NONE (All LMPC mandatory declarations satisfied)")

        # Download reports
        scan_id = data["id"]
        pdf_res = client.get(f"/api/reports/{scan_id}/pdf")
        docx_res = client.get(f"/api/reports/{scan_id}/docx")
        print(f"    Generated Reports: PDF ({len(pdf_res.content)} bytes), DOCX ({len(docx_res.content)} bytes)")

    # 4. Fetch Aggregate Dashboard Statistics
    print("\n" + "=" * 75)
    print("  LIVE COMPLIANCE DASHBOARD ANALYTICS")
    print("=" * 75)
    dash_resp = client.get("/api/dashboard/stats", headers=headers)
    stats = dash_resp.json()
    print(f"  Total Packages Scanned:  {stats['total_scans']}")
    print(f"  Compliant Packages:      {stats['compliant_count']}")
    print(f"  Non-Compliant Packages:  {stats['non_compliant_count']}")
    print(f"  Partially Compliant:     {stats['partial_count']}")
    print(f"  Overall Compliance Rate: {stats['compliance_rate']:.1f}%")

    if stats.get("common_violations"):
        print("\n  Statutory Violations Breakdown by Rule Number:")
        for v in stats["common_violations"]:
            print(f"    • Rule {v['rule_number']:<10}: {v['count']} infractions logged")

    print("\n" + "=" * 75)
    print("  [+] DEMO SUCCESSFUL: Web App running at http://localhost:8000")
    print("  [+] Swagger API Documentation at http://localhost:8000/docs")
    print("=" * 75 + "\n")

if __name__ == "__main__":
    main()
