from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from ..models.database import get_db, Scan, Violation
from ..models.schemas import DashboardStatsResponse, UserResponse
from .auth import get_current_user

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    # Aggregate counts in SQL instead of loading every scan row into
    # Python — keeps this fast as the scans table grows.
    status_counts_result = await db.execute(
        select(Scan.compliance_status, func.count(Scan.id)).group_by(Scan.compliance_status)
    )
    status_counts = {row[0]: row[1] for row in status_counts_result.all()}

    compliant = status_counts.get("compliant", 0)
    non_compliant = status_counts.get("non_compliant", 0)
    partial = status_counts.get("partial", 0)
    total = sum(status_counts.values())

    compliance_rate = (compliant / total * 100) if total > 0 else 0

    # Common violations breakdown
    violations_result = await db.execute(
        select(Violation.rule_number, func.count(Violation.id)).group_by(Violation.rule_number)
    )
    breakdown = [{"rule_number": row[0], "count": row[1]} for row in violations_result.all()]

    return {
        "total_scans": total,
        "compliant_count": compliant,
        "non_compliant_count": non_compliant,
        "partial_count": partial,
        "compliance_rate": compliance_rate,
        "common_violations": breakdown,
    }


@router.get("/recent")
async def get_recent_scans(
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    result = await db.execute(select(Scan).order_by(Scan.created_at.desc()).limit(10))
    scans = result.scalars().all()
    return [s.__dict__ for s in scans]


@router.get("/violations-breakdown")
async def get_violations_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    violations_result = await db.execute(
        select(Violation.rule_number, func.count(Violation.id)).group_by(Violation.rule_number)
    )
    return [{"rule_number": row[0], "count": row[1]} for row in violations_result.all()]
