"""
Unit tests for LMPC Rule Engine (Legal Metrology Packaged Commodities Rules, 2011).
Tests digitized checks for Rules 6, 7, 8 and amendment 2017/2024.
"""

import pytest
from backend.services.rule_engine import LMPCRuleEngine

@pytest.fixture
def engine():
    return LMPCRuleEngine()

def test_fully_compliant_product(engine):
    """A product label with all mandatory declarations should be compliant."""
    fields = {
        "product_name": "Roasted Almonds",
        "generic_name": "Roasted California Almonds",
        "net_quantity": "500 g",
        "mrp": "MRP Rs. 499.00 inclusive of all taxes",
        "unit_sale_price": "Rs. 0.998 per g",
        "mfg_date": "11/2024",
        "manufacturer_name": "Himalayan Agro Foods Pvt. Ltd., Okhla, New Delhi",
        "consumer_care": "care@himalayanfoods.in, 011-26894455",
        "country_of_origin": "India",
        "declarations_on_pdp": True,
        "is_imported": False
    }
    cv_data = {
        "pdp_area_cm2": 150.0,
        "font": {"estimated_height_mm": 4.5}  # Table-I requirement for 100-500cm2 is 4mm
    }

    result = engine.validate(fields, cv_data)
    assert result["compliance_status"] == "compliant"
    assert result["compliance_score"] >= 80
    assert len(result["violations"]) == 0

def test_missing_mrp_violation(engine):
    """Missing or invalid MRP must trigger Rule 6(1)(e) violation."""
    fields = {
        "product_name": "Atta",
        "generic_name": "Whole Wheat Flour",
        "net_quantity": "5 kg",
        "mrp": None,  # Missing!
        "unit_sale_price": "Rs. 45/kg",
        "mfg_date": "12/2024",
        "manufacturer_name": "Bharat Mills, Ludhiana",
        "consumer_care": "care@bharat.com"
    }
    cv_data = {"pdp_area_cm2": 250.0}

    result = engine.validate(fields, cv_data)
    violations = [v for v in result["violations"] if "6(1)(e)" in v["rule_number"]]
    assert len(violations) > 0
    assert violations[0]["severity"] == "critical"

def test_missing_mfg_address(engine):
    """Missing manufacturer/packer must trigger Rule 6(1)(a) critical violation."""
    fields = {
        "product_name": "Bhujia Sev",
        "generic_name": "Spicy Bhujia",
        "net_quantity": "200 g",
        "mrp": "MRP Rs. 40.00 inclusive of all taxes",
        "manufacturer_name": None,  # Missing!
        "mfg_date": "01/2025"
    }
    cv_data = {}

    result = engine.validate(fields, cv_data)
    violations = [v for v in result["violations"] if "6(1)(a)" in v["rule_number"]]
    assert len(violations) > 0
    assert violations[0]["severity"] == "critical"

def test_rule_7_font_height_violation(engine):
    """Font height smaller than mandated for PDP area must trigger Rule 7."""
    fields = {
        "product_name": "Fruit Juice",
        "generic_name": "Apple Juice",
        "net_quantity": "1 L",
        "mrp": "MRP Rs. 120.00 inclusive of all taxes",
        "unit_sale_price": "Rs. 0.12/ml",
        "mfg_date": "10/2024",
        "manufacturer_name": "Juice Co, Mumbai",
        "consumer_care": "care@juice.com"
    }
    # Large package > 500 cm2 requires minimum 6mm font height
    cv_data = {
        "pdp_area_cm2": 600.0,
        "font": {"estimated_height_mm": 2.0}  # Only 2mm (breach!)
    }

    result = engine.validate(fields, cv_data)
    violations = [v for v in result["violations"] if v["rule_number"] == "7"]
    assert len(violations) > 0
    assert "less than required (6mm)" in violations[0]["details"]

def test_imported_product_missing_country_of_origin(engine):
    """Imported commodity without country of origin must trigger Rule 6(1)(g)."""
    fields = {
        "product_name": "Swiss Chocolate",
        "generic_name": "Dark Chocolate",
        "net_quantity": "100 g",
        "mrp": "MRP Rs. 299.00 inclusive of all taxes",
        "is_imported": True,
        "country_of_origin": None,  # Missing!
        "manufacturer_name": "Global Imports Ltd",
        "mfg_date": "09/2024"
    }
    cv_data = {}

    result = engine.validate(fields, cv_data)
    violations = [v for v in result["violations"] if "6(1)(g)" in v["rule_number"]]
    assert len(violations) > 0
    assert violations[0]["severity"] == "critical"
