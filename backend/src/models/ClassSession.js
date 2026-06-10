const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ClassSession = sequelize.define('ClassSession', {
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
  sessionName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'session_name',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time',
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
  },
  roomLocation: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'room_location',
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'room_id',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  allowedRadiusMeters: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    field: 'allowed_radius_meters',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_active',
  },
  qrSecretSalt: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'qr_secret_salt',
  }
}, {
  tableName: 'class_sessions',
});

module.exports = ClassSession;
