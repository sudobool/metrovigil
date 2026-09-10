import os
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.database import get_db, Scan, ExtractedField, Violation
from ..models.schemas import ScanDetailResponse, ScanListResponse, ScanResponse
from ..services.ocr_service import extract_fields
from ..services.cv_service import detect_pdp_area, estimate_font_height, classify_package_shape
from ..services.rule_engine import LMPCRuleEngine
from ..config import UPLOAD_DIR

router = APIRouter()
rule_engine = LMPCRuleEngine()

@router.post("/upload", response_model=ScanDetailResponse)
async def upload_scan(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    # Create scan record
    new_scan = Scan(
        filename=file.filename,
        original_filename=file.filename,
        status="processing"
    )
    db.add(new_scan)
    await db.commit()
    await db.refresh(new_scan)

    try:
        # Run CV and OCR services
        pdp_data = detect_pdp_area(file_path)
        font_data = estimate_font_height(file_path)
        shape = classify_package_shape(file_path)
        cv_data = {"pdp": pdp_data, "font": font_data, "shape": shape}
        
        extracted_fields_dict = extract_fields(file_path)
        
        # Rule Engine
        engine_result = rule_engine.validate(extracted_fields_dict, cv_data)
        
        # Update Scan
        new_scan.compliance_status = engine_result['compliance_status']
        new_scan.compliance_score = engine_result['compliance_score']
        new_scan.product_name = extracted_fields_dict.get('product_name')
        new_scan.status = "completed"
        
        # Save Fields
        for f in engine_result['field_results']:
            db.add(ExtractedField(
                scan_id=new_scan.id,
                field_name=f['field_name'],
                field_value=str(f['field_value']) if f['field_value'] else None,
                is_present=f['is_present'],
                rule_reference=f['rule_reference']
            ))
            
        # Save Violations
        for v in engine_result['violations']:
            db.add(Violation(
                scan_id=new_scan.id,
                rule_number=v['rule_number'],
                rule_description=v['rule_description'],
                severity=v['severity'],
                details=v['details'],
                suggestion=v['suggestion']
            ))
            
        await db.commit()
        
        # Reload full scan
        result = await db.execute(select(Scan).where(Scan.id == new_scan.id))
        scan_final = result.scalars().first()
        
        # get related data
        fields_res = await db.execute(select(ExtractedField).where(ExtractedField.scan_id == new_scan.id))
        violations_res = await db.execute(select(Violation).where(Violation.scan_id == new_scan.id))
        
        return {
            **scan_final.__dict__,
            "fields": [f.__dict__ for f in fields_res.scalars().all()],
            "violations": [v.__dict__ for v in violations_res.scalars().all()]
        }

    except Exception as e:
        new_scan.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}", response_model=ScanDetailResponse)
async def get_scan(scan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    fields_res = await db.execute(select(ExtractedField).where(ExtractedField.scan_id == scan_id))
    violations_res = await db.execute(select(Violation).where(Violation.scan_id == scan_id))
    
    return {
        **scan.__dict__,
        "fields": [f.__dict__ for f in fields_res.scalars().all()],
        "violations": [v.__dict__ for v in violations_res.scalars().all()]
    }

@router.get("/", response_model=ScanListResponse)
async def list_scans(skip: int = 0, limit: int = 10, status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Scan).order_by(Scan.created_at.desc())
    if status:
        query = query.where(Scan.compliance_status == status)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    scans = result.scalars().all()
    
    # Get total count (simplistic approach for now)
    all_res = await db.execute(select(Scan))
    total = len(all_res.scalars().all())
    
    return {"scans": [s.__dict__ for s in scans], "total": total}

@router.delete("/{scan_id}")
async def delete_scan(scan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    await db.delete(scan)
    await db.commit()
    return {"message": "Scan deleted"}
