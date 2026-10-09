-- Scholarship Sentinel Database Schema & Seed
CREATE TABLE institutions (
    institution_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    type VARCHAR(100),
    registered_students INT,
    active_students INT
);

CREATE TABLE students (
    student_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255),
    name_normalized VARCHAR(255),
    institution_id VARCHAR(32) REFERENCES institutions(institution_id),
    course VARCHAR(100),
    year VARCHAR(50),
    dob DATE,
    guardian_id VARCHAR(32),
    address_id VARCHAR(32)
);

CREATE TABLE applications (
    application_id VARCHAR(32) PRIMARY KEY,
    student_id VARCHAR(32) REFERENCES students(student_id),
    scholarship_type VARCHAR(100),
    amount NUMERIC,
    status VARCHAR(50),
    applied_on DATE,
    bank_id VARCHAR(32),
    mobile_id VARCHAR(32)
);

CREATE TABLE attendance (
    student_id VARCHAR(32) PRIMARY KEY,
    total_classes INT,
    present_days INT,
    attendance_pct NUMERIC
);

CREATE TABLE documents (
    document_id VARCHAR(32) PRIMARY KEY,
    student_id VARCHAR(32) REFERENCES students(student_id),
    doc_type VARCHAR(100),
    template_hash VARCHAR(100),
    issued_by VARCHAR(255),
    issued_on DATE
);

-- Copy commands for loading
\copy institutions FROM 'institutions.csv' WITH (FORMAT csv, HEADER true);
\copy students FROM 'students.csv' WITH (FORMAT csv, HEADER true);
\copy applications FROM 'applications.csv' WITH (FORMAT csv, HEADER true);
\copy attendance FROM 'attendance.csv' WITH (FORMAT csv, HEADER true);
\copy documents FROM 'documents.csv' WITH (FORMAT csv, HEADER true);
