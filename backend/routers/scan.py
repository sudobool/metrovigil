import logging
import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.database import get_db, Scan, ExtractedField, Violation
from ..models.schemas import ScanDetailResponse, ScanListResponse, UserResponse
from ..services.ocr_service import extract_fields
from ..services.cv_service import detect_pdp_area, estimate_font_height, classify_package_shape
from ..services.rule_engine import LMPCRuleEngine
from ..config import UPLOAD_DIR, ALLOWED_UPLOAD_EXTENSIONS, ALLOWED_UPLOAD_CONTENT_TYPES, MAX_UPLOAD_SIZE_BYTES
from .auth import get_current_user

logger = logging.getLogger("metrovigil.scan")

router = APIRouter()
rule_engine = LMPCRuleEngine()

MAX_LIST_LIMIT = 100


def _safe_upload_path(original_filename: str) -> tuple[str, str]:
    """Build a collision-proof, traversal-proof path to save an upload to.

    Returns (stored_filename, full_path). The original filename is never
    used to build the on-disk path — only its extension is kept — so a
    filename like "../../etc/passwd.png" can't escape UPLOAD_DIR and two
    uploads with the same name can't overwrite each other.
    """
    ext = os.path.splitext(original_filename or "")[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext or 'unknown'}'. Allowed: "
            f"{', '.join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}.",
        )
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    return stored_filename, os.path.join(UPLOAD_DIR, stored_filename)


@router.post("/upload", response_model=ScanDetailResponse)
async def upload_scan(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{file.content_type}'. Please upload a PNG, JPEG, or WEBP image.",
        )

    stored_filename, file_path = _safe_upload_path(file.filename or "")

    # Enforce a max upload size while streaming to disk instead of loading
    # the whole file into memory first.
    size = 0
    async with aiofiles.open(file_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_SIZE_BYTES:
                await out_file.close()
                os.remove(file_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
                )
            await out_file.write(chunk)

    if size == 0:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Create scan record. original_filename is kept purely for display —
    # it's never used to build a filesystem path.
    new_scan = Scan(
        filename=stored_filename,
        original_filename=(file.filename or stored_filename)[:255],
        status="processing",
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

        extracted_fields_dict, extraction_source, extraction_message = extract_fields(
            file_path, original_filename=file.filename or ""
        )

        new_scan.extraction_source = extraction_source
        new_scan.extraction_message = extraction_message

        if extraction_source == "failed":
            # Be upfront that nothing could be read, rather than running
            # the rule engine on an empty field set and reporting every
            # single mandatory declaration as "missing".
            new_scan.status = "failed"
            await db.commit()
            result = await db.execute(select(Scan).where(Scan.id == new_scan.id))
            scan_final = result.scalars().first()
            return {
                **scan_final.__dict__,
                "fields": [],
                "violations": [],
            }

        # Rule Engine
        engine_result = rule_engine.validate(extracted_fields_dict, cv_data)

        # Update Scan
        new_scan.compliance_status = engine_result["compliance_status"]
        new_scan.compliance_score = engine_result["compliance_score"]
        new_scan.product_name = extracted_fields_dict.get("product_name")
        new_scan.status = "completed"

        # Save Fields
        for f in engine_result["field_results"]:
            db.add(ExtractedField(
                scan_id=new_scan.id,
                field_name=f["field_name"],
                field_value=str(f["field_value"]) if f["field_value"] else None,
                is_present=f["is_present"],
                rule_reference=f["rule_reference"],
            ))

        # Save Violations
        for v in engine_result["violations"]:
            db.add(Violation(
                scan_id=new_scan.id,
                rule_number=v["rule_number"],
                rule_description=v["rule_description"],
                severity=v["severity"],
                details=v["details"],
                suggestion=v["suggestion"],
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
            "violations": [v.__dict__ for v in violations_res.scalars().all()],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Scan processing failed for scan_id=%s", new_scan.id)
        new_scan.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail="Scan processing failed. Please try again.") from e


@router.get("/{scan_id}", response_model=ScanDetailResponse)
async def get_scan(
    scan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    fields_res = await db.execute(select(ExtractedField).where(ExtractedField.scan_id == scan_id))
    violations_res = await db.execute(select(Violation).where(Violation.scan_id == scan_id))

    return {
        **scan.__dict__,
        "fields": [f.__dict__ for f in fields_res.scalars().all()],
        "violations": [v.__dict__ for v in violations_res.scalars().all()],
    }


@router.get("/", response_model=ScanListResponse)
async def list_scans(
    skip: int = 0,
    limit: int = Query(default=10, le=MAX_LIST_LIMIT, ge=1),
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    query = select(Scan).order_by(Scan.created_at.desc())
    count_query = select(func.count()).select_from(Scan)
    if status:
        query = query.where(Scan.compliance_status == status)
        count_query = count_query.where(Scan.compliance_status == status)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    scans = result.scalars().all()

    total = (await db.execute(count_query)).scalar_one()

    return {"scans": [s.__dict__ for s in scans], "total": total}


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Remove the underlying image file too, otherwise deleted scans leak
    # files in UPLOAD_DIR indefinitely.
    file_path = os.path.join(UPLOAD_DIR, scan.filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        logger.warning("Could not remove upload file for scan_id=%s", scan_id)

    await db.delete(scan)
    await db.commit()
    return {"message": "Scan deleted"}
