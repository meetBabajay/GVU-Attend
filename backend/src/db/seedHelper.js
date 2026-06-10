const {
  sequelize,
  User,
  Student,
  Department,
  Course,
  CourseRegistration,
  ClassSession,
  Room,
  Attendance,
  AttendanceLog
} = require('../models');

const seedDatabase = async () => {
  try {
    // Check if departments exist; if so, database is already seeded — skip
    const deptCount = await Department.count();
    if (deptCount > 0) {
      console.log('Database already has data. Skipping seeder...');
      return;
    }

    console.log('Seeding mock data for testing...');

    // 3. Create Departments
    const depts = await Department.bulkCreate([
      { id: 'd1111111-1111-1111-1111-111111111111', name: 'Computer Science', faculty: 'Science and Computing' },
      { id: 'd2222222-2222-2222-2222-222222222222', name: 'Software Engineering', faculty: 'Science and Computing' },
      { id: 'd3333333-3333-3333-3333-333333333333', name: 'Information Technology', faculty: 'Science and Computing' },
      { id: 'd4444444-4444-4444-4444-444444444444', name: 'Accounting', faculty: 'Management Sciences' }
    ]);

    // Seed Rooms
    const rooms = await Room.bulkCreate([
      { name: 'Computer Lab', latitude: 6.428062, longitude: 3.421943 },
      { name: 'Lecture Room 1', latitude: 6.429000, longitude: 3.422500 },
      { name: 'Lecture Room 2', latitude: 6.427000, longitude: 3.421000 }
    ]);

    // 4. Create Users (passwords will be hashed automatically by User model hooks)
    const users = await User.bulkCreate([
      { id: 'l1111111-1111-1111-1111-111111111111', email: 'lecturer@computing.edu.ng', passwordHash: 'password123', role: 'lecturer', isApproved: true, fullName: 'Dr. Smith' },
      { id: 'l2222222-2222-2222-2222-222222222222', email: 'lecturer2@accounting.edu.ng', passwordHash: 'password123', role: 'lecturer', isApproved: true, fullName: 'Prof. Miller' },
      { id: 's1111111-1111-1111-1111-111111111111', email: 'cs_student1@computing.edu.ng', passwordHash: 'password123', role: 'student', isApproved: true },
      { id: 's2222222-2222-2222-2222-222222222222', email: 'se_student2@computing.edu.ng', passwordHash: 'password123', role: 'student', isApproved: true },
      { id: 's3333333-3333-3333-3333-333333333333', email: 'it_student3@computing.edu.ng', passwordHash: 'password123', role: 'student', isApproved: true },
      { id: 's4444444-4444-4444-4444-444444444444', email: 'acct_student4@management.edu.ng', passwordHash: 'password123', role: 'student', isApproved: true },
      { id: 'a1111111-1111-1111-1111-111111111111', email: 'admin@computing.edu.ng', passwordHash: 'admin123', role: 'admin', isApproved: true, fullName: 'Portal Administrator' }
    ], { individualHooks: true }); // Enable hooks to hash passwords

    // 5. Create Students
    const students = await Student.bulkCreate([
      { id: 'st111111-1111-1111-1111-111111111111', userId: 's1111111-1111-1111-1111-111111111111', matricNumber: 'CSC/19/1001', fullName: 'Alice Johnson', departmentId: depts[0].id, level: 300, schoolEmail: 'cs_student1@computing.edu.ng' },
      { id: 'st222222-2222-2222-2222-222222222222', userId: 's2222222-2222-2222-2222-222222222222', matricNumber: 'SEN/19/2002', fullName: 'Bob Smith', departmentId: depts[1].id, level: 300, schoolEmail: 'se_student2@computing.edu.ng' },
      { id: 'st333333-3333-3333-3333-333333333333', userId: 's3333333-3333-3333-3333-333333333333', matricNumber: 'IFT/19/3003', fullName: 'Charlie Brown', departmentId: depts[2].id, level: 300, schoolEmail: 'it_student3@computing.edu.ng' },
      { id: 'st444444-4444-4444-4444-444444444444', userId: 's4444444-4444-4444-4444-444444444444', matricNumber: 'ACC/19/4004', fullName: 'David Miller', departmentId: depts[3].id, level: 300, schoolEmail: 'acct_student4@management.edu.ng' }
    ]);

    // 6. Create Courses
    const courses = await Course.bulkCreate([
      { id: 'c1111111-1111-1111-1111-111111111111', courseCode: 'CSC301', courseTitle: 'Systems Programming', departmentId: depts[0].id, level: 300, lecturerId: 'l1111111-1111-1111-1111-111111111111' },
      { id: 'c2222222-2222-2222-2222-222222222222', courseCode: 'SEN302', courseTitle: 'Software Architecture', departmentId: depts[1].id, level: 300, lecturerId: 'l1111111-1111-1111-1111-111111111111' },
      { id: 'c3333333-3333-3333-3333-333333333333', courseCode: 'ACC301', courseTitle: 'Corporate Accounting', departmentId: depts[3].id, level: 300, lecturerId: 'l2222222-2222-2222-2222-222222222222' }
    ]);

    // 7. Enroll Students (Course Registrations)
    await CourseRegistration.bulkCreate([
      // CSC301 Enrollments (Alice, Bob, Charlie allowed)
      { studentId: students[0].id, courseId: courses[0].id },
      { studentId: students[1].id, courseId: courses[0].id },
      { studentId: students[2].id, courseId: courses[0].id },
      // SEN302 Enrollments
      { studentId: students[0].id, courseId: courses[1].id },
      { studentId: students[1].id, courseId: courses[1].id },
      // ACC301 Enrollments
      { studentId: students[3].id, courseId: courses[2].id }
    ]);

    // 8. Create Class Sessions for CSC301 (Coordinates: Computing lab center: 6.428062, 3.421943)
    const sessions = await ClassSession.bulkCreate([
      { id: 'cs111111-1111-1111-1111-111111111111', courseId: courses[0].id, sessionName: 'Introduction & Setup', date: '2026-05-15', startTime: '09:00:00', endTime: '11:00:00', roomLocation: 'Computer Lab', roomId: rooms[0].id, latitude: 6.42806200, longitude: 3.42194300, allowedRadiusMeters: 500, isActive: false },
      { id: 'cs222222-2222-2222-2222-222222222222', courseId: courses[0].id, sessionName: 'Processes & Threads', date: '2026-05-22', startTime: '09:00:00', endTime: '11:00:00', roomLocation: 'Computer Lab', roomId: rooms[0].id, latitude: 6.42806200, longitude: 3.42194300, allowedRadiusMeters: 500, isActive: false },
      { id: 'cs333333-3333-3333-3333-333333333333', courseId: courses[0].id, sessionName: 'Memory Management', date: '2026-05-29', startTime: '09:00:00', endTime: '11:00:00', roomLocation: 'Computer Lab', roomId: rooms[0].id, latitude: 6.42806200, longitude: 3.42194300, allowedRadiusMeters: 500, isActive: false },
      { id: 'cs444444-4444-4444-4444-444444444444', courseId: courses[0].id, sessionName: 'File Systems (Active)', date: new Date().toISOString().split('T')[0], startTime: '09:00:00', endTime: '11:00:00', roomLocation: 'Computer Lab', roomId: rooms[0].id, latitude: 6.42806200, longitude: 3.42194300, allowedRadiusMeters: 500, isActive: true, qrSecretSalt: 'today_secret_salt_string' }
    ]);

    // 9. Create past attendance records
    await Attendance.bulkCreate([
      // Alice: Present for all 3 past lectures (100% attendance rate)
      { classSessionId: sessions[0].id, studentId: students[0].id, status: 'present', signedAt: new Date('2026-05-15T09:05:00Z'), deviceFingerprint: 'fingerprint_alice_pc', ipAddress: '192.168.1.5', distanceMeters: 4.50, verifiedGps: true },
      { classSessionId: sessions[1].id, studentId: students[0].id, status: 'present', signedAt: new Date('2026-05-22T09:02:00Z'), deviceFingerprint: 'fingerprint_alice_pc', ipAddress: '192.168.1.5', distanceMeters: 12.20, verifiedGps: true },
      { classSessionId: sessions[2].id, studentId: students[0].id, status: 'present', signedAt: new Date('2026-05-29T09:10:00Z'), deviceFingerprint: 'fingerprint_alice_pc', ipAddress: '192.168.1.5', distanceMeters: 2.10, verifiedGps: true },

      // Bob: Present for 2 out of 3 lectures (66.6% attendance rate - Risk threshold)
      { classSessionId: sessions[0].id, studentId: students[1].id, status: 'present', signedAt: new Date('2026-05-15T09:15:00Z'), deviceFingerprint: 'fingerprint_bob_phone', ipAddress: '192.168.1.12', distanceMeters: 32.10, verifiedGps: true },
      { classSessionId: sessions[1].id, studentId: students[1].id, status: 'absent', signedAt: new Date('2026-05-22T11:00:00Z'), deviceFingerprint: 'none', ipAddress: '127.0.0.1', distanceMeters: 0.00, verifiedGps: false },
      { classSessionId: sessions[2].id, studentId: students[1].id, status: 'present', signedAt: new Date('2026-05-29T09:04:00Z'), deviceFingerprint: 'fingerprint_bob_phone', ipAddress: '192.168.1.12', distanceMeters: 8.40, verifiedGps: true },

      // Charlie: Present for 1 out of 3 lectures (33.3% attendance rate - Warning threshold)
      { classSessionId: sessions[0].id, studentId: students[2].id, status: 'absent', signedAt: new Date('2026-05-15T11:00:00Z'), deviceFingerprint: 'none', ipAddress: '127.0.0.1', distanceMeters: 0.00, verifiedGps: false },
      { classSessionId: sessions[1].id, studentId: students[2].id, status: 'absent', signedAt: new Date('2026-05-22T11:00:00Z'), deviceFingerprint: 'none', ipAddress: '127.0.0.1', distanceMeters: 0.00, verifiedGps: false },
      { classSessionId: sessions[2].id, studentId: students[2].id, status: 'present', signedAt: new Date('2026-05-29T09:20:00Z'), deviceFingerprint: 'fingerprint_charlie_tab', ipAddress: '192.168.1.15', distanceMeters: 18.90, verifiedGps: true }
    ]);

    // 10. Log some fraud/audit attempts
    await AttendanceLog.bulkCreate([
      { classSessionId: sessions[3].id, matricNumber: 'ACC/19/4004', ipAddress: '192.168.1.50', deviceFingerprint: 'fingerprint_acct_stud', status: 'failed', failureReason: 'Student belongs to non-computing department: Accounting', latitude: 6.42806200, longitude: 3.42194300 },
      { classSessionId: sessions[3].id, matricNumber: 'SEN/19/2002', ipAddress: '192.168.1.12', deviceFingerprint: 'fingerprint_bob_phone', status: 'failed', failureReason: 'GPS validation failed: Student is 1,200 meters away', latitude: 6.43806200, longitude: 3.43194300 },
      { classSessionId: sessions[3].id, matricNumber: 'CSC/19/1001', ipAddress: '192.168.1.5', deviceFingerprint: 'fingerprint_alice_pc', status: 'failed', failureReason: 'Expired QR token submitted', latitude: 6.42806200, longitude: 3.42194300 }
    ]);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = { seedDatabase };
