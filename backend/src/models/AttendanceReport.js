const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceReport = sequelize.define('AttendanceReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'course_id',
  },
  reportName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'report_name',
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_path',
  },
  reportType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'report_type',
    validate: {
      isIn: [['excel', 'pdf']],
    }
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'generated_at',
  }
}, {
  tableName: 'attendance_reports',
});

module.exports = AttendanceReport;
