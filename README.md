# ⚖️ LMPC Compliance Checker

**Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.**

> **Smart India Hackathon 2026** | **Problem Statement:** SIH26034  
> **Ministry:** Ministry of Consumer Affairs, Food & Public Distribution  
> **Theme:** Agriculture, FoodTech & Rural Development

---

## 🎯 Project Overview

In Indian retail and e-commerce markets, manual verification of mandatory packaging declarations is slow, tedious, and error-prone. This application provides an end-to-end automated compliance engine:

1. **PDP Detection & Shape Analysis:** Uses OpenCV contour analysis and bounding geometry to identify the Principal Display Panel (PDP), classify package shape (rectangular, cylindrical, irregular), and compute mandated PDP area under Rule 6.
2. **AI-Powered OCR & Field Extraction:** Multimodal AI extraction (via Google Gemini Vision API) with Tesseract OCR fallback to extract every required declaration: MRP, Net Quantity, Unit Sale Price (USP), Mfg/Packing Date, Manufacturer Name & Address, Consumer Care details, Country of Origin, and FSSAI number.
3. **Digitized LMPC Rule Engine:** Validates extracted fields against digitized clauses of Rules 6, 7 (Table-I font height based on package geometry), 8 (PDP placement), and 18, generating exact statutory violation notices.
4. **Official Compliance Reports:** Generates downloadable, audit-ready **PDF** and **DOCX** reports with statutory citations, evidence photos, and corrective remediation steps.

---

## 🚀 Quick Start (Single Command)

### Run Everything in 1 Step:
```bash
python run.py
```
This single command:
- Launches the unified backend server on `http://localhost:8000`
- Automatically serves the full React + TypeScript Web Application
- Automatically opens your browser to `http://localhost:8000`
- Provides interactive Swagger API documentation at `http://localhost:8000/docs`

---

## 🧪 Testing with Sample Labels

Four pre-generated, realistic Indian product label images are provided in `sample_labels/`:

| File | Scenario | Expected Compliance Result |
|------|----------|----------------------------|
| `sample_labels/sample_1_compliant.png` | Fully compliant Almonds label | ✅ **Compliant (100%)** — All Rule 6 fields present, valid font height |
| `sample_labels/sample_2_missing_mrp.png` | Atta flour pack | ❌ **Non-Compliant** — Flags critical violation for **Rule 6(1)(e)** (Missing MRP) |
| `sample_labels/sample_3_missing_mfg_address.png` | Namkeen snack pack | ❌ **Non-Compliant** — Flags critical violation for **Rule 6(1)(a)** (Missing Manufacturer details) |
| `sample_labels/sample_4_missing_origin_import.png` | Imported Swiss Chocolate | ❌ **Non-Compliant** — Flags critical violation for **Rule 6(1)(g)** (Missing Country of Origin on import) |

To re-generate or customize these sample labels anytime:
```bash
python backend/generate_sample_labels.py
```

---

## 🧪 Automated Test Suite

To run all unit and integration tests:
```bash
python -m pytest backend/tests/ -v
```
All **8 unit and integration tests** verify:
- Complete end-to-end label image upload pipeline
- Rule 6(1)(a) Manufacturer name & address check
- Rule 6(1)(e) MRP format and presence check
- Rule 6(1)(g) Imported goods country of origin check
- Rule 7 Dynamic font-height compliance based on Table-I PDP area
- PDF and DOCX report generation
- Analytics dashboard metrics calculation

---

## 📋 Digitized LMPC Rules Reference Table

| Rule | Requirement | Severity | Check Logic |
|---|---|---|---|
| **Rule 6(1)(a)** | Manufacturer / Packer Name & Address | Critical | Complete postal address of manufacturer, packer, or importer |
| **Rule 6(1)(b)** | Generic or Common Name | Critical | Standard identification of the commodity inside package |
| **Rule 6(1)(c)** | Net Quantity | Critical | Standard units (g, kg, ml, L, nos, m, cm) |
| **Rule 6(1)(d)** | Month & Year of Mfg / Pkg / Import | Critical | Valid date declaration (e.g., MM/YYYY) |
| **Rule 6(1)(e)** | Maximum Retail Price (MRP) | Critical | Must state "MRP" and "inclusive of all taxes" |
| **Rule 6(1)(f)** | Consumer Care Details | Major | Name, address, telephone number, and email address |
| **Rule 6(1)(g)** | Country of Origin | Critical | Mandatory for all imported products |
| **Rule 6(2)** | Unit Sale Price (USP) | Major | Mandatory price per unit quantity (effective Jan 1, 2024) |
| **Rule 7** | Minimum Font Height | Major | Dynamically verified against Table-I based on computed PDP area |
| **Rule 8** | Principal Display Panel Placement | Major | All mandatory declarations must be grouped on the PDP |

### Rule 7 Font Height Table (Table-I)
- PDP Area $\le 50\text{ cm}^2$ $\rightarrow$ Min height: **$1\text{ mm}$**
- PDP Area $50 - 100\text{ cm}^2$ $\rightarrow$ Min height: **$2\text{ mm}$**
- PDP Area $100 - 500\text{ cm}^2$ $\rightarrow$ Min height: **$4\text{ mm}$**
- PDP Area $> 500\text{ cm}^2$ $\rightarrow$ Min height: **$6\text{ mm}$**

---

## 🛠️ Architecture & Tech Stack

```
prototype/
├── backend/
│   ├── config.py              # Configuration & env management
│   ├── main.py                # FastAPI app with SPA routing & CORS
│   ├── generate_sample_labels.py # Synthetic label generator
│   ├── models/
│   │   ├── database.py        # SQLAlchemy Async ORM models
│   │   └── schemas.py         # Pydantic V2 request/response models
│   ├── rules/
│   │   └── lmpc_rules.json    # Versioned JSON rule-base (Rules as Code)
│   ├── services/
│   │   ├── cv_service.py      # OpenCV PDP area & font height estimation
│   │   ├── ocr_service.py     # Gemini Vision API + Tesseract OCR
│   │   ├── rule_engine.py     # LMPC Rules 2011 compliance validation
│   │   └── report_generator.py # ReportLab (PDF) & python-docx (DOCX)
│   ├── routers/
│   │   ├── auth.py            # JWT authentication & role management
│   │   ├── scan.py            # Image upload & analysis pipeline
│   │   ├── reports.py         # Report generation & downloads
│   │   └── dashboard.py       # Aggregated compliance analytics
│   └── tests/
│       ├── test_rule_engine.py # Unit tests for legal rules
│       └── test_end_to_end.py  # Integration tests for upload & reports
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # React router, navigation & auth context
│   │   ├── types/index.ts     # TypeScript domain definitions
│   │   ├── services/api.ts    # Axios API client
│   │   ├── components/        # UI components (Navbar, Stats, Upload, etc.)
│   │   └── pages/             # Login, Dashboard, Scan, History, Report
│   ├── package.json           # React 18, Tailwind, Lucide, Recharts
│   └── vite.config.ts         # Vite configuration with API proxy
├── sample_labels/             # Synthetic test packaging labels
├── run.py                     # Unified single-command launcher
└── README.md                  # Project documentation
```

---

## 👥 Role-Based Access Control

The application supports 3 distinct workflows:
- **Enforcement Officer:** Conduct market sweeps, scan shelf products, flag illegal declarations, export statutory evidence notices.
- **Retailer / Seller:** Pre-screen inventory before listing or dispatch to prevent seizures and penalties.
- **Administrator:** View national/regional compliance analytics, track violation frequency by rule number, audit scan logs.

---

*Developed for Smart India Hackathon 2026 | Ministry of Consumer Affairs, Food & Public Distribution*
