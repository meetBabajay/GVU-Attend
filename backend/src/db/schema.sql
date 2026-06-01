-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for department name lookup
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- 2. USERS (Credentials and core roles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('lecturer', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for login lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. STUDENTS (Extended profile for students)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matric_number VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    level INT NOT NULL CHECK (level IN (100, 200, 300, 400, 500)),
    school_email VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for quick lookup by matric number, department, level
CREATE INDEX IF NOT EXISTS idx_students_matric ON students(matric_number);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);

-- 4. COURSES (Created by lecturers)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_title VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    level INT NOT NULL CHECK (level IN (100, 200, 300, 400, 500)),
    lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for course lookup by lecturer and department
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- 5. COURSE_REGISTRATIONS (Official enrolment records)
CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

-- Indexes for quick registration checks
CREATE INDEX IF NOT EXISTS idx_registrations_student ON course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_course ON course_registrations(course_id);

-- 6. CLASS_SESSIONS (Lecturer scheduled lectures/sessions)
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_name VARCHAR(150) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_location VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    allowed_radius_meters INT NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    qr_secret_salt VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for checking session status
CREATE INDEX IF NOT EXISTS idx_sessions_course ON class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON class_sessions(is_active);

-- 7. ATTENDANCE (Final verified attendance entries)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_fingerprint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- IPv4 or IPv6 compatibility
    distance_meters DECIMAL(6, 2) NOT NULL,
    verified_gps BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_attendance_session_student UNIQUE (class_session_id, student_id)
);

-- Indexes for queries (reports per course session/student)
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(class_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
-- Compound index to detect multiple submissions from the same device under a session
CREATE INDEX IF NOT EXISTS idx_attendance_device_session ON attendance(class_session_id, device_fingerprint);

-- 8. ATTENDANCE_LOGS (Audit logging for successful/failed attempts)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    matric_number VARCHAR(30) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    failure_reason VARCHAR(255) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for auditing and fraud investigation
CREATE INDEX IF NOT EXISTS idx_logs_session ON attendance_logs(class_session_id);
CREATE INDEX IF NOT EXISTS idx_logs_matric ON attendance_logs(matric_number);
CREATE INDEX IF NOT EXISTS idx_logs_fingerprint ON attendance_logs(device_fingerprint);

-- 9. ATTENDANCE_REPORTS (Cache/metadata for exported report sheets)
CREATE TABLE IF NOT EXISTS attendance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    report_name VARCHAR(150) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255) NOT NULL, -- Location on cloud storage / server storage
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('excel', 'pdf'))
);

CREATE INDEX IF NOT EXISTS idx_reports_course ON attendance_reports(course_id);
