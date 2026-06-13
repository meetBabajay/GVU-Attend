-- 1. DEPARTMENTS
INSERT INTO departments (id, name, faculty) VALUES
('d1111111-1111-1111-1111-111111111111', 'Computer Science', 'Science and Computing'),
('d2222222-2222-2222-2222-222222222222', 'Mass Comm', 'Social Sciences'),
('d3333333-3333-3333-3333-333333333333', 'Economics', 'Social Sciences'),
('d4444444-4444-4444-4444-444444444444', 'Accounting', 'Management Sciences')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty;

-- 2. USERS (Passwords hashed using bcrypt for "password123")
-- Hash for "password123": $2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S
INSERT INTO users (id, email, password_hash, role) VALUES
-- Lecturers
('l1111111-1111-1111-1111-111111111111', 'lecturer@computing.edu.ng', '$2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S', 'lecturer'),
('l2222222-2222-2222-2222-222222222222', 'lecturer2@accounting.edu.ng', '$2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S', 'lecturer'),
-- Students (Computing)
('s1111111-1111-1111-1111-111111111111', 'cs_student1@computing.edu.ng', '$2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S', 'student'),
('s2222222-2222-2222-2222-222222222222', 'se_student2@computing.edu.ng', '$2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S', 'student'),
('s3333333-3333-3333-3333-333333333333', 'it_student3@computing.edu.ng', '$2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S', 'student'),
-- Student (Accounting - restricted)
('s4444444-4444-4444-4444-444444444444', 'acct_student4@management.edu.ng', '$2b$10$eE0U4yF5/O.gKk2D6B0DDeaQyJbY2VpeJ3oP2XwW09aR9eB/O2.7S', 'student')
ON CONFLICT (email) DO NOTHING;

-- 3. STUDENTS profiles
INSERT INTO students (id, user_id, matric_number, full_name, department_id, level, school_email) VALUES
('st111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'CSC/19/1001', 'Alice Johnson', 'd1111111-1111-1111-1111-111111111111', 300, 'cs_student1@computing.edu.ng'),
('st222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222222', 'SEN/19/2002', 'Bob Smith', 'd2222222-2222-2222-2222-222222222222', 300, 'se_student2@computing.edu.ng'),
('st333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333', 'IFT/19/3003', 'Charlie Brown', 'd3333333-3333-3333-3333-333333333333', 300, 'it_student3@computing.edu.ng'),
('st444444-4444-4444-4444-444444444444', 's4444444-4444-4444-4444-444444444444', 'ACC/19/4004', 'David Miller', 'd4444444-4444-4444-4444-444444444444', 300, 'acct_student4@management.edu.ng')
ON CONFLICT (matric_number) DO NOTHING;

-- 4. COURSES
INSERT INTO courses (id, course_code, course_title, department_id, level, lecturer_id) VALUES
('c1111111-1111-1111-1111-111111111111', 'CSC301', 'Systems Programming', 'd1111111-1111-1111-1111-111111111111', 300, 'l1111111-1111-1111-1111-111111111111'),
('c2222222-2222-2222-2222-222222222222', 'SEN302', 'Software Architecture', 'd2222222-2222-2222-2222-222222222222', 300, 'l1111111-1111-1111-1111-111111111111'),
('c3333333-3333-3333-3333-333333333333', 'ACC301', 'Corporate Accounting', 'd4444444-4444-4444-4444-444444444444', 300, 'l2222222-2222-2222-2222-222222222222')
ON CONFLICT (course_code) DO NOTHING;

-- 5. COURSE REGISTRATIONS (Only authorized student types can enroll)
INSERT INTO course_registrations (student_id, course_id) VALUES
-- CSC301 registrations (CS, SE, IT students allowed)
('st111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111'),
('st222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111'),
('st333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111'),
-- SEN302 registrations
('st111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222'),
('st222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222'),
-- ACC301 registrations
('st444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333')
ON CONFLICT ON CONSTRAINT uq_student_course DO NOTHING;

-- 6. CLASS SESSIONS
-- Create lecture sessions for CSC301 (latitude and longitude set to Computing Lab: 6.42806, 3.42194)
INSERT INTO class_sessions (id, course_id, session_name, date, start_time, end_time, room_location, latitude, longitude, allowed_radius_meters, is_active) VALUES
('cs111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Introduction & Setup', '2026-05-15', '09:00:00', '11:00:00', 'Computing Lab 1', 6.42806200, 3.42194300, 50, false),
('cs222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Processes & Threads', '2026-05-22', '09:00:00', '11:00:00', 'Computing Lab 1', 6.42806200, 3.42194300, 50, false),
('cs333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Memory Management', '2026-05-29', '09:00:00', '11:00:00', 'Computing Lab 1', 6.42806200, 3.42194300, 50, false),
-- Active class session for today
('cs444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'File Systems (Active)', CURRENT_DATE, '09:00:00', '11:00:00', 'Computing Lab 1', 6.42806200, 3.42194300, 50, true)
ON CONFLICT (id) DO NOTHING;

-- 7. ATTENDANCE records for past lectures (shows varying attendance percentages to test thresholds)
INSERT INTO attendance (class_session_id, student_id, status, signed_at, device_fingerprint, ip_address, distance_meters, verified_gps) VALUES
-- Alice Johnson (3/3 attended = 100%)
('cs111111-1111-1111-1111-111111111111', 'st111111-1111-1111-1111-111111111111', 'present', '2026-05-15 09:05:00+01', 'fingerprint_alice_pc', '192.168.1.5', 4.50, true),
('cs222222-2222-2222-2222-222222222222', 'st111111-1111-1111-1111-111111111111', 'present', '2026-05-22 09:02:00+01', 'fingerprint_alice_pc', '192.168.1.5', 12.20, true),
('cs333333-3333-3333-3333-333333333333', 'st111111-1111-1111-1111-111111111111', 'present', '2026-05-29 09:10:00+01', 'fingerprint_alice_pc', '192.168.1.5', 2.10, true),

-- Bob Smith (2/3 attended = 66% -> Below 75% threshold)
('cs111111-1111-1111-1111-111111111111', 'st222222-2222-2222-2222-222222222222', 'present', '2026-05-15 09:15:00+01', 'fingerprint_bob_phone', '192.168.1.12', 32.10, true),
('cs222222-2222-2222-2222-222222222222', 'st222222-2222-2222-2222-222222222222', 'absent', '2026-05-22 11:00:00+01', 'none', '127.0.0.1', 0.00, false),
('cs333333-3333-3333-3333-333333333333', 'st222222-2222-2222-2222-222222222222', 'present', '2026-05-29 09:04:00+01', 'fingerprint_bob_phone', '192.168.1.12', 8.40, true),

-- Charlie Brown (1/3 attended = 33% -> Below 60% threshold)
('cs111111-1111-1111-1111-111111111111', 'st333333-3333-3333-3333-333333333333', 'absent', '2026-05-15 11:00:00+01', 'none', '127.0.0.1', 0.00, false),
('cs222222-2222-2222-2222-222222222222', 'st333333-3333-3333-3333-333333333333', 'absent', '2026-05-22 11:00:00+01', 'none', '127.0.0.1', 0.00, false),
('cs333333-3333-3333-3333-333333333333', 'st333333-3333-3333-3333-333333333333', 'present', '2026-05-29 09:20:00+01', 'fingerprint_charlie_tab', '192.168.1.15', 18.90, true)
ON CONFLICT ON CONSTRAINT uq_attendance_session_student DO NOTHING;

-- 8. MOCK LOGS (Logs of failed sign attempts for anti-fraud auditing)
INSERT INTO attendance_logs (class_session_id, matric_number, ip_address, device_fingerprint, status, failure_reason, latitude, longitude) VALUES
-- Attempt by unregistered student
('cs444444-4444-4444-4444-444444444444', 'ACC/19/4004', '192.168.1.50', 'fingerprint_accounting_stud', 'failed', 'Student is not registered for this course', 6.42806200, 3.42194300),
-- Attempt from too far away
('cs444444-4444-4444-4444-444444444444', 'SEN/19/2002', '192.168.1.12', 'fingerprint_bob_phone', 'failed', 'GPS validation failed: student is 1,200 meters away', 6.43806200, 3.43194300),
-- Attempt with invalid/expired QR token
('cs444444-4444-4444-4444-444444444444', 'CSC/19/1001', '192.168.1.5', 'fingerprint_alice_pc', 'failed', 'QR code signature has expired', 6.42806200, 3.42194300);
