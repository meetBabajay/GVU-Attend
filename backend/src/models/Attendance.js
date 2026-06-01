const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
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
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['present', 'absent', 'late']],
    }
  },
  signedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'signed_at',
  },
  deviceFingerprint: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'device_fingerprint',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: false,
    field: 'ip_address',
  },
  distanceMeters: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'distance_meters',
  },
  verifiedGps: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'verified_gps',
  }
}, {
  tableName: 'attendance',
  indexes: [
    {
      unique: true,
      fields: ['class_session_id', 'student_id']
    }
  ]
});

module.exports = Attendance;
