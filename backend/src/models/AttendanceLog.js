const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  classSessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_session_id',
  },
  matricNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'matric_number',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: false,
    field: 'ip_address',
  },
  deviceFingerprint: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'device_fingerprint',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['success', 'failed']],
    }
  },
  failureReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'failure_reason',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  attemptedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'attempted_at',
  }
}, {
  tableName: 'attendance_logs',
});

module.exports = AttendanceLog;
