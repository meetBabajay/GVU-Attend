/* PostgreSQL migration script for attendance-management-system */

-- Users (lecturers, students, admins)
CREATE TABLE "Users" (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(255)
);

-- Departments
CREATE TABLE "Departments" (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL
);

-- Students (profile linked to Users)
CREATE TABLE "Students" (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    matric_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    department_id UUID REFERENCES "Departments"(id) ON DELETE RESTRICT,
    level INTEGER,
    school_email VARCHAR(255)
);

-- Courses
CREATE TABLE "Courses" (
    id UUID PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_title VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES "Departments"(id) ON DELETE RESTRICT,
    level INTEGER,
    lecturer_id UUID REFERENCES "Users"(id) ON DELETE RESTRICT
);

-- CourseRegistrations (junction table)
CREATE TABLE "CourseRegistrations" (
    student_id UUID REFERENCES "Students"(id) ON DELETE CASCADE,
    course_id UUID REFERENCES "Courses"(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, course_id)
);

-- Rooms
CREATE TABLE "Rooms" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- ClassSessions
CREATE TABLE "ClassSessions" (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES "Courses"(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    date DATE,
    start_time TIME,
    end_time TIME,
    room_location VARCHAR(255),
    room_id UUID REFERENCES "Rooms"(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    allowed_radius_meters INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    qr_secret_salt VARCHAR(255)
);

-- Attendance
CREATE TABLE "Attendance" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_session_id UUID REFERENCES "ClassSessions"(id) ON DELETE CASCADE,
    student_id UUID REFERENCES "Students"(id) ON DELETE CASCADE,
    status VARCHAR(20),
    signed_at TIMESTAMP,
    device_fingerprint VARCHAR(255),
    ip_address VARCHAR(45),
    distance_meters DOUBLE PRECISION,
    verified_gps BOOLEAN
);

-- AttendanceLogs (audit/fraud attempts)
CREATE TABLE "AttendanceLogs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_session_id UUID REFERENCES "ClassSessions"(id) ON DELETE CASCADE,
    matric_number VARCHAR(50),
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    status VARCHAR(20),
    failure_reason TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- AttendanceReports
CREATE TABLE "AttendanceReports" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES "Courses"(id) ON DELETE CASCADE,
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT now()
);

-- Scores (if used)
CREATE TABLE "Scores" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES "Students"(id) ON DELETE CASCADE,
    course_id UUID REFERENCES "Courses"(id) ON DELETE CASCADE,
    score NUMERIC(5,2)
);

-- Add any indexes you need
CREATE INDEX idx_attendance_student ON "Attendance" (student_id);
CREATE INDEX idx_attendance_session ON "Attendance" (class_session_id);
