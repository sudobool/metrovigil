import json
import os

class LMPCRuleEngine:
    def __init__(self):
        rules_path = os.path.join(os.path.dirname(__file__), '..', 'rules', 'lmpc_rules.json')
        with open(rules_path, 'r') as f:
            self.rules = json.load(f)

    def validate(self, extracted_fields: dict, cv_data: dict) -> dict:
        violations = []
        field_results = []
        score = 100

        # Run checks
        self._check_mandatory_fields(extracted_fields, violations, field_results)
        if extracted_fields.get('mrp'):
            self._check_mrp_format(extracted_fields['mrp'], violations)
        if extracted_fields.get('net_quantity'):
            self._check_net_quantity_format(extracted_fields['net_quantity'], violations)
        if extracted_fields.get('mfg_date'):
            self._check_mfg_date_format(extracted_fields['mfg_date'], violations)
        
        self._check_font_height(cv_data, violations)
        self._check_pdp_placement(extracted_fields, violations)
        self._check_unit_sale_price(extracted_fields, violations)
        self._check_country_of_origin(extracted_fields, violations)

        # Deduct scores
        for v in violations:
            if v['severity'] == 'critical':
                score -= 15
            elif v['severity'] == 'major':
                score -= 10
            elif v['severity'] == 'minor':
                score -= 5
                
        score = max(0, score)

        if score >= 80:
            compliance_status = "compliant"
        elif score >= 50:
            compliance_status = "partial"
        else:
            compliance_status = "non_compliant"

        return {
            "compliance_status": compliance_status,
            "compliance_score": score,
            "violations": violations,
            "field_results": field_results
        }

    def _check_mandatory_fields(self, fields, violations, field_results):
        for req in self.rules['mandatory_declarations']:
            field_name = req['field']
            is_present = bool(fields.get(field_name))
            
            field_results.append({
                "field_name": field_name,
                "field_value": fields.get(field_name),
                "is_present": is_present,
                "rule_reference": req['rule']
            })
            
            # Conditionally required
            if not req.get('required', True):
                continue
                
            if not is_present:
                violations.append({
                    "rule_number": req['rule'],
                    "rule_description": req['description'],
                    "severity": req['severity'],
                    "details": f"Missing mandatory field: {field_name}",
                    "suggestion": f"Add {req['description']} to the packaging."
                })

    def _check_mrp_format(self, mrp_value, violations):
        val = str(mrp_value).lower()
        if "mrp" not in val or "inclusive of all taxes" not in val:
            violations.append({
                "rule_number": "6(1)(e)",
                "rule_description": "Maximum retail price inclusive of all taxes",
                "severity": "major",
                "details": f"MRP declaration format invalid: '{mrp_value}'. Must contain 'MRP' and 'inclusive of all taxes'.",
                "suggestion": "Update MRP format to explicitly state 'MRP [Price] inclusive of all taxes'."
            })

    def _check_net_quantity_format(self, qty_value, violations):
        # Basic check for presence of digits and units
        import re
        if not re.search(r'\d+', str(qty_value)):
            violations.append({
                "rule_number": "6(1)(c)",
                "rule_description": "Net quantity",
                "severity": "minor",
                "details": f"Invalid net quantity format: '{qty_value}'",
                "suggestion": "Ensure valid numeric value and unit."
            })

    def _check_mfg_date_format(self, date_value, violations):
        import re
        # Check for month and year components
        if not re.search(r'\d+', str(date_value)):
             violations.append({
                "rule_number": "6(1)(d)",
                "rule_description": "Month and year of manufacture",
                "severity": "minor",
                "details": f"Manufacturing date unclear: '{date_value}'",
                "suggestion": "Format as Month and Year."
            })

    def _check_font_height(self, cv_data, violations):
        if not cv_data.get('font'):
            return
            
        est_height = cv_data['font'].get('estimated_height_mm', 0)
        area_cm2 = cv_data.get('pdp_area_cm2', 0)
        
        required_height = 1
        for row in self.rules['font_height_table']:
            if row['pdp_area_min'] <= area_cm2 < row['pdp_area_max']:
                required_height = row['min_height_mm']
                break
                
        if est_height > 0 and est_height < required_height * 0.8: # 20% tolerance
            violations.append({
                "rule_number": "7",
                "rule_description": "Height of numeral in declaration",
                "severity": "major",
                "details": f"Estimated font height ({est_height:.1f}mm) is less than required ({required_height}mm) for PDP area {area_cm2:.1f} cm².",
                "suggestion": f"Increase font size to at least {required_height}mm."
            })

    def _check_pdp_placement(self, fields, violations):
        if fields.get('declarations_on_pdp') is False:
             violations.append({
                "rule_number": "8",
                "rule_description": "Declaration on Principal Display Panel",
                "severity": "major",
                "details": "Mandatory declarations do not appear to be grouped on the Principal Display Panel.",
                "suggestion": "Move all mandatory declarations to the PDP."
            })

    def _check_unit_sale_price(self, fields, violations):
        if not fields.get('unit_sale_price'):
            violations.append({
                "rule_number": "6(2)",
                "rule_description": "Unit sale price",
                "severity": "major",
                "details": "Unit sale price declaration is missing.",
                "suggestion": "Add Unit Sale Price declaration (mandatory from Jan 2024)."
            })

    def _check_country_of_origin(self, fields, violations):
        if fields.get('is_imported') and not fields.get('country_of_origin'):
            violations.append({
                "rule_number": "6(1)(g)",
                "rule_description": "Country of origin",
                "severity": "critical",
                "details": "Country of origin missing for imported product.",
                "suggestion": "Add country of origin declaration."
            })
