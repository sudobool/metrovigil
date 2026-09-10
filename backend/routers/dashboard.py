from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from ..models.database import get_db, Scan, Violation
from ..models.schemas import DashboardStatsResponse, ScanResponse

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    scans_result = await db.execute(select(Scan))
    all_scans = scans_result.scalars().all()
    
    total = len(all_scans)
    compliant = sum(1 for s in all_scans if s.compliance_status == 'compliant')
    non_compliant = sum(1 for s in all_scans if s.compliance_status == 'non_compliant')
    partial = sum(1 for s in all_scans if s.compliance_status == 'partial')
    
    compliance_rate = (compliant / total * 100) if total > 0 else 0
    
    # Common violations breakdown
    violations_result = await db.execute(select(Violation.rule_number, func.count(Violation.id)).group_by(Violation.rule_number))
    breakdown = [{"rule_number": row[0], "count": row[1]} for row in violations_result.all()]
    
    return {
        "total_scans": total,
        "compliant_count": compliant,
        "non_compliant_count": non_compliant,
        "partial_count": partial,
        "compliance_rate": compliance_rate,
        "common_violations": breakdown
    }

@router.get("/recent")
async def get_recent_scans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).order_by(Scan.created_at.desc()).limit(10))
    scans = result.scalars().all()
    return [s.__dict__ for s in scans]

@router.get("/violations-breakdown")
async def get_violations_breakdown(db: AsyncSession = Depends(get_db)):
    violations_result = await db.execute(select(Violation.rule_number, func.count(Violation.id)).group_by(Violation.rule_number))
    return [{"rule_number": row[0], "count": row[1]} for row in violations_result.all()]
