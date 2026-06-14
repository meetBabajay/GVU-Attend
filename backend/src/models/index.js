const sequelize = require('../config/db');
const User = require('./User');
const Student = require('./Student');
const Department = require('./Department');
const Course = require('./Course');
const CourseRegistration = require('./CourseRegistration');
const ClassSession = require('./ClassSession');
const Attendance = require('./Attendance');
const Room = require('./Room');
const AttendanceLog = require('./AttendanceLog');
const AttendanceReport = require('./AttendanceReport');
const Score = require('./Score');
const TestScore = require('./TestScore');

// 1. User <-> Student (One-to-One Profile relation)
User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 2. Department <-> Student (One-to-Many)
Department.hasMany(Student, { foreignKey: 'department_id', as: 'students', onDelete: 'RESTRICT' });
Student.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// 3. Department <-> Course (One-to-Many)
Department.hasMany(Course, { foreignKey: 'department_id', as: 'courses', onDelete: 'RESTRICT' });
Course.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// 4. User (Lecturer) <-> Course (One-to-Many)
User.hasMany(Course, { foreignKey: 'lecturer_id', as: 'taughtCourses', onDelete: 'RESTRICT' });
Course.belongsTo(User, { foreignKey: 'lecturer_id', as: 'lecturer' });

// 5. Course <-> Student Many-to-Many (via CourseRegistration)
Student.belongsToMany(Course, { through: CourseRegistration, foreignKey: 'student_id', onDelete: 'CASCADE' });
Course.belongsToMany(Student, { through: CourseRegistration, foreignKey: 'course_id', onDelete: 'CASCADE' });

// Registrations explicit links for queries
Student.hasMany(CourseRegistration, { foreignKey: 'student_id', as: 'registrations', onDelete: 'CASCADE' });
CourseRegistration.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Course.hasMany(CourseRegistration, { foreignKey: 'course_id', as: 'registrations', onDelete: 'CASCADE' });
CourseRegistration.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// 6. Course <-> ClassSession (One-to-Many)
Course.hasMany(ClassSession, { foreignKey: 'course_id', as: 'sessions', onDelete: 'CASCADE' });
ClassSession.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// 7. ClassSession <-> Attendance (One-to-Many)
ClassSession.hasMany(Attendance, { foreignKey: 'class_session_id', as: 'attendances', onDelete: 'CASCADE' });
Attendance.belongsTo(ClassSession, { foreignKey: 'class_session_id', as: 'session' });

// 8. Student <-> Attendance (One-to-Many)
Student.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendanceRecords', onDelete: 'CASCADE' });
Attendance.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 9. Room <-> ClassSession (One-to-Many)
Room.hasMany(ClassSession, { foreignKey: 'room_id', as: 'sessions', onDelete: 'CASCADE' });
ClassSession.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// 10. ClassSession <-> AttendanceLog (One-to-Many)
ClassSession.hasMany(AttendanceLog, { foreignKey: 'class_session_id', as: 'logs', onDelete: 'CASCADE' });
AttendanceLog.belongsTo(ClassSession, { foreignKey: 'class_session_id', as: 'session' });

// 11. Course <-> AttendanceReport (One-to-Many)
Course.hasMany(AttendanceReport, { foreignKey: 'course_id', as: 'reports', onDelete: 'CASCADE' });
AttendanceReport.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// 12. User <-> Score (One-to-One)
User.hasOne(Score, { foreignKey: 'userId', as: 'score' });
Score.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 13. Student <-> Score via User (for scoreboard queries)
Student.hasOne(Score, { foreignKey: 'userId', sourceKey: 'userId', as: 'score' });

// 14. User <-> TestScore (One-to-Many)
User.hasMany(TestScore, { foreignKey: 'studentId', as: 'testScores', onDelete: 'CASCADE' });
TestScore.belongsTo(User, { foreignKey: 'studentId', as: 'studentUser' });

// 15. Course <-> TestScore (One-to-Many)
Course.hasMany(TestScore, { foreignKey: 'courseId', as: 'testScores', onDelete: 'CASCADE' });
TestScore.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// 16. User (Instructor) <-> TestScore (Created by)
User.hasMany(TestScore, { foreignKey: 'createdBy', as: 'createdTestScores', onDelete: 'RESTRICT' });
TestScore.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Student,
  Department,
  Course,
  CourseRegistration,
  ClassSession,
  Room,
  Attendance,
  AttendanceLog,
  AttendanceReport,
  Score,
  TestScore,
};
