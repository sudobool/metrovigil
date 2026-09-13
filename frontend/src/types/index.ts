export interface ExtractedField {
  id: number;
  field_name: string;
  field_value: string | null;
  confidence: number;
  is_present: boolean;
  rule_reference: string;
}

export interface Violation {
  id: number;
  scan_id?: number;
  rule_number: string;
  rule_description: string;
  severity: 'critical' | 'major' | 'minor';
  details: string;
  suggestion: string;
}

export interface Scan {
  id: number;
  original_filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  compliance_status: 'compliant' | 'non_compliant' | 'partial' | null;
  compliance_score: number | null;
  product_name: string | null;
  created_at: string;
}

export interface ScanDetail extends Scan {
  fields: ExtractedField[];
  violations: Violation[];
  filename: string;
  // Where the extracted data came from: "gemini" / "tesseract" (live AI/OCR),
  // "demo_fallback" (offline sample data for a bundled sample label), or
  // "failed" (nothing could be extracted).
  extraction_source?: 'gemini' | 'tesseract' | 'demo_fallback' | 'failed' | null;
  extraction_message?: string | null;
}

export interface DashboardStats {
  total_scans: number;
  compliant_count: number;
  non_compliant_count: number;
  partial_count: number;
  compliance_rate: number;
  common_violations: { rule: string; count: number; description: string }[];
}

export interface User {
  username: string;
  role: 'officer' | 'retailer' | 'admin';
}
