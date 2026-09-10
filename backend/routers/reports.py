import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.database import get_db, Scan, ExtractedField, Violation
from ..services.report_generator import generate_pdf_report, generate_docx_report
from ..config import UPLOAD_DIR

router = APIRouter()

@router.get("/{scan_id}/pdf")
async def get_pdf_report(scan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    fields_res = await db.execute(select(ExtractedField).where(ExtractedField.scan_id == scan_id))
    violations_res = await db.execute(select(Violation).where(Violation.scan_id == scan_id))
    
    image_path = os.path.join(UPLOAD_DIR, scan.filename)
    
    filepath = generate_pdf_report(scan, fields_res.scalars().all(), violations_res.scalars().all(), image_path)
    return FileResponse(filepath, filename=os.path.basename(filepath), media_type='application/pdf')

@router.get("/{scan_id}/docx")
async def get_docx_report(scan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    fields_res = await db.execute(select(ExtractedField).where(ExtractedField.scan_id == scan_id))
    violations_res = await db.execute(select(Violation).where(Violation.scan_id == scan_id))
    
    image_path = os.path.join(UPLOAD_DIR, scan.filename)
    
    filepath = generate_docx_report(scan, fields_res.scalars().all(), violations_res.scalars().all(), image_path)
    return FileResponse(filepath, filename=os.path.basename(filepath), media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
