"""
Launcher for Legal Metrology (Packaged Commodities) Rules 2011 Compliance Checker.
Runs the unified FastAPI server which serves both the REST API and the React Web UI.
"""

import os
import sys
import webbrowser
import threading
import time

# Ensure Windows terminal doesn't crash on unicode / emojis
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import uvicorn

def open_browser():
    """Wait for server startup and open browser."""
    time.sleep(2.0)
    url = "http://localhost:8000"
    print(f"\n[+] Opening browser at: {url}")
    webbrowser.open(url)

def main():
    print("=" * 75)
    print("  [METROVIGIL] AI-POWERED LEGAL METROLOGY COMPLIANCE ENGINE")
    print("  Smart India Hackathon 2026 | Ministry of Consumer Affairs, Govt. of India")
    print("=" * 75)
    
    # Ensure sample labels exist
    sample_dir = os.path.join(os.path.dirname(__file__), "sample_labels")
    if not os.path.exists(sample_dir) or len(os.listdir(sample_dir)) == 0:
        print("[*] Generating synthetic test label images...")
        try:
            from backend.generate_sample_labels import main as gen_labels
            gen_labels()
        except Exception as e:
            print(f"[!] Warning generating sample labels: {e}")

    print("\n[*] Starting MetroVigil Web Server...")
    print("  -> Web Dashboard:  http://localhost:8000")
    print("  -> API Docs:       http://localhost:8000/docs")
    print("  -> Sample Labels:  sample_labels/")
    print("\n[+] Press CTRL+C to stop the server\n" + "-" * 75 + "\n")

    # Start browser in background
    threading.Thread(target=open_browser, daemon=True).start()

    # Run uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
