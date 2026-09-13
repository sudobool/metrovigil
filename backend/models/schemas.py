from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ScanCreate(BaseModel):
    original_filename: str

class ScanResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    status: str
    compliance_status: Optional[str] = None
    compliance_score: Optional[float] = None
    product_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ScanListResponse(BaseModel):
    scans: List[ScanResponse]
    total: int

class ExtractedFieldResponse(BaseModel):
    id: int
    scan_id: int
    field_name: str
    field_value: Optional[str] = None
    confidence: Optional[float] = None
    is_present: bool
    rule_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ViolationResponse(BaseModel):
    id: int
    scan_id: int
    rule_number: str
    rule_description: str
    severity: str
    details: str
    suggestion: str

    model_config = ConfigDict(from_attributes=True)

class ScanDetailResponse(ScanResponse):
    fields: List[ExtractedFieldResponse] = []
    violations: List[ViolationResponse] = []
    extraction_source: Optional[str] = None
    extraction_message: Optional[str] = None

class ViolationBreakdown(BaseModel):
    rule_number: str
    count: int

class DashboardStatsResponse(BaseModel):
    total_scans: int
    compliant_count: int
    non_compliant_count: int
    partial_count: int
    compliance_rate: float
    common_violations: List[ViolationBreakdown] = []

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None  # informational only; the server derives the real role

class UserResponse(BaseModel):
    username: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse
