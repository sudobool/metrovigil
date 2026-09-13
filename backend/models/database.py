import datetime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, text
from ..config import DATABASE_URL


Base = declarative_base()

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    original_filename = Column(String)
    status = Column(String)  # pending, processing, completed, failed
    compliance_status = Column(String, nullable=True)  # compliant, non_compliant, partial
    compliance_score = Column(Float, nullable=True)
    product_name = Column(String, nullable=True)
    # Where the extracted field data came from: "gemini", "tesseract",
    # "demo_fallback" (offline sample data for the bundled sample labels),
    # or "failed" (no fields could be extracted at all).
    extraction_source = Column(String, nullable=True)
    extraction_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    fields = relationship("ExtractedField", back_populates="scan", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="scan", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    field_name = Column(String)
    field_value = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    is_present = Column(Boolean, default=False)
    rule_reference = Column(String, nullable=True)

    scan = relationship("Scan", back_populates="fields")

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    rule_number = Column(String)
    rule_description = Column(String)
    severity = Column(String)  # critical, major, minor
    details = Column(String)
    suggestion = Column(String)

    scan = relationship("Scan", back_populates="violations")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight auto-migration for existing SQLite DBs created before
        # extraction_source/extraction_message existed on the scans table.
        if engine.url.get_backend_name().startswith("sqlite"):
            result = await conn.execute(text("PRAGMA table_info(scans)"))
            existing_cols = {row[1] for row in result.fetchall()}
            if "extraction_source" not in existing_cols:
                await conn.execute(text("ALTER TABLE scans ADD COLUMN extraction_source VARCHAR"))
            if "extraction_message" not in existing_cols:
                await conn.execute(text("ALTER TABLE scans ADD COLUMN extraction_message VARCHAR"))

async def get_db():
    async with SessionLocal() as session:
        yield session
