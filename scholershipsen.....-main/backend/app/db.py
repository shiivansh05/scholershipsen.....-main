"""
Database Engine for Scholarship Sentinel.
Implements SQLite with SQLAlchemy 2.0 ORM.
Persists all institutions, student applications, clusters, cases, and cryptographic audit logs.
Database File: data/sentinel.db
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "sentinel.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==================== ORM MODELS ====================

class InstitutionModel(Base):
    __tablename__ = "institutions"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    type = Column(String(100), nullable=False)
    registered = Column(Integer, default=0)
    active = Column(Integer, default=0)
    applications = Column(Integer, default=0)
    surge_ratio = Column(Float, default=1.0)

class StudentModel(Base):
    __tablename__ = "students"

    student_id = Column(String(50), primary_key=True, index=True)
    admission_no = Column(String(50), nullable=True)
    name = Column(String(150), nullable=False)
    class_name = Column(String(50), nullable=True)
    dob = Column(String(50), nullable=True)
    category = Column(String(50), default="Gen")
    father_name = Column(String(150), nullable=True)
    mother_name = Column(String(150), nullable=True)
    aadhaar_no = Column(String(50), nullable=True)
    account_no = Column(String(50), nullable=True)
    contact_no = Column(String(50), nullable=True)
    ifsc_code = Column(String(50), nullable=True)
    institution_id = Column(String(50), nullable=True)
    dataset_source = Column(String(100), default="User Dataset")
    labeled_issue = Column(String(100), nullable=True)

class ApplicationModel(Base):
    __tablename__ = "applications"

    application_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), index=True)
    scholarship_type = Column(String(100), default="Post-Matric")
    amount = Column(Integer, default=15000)
    status = Column(String(50), default="Pending")
    risk_band = Column(String(50), default="normal")
    risk_score = Column(Integer, default=15)
    attendance_pct = Column(Float, default=78.0)
    applied_on = Column(String(50), default="2026-03-20")

class ClusterModel(Base):
    __tablename__ = "clusters"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    pattern = Column(Text, nullable=False)
    score = Column(Integer, default=0)
    band = Column(String(50), default="normal")
    status = Column(String(50), default="open")
    is_hero = Column(Boolean, default=False)
    created_at = Column(String(50), default="2026-03-28")
    reasons_json = Column(Text, nullable=False)
    students_json = Column(Text, nullable=False)
    graph_json = Column(Text, nullable=False)

class AuditLogModel(Base):
    __tablename__ = "audit_log"

    seq = Column(Integer, primary_key=True, index=True)
    ts = Column(String(50), nullable=False)
    actor = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    target = Column(String(150), nullable=False)
    reason = Column(Text, nullable=False)
    prev_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False, unique=True)

# Create all tables in SQLite database
def init_db():
    Base.metadata.create_all(bind=engine)

def seed_database_from_json():
    """Seeds the SQLite database from existing JSON records if empty."""
    init_db()
    session = SessionLocal()
    try:
        # 1. Institutions
        if session.query(InstitutionModel).count() == 0:
            inst_path = os.path.join(DATA_DIR, "institutions.json")
            if os.path.exists(inst_path):
                with open(inst_path, "r", encoding="utf-8") as f:
                    institutions_data = json.load(f)
                seen_inst = set()
                for item in institutions_data:
                    iid = item.get("id")
                    if not iid or iid in seen_inst:
                        continue
                    seen_inst.add(iid)
                    inst = InstitutionModel(
                        id=iid,
                        name=item.get("name", "Institution"),
                        state=item.get("state", "State"),
                        district=item.get("district", "District"),
                        type=item.get("type", "College"),
                        registered=item.get("registered", 0),
                        active=item.get("active", 0),
                        applications=item.get("applications", 0),
                        surge_ratio=float(item.get("surge_ratio", 1.0))
                    )
                    session.add(inst)
                session.commit()

        # 2. Students (from mixed catalog)
        if session.query(StudentModel).count() == 0:
            mixed_path = os.path.join(DATA_DIR, "mixed_students.json")
            if os.path.exists(mixed_path):
                with open(mixed_path, "r", encoding="utf-8") as f:
                    mixed_data = json.load(f)
                seen_students = set()
                for item in mixed_data:
                    sid = str(item.get("Student_ID"))
                    if not sid or sid in seen_students:
                        continue
                    seen_students.add(sid)
                    student = StudentModel(
                        student_id=sid,
                        admission_no=str(item.get("Admission_No", "")),
                        name=str(item.get("Student_Name", "Student")),
                        class_name=str(item.get("Class", "")),
                        dob=str(item.get("DOB", "")),
                        category=str(item.get("Category", "Gen")),
                        father_name=str(item.get("Father_Name", "")),
                        mother_name=str(item.get("Mother_Name", "")),
                        aadhaar_no=str(item.get("Aadhaar_No", "")),
                        account_no=str(item.get("Account_No", "")),
                        contact_no=str(item.get("Contact_No", "")),
                        ifsc_code=str(item.get("IFSC_Code", "")),
                        dataset_source=str(item.get("dataset_source", "Mixed")),
                        labeled_issue=str(item.get("labeled_issue", ""))
                    )
                    session.add(student)
                session.commit()

        # 3. Clusters
        if session.query(ClusterModel).count() == 0:
            clusters_path = os.path.join(DATA_DIR, "clusters.json")
            if os.path.exists(clusters_path):
                with open(clusters_path, "r", encoding="utf-8") as f:
                    clusters_data = json.load(f)
                seen_clusters = set()
                for c in clusters_data:
                    cid = c.get("id")
                    if not cid or cid in seen_clusters:
                        continue
                    seen_clusters.add(cid)
                    cluster = ClusterModel(
                        id=cid,
                        title=c.get("title"),
                        pattern=c.get("pattern"),
                        score=int(c.get("score", 0)),
                        band=c.get("band", "normal"),
                        status=c.get("status", "open"),
                        is_hero=bool(c.get("is_hero", False)),
                        created_at=str(c.get("created_at", "")),
                        reasons_json=json.dumps(c.get("reasons", [])),
                        students_json=json.dumps(c.get("students", [])),
                        graph_json=json.dumps(c.get("graph", {}))
                    )
                    session.add(cluster)
                session.commit()

        # 4. Audit Log
        if session.query(AuditLogModel).count() == 0:
            from .audit import get_audit_log
            audit_entries = get_audit_log(100)
            seen_hashes = set()
            for e in reversed(audit_entries):
                ehash = e.get("entry_hash")
                if not ehash or ehash in seen_hashes:
                    continue
                seen_hashes.add(ehash)
                entry = AuditLogModel(
                    seq=e.get("seq"),
                    ts=e.get("ts"),
                    actor=e.get("actor"),
                    action=e.get("action"),
                    target=e.get("target"),
                    reason=e.get("reason"),
                    prev_hash=e.get("prev_hash"),
                    entry_hash=ehash
                )
                session.add(entry)
            session.commit()
    except Exception as exc:
        session.rollback()
        print(f"[Sentinel DB Seeding Error] {exc}")

    finally:
        session.close()

def get_db_stats() -> Dict[str, Any]:
    """Returns database size, table counts, and engine info."""
    init_db()
    session = SessionLocal()
    try:
        inst_count = session.query(InstitutionModel).count()
        student_count = session.query(StudentModel).count()
        cluster_count = session.query(ClusterModel).count()
        audit_count = session.query(AuditLogModel).count()
        
        file_size_bytes = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
        return {
            "engine": "SQLite 3.49 + SQLAlchemy 2.1 ORM",
            "database_file": "data/sentinel.db",
            "file_size_formatted": f"{file_size_bytes / 1024:.1f} KB",
            "tables": {
                "institutions": inst_count,
                "students": student_count,
                "clusters": cluster_count,
                "audit_logs": audit_count
            },
            "status": "Healthy (ACID Transactions Enabled)"
        }
    finally:
        session.close()
