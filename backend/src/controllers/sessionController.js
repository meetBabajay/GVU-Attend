const crypto = require('crypto');
const { ClassSession, Course, Room } = require('../models');

// GET /api/sessions/:courseId - List all sessions for a course
exports.listSessions = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Access check: if student, they must be registered (handled by router or verified here)
    const sessions = await ClassSession.findAll({
      where: { courseId },
      order: [['date', 'DESC'], ['start_time', 'DESC']]
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/sessions/:courseId - Create a new class session (Lecturer only)
exports.createSession = async (req, res) => {
  const { courseId } = req.params;
  const { sessionName, date, startTime, endTime, roomId, roomLocation, latitude, longitude, allowedRadiusMeters } = req.body;

  if (!sessionName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required session parameters' });
  }

  try {
    let finalRoomLocation = roomLocation;
    let finalLatitude = latitude;
    let finalLongitude = longitude;
    let finalRoomId = roomId;

    if (roomId) {
      const room = await Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      finalRoomLocation = room.name;
      finalLatitude = room.latitude;
      finalLongitude = room.longitude;
      finalRoomId = room.id;
    } else if (!roomLocation || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Either roomId or roomLocation, latitude, and longitude must be provided' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    const session = await ClassSession.create({
      courseId,
      sessionName,
      date,
      startTime,
      endTime,
      roomId: finalRoomId,
      roomLocation: finalRoomLocation,
      latitude: finalLatitude,
      longitude: finalLongitude,
      allowedRadiusMeters: allowedRadiusMeters || 500, // Default to 500m per request
      isActive: false
    });

    return res.status(201).json({
      message: 'Class session created successfully',
      session
    });
  } catch (error) {
    console.error('Error creating class session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/sessions/open/:sessionId - Open an attendance session (Lecturer only)
exports.openSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await ClassSession.findByPk(sessionId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    if (session.course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    // Generate dynamic QR key salt
    const qrSalt = crypto.randomBytes(32).toString('hex');

    session.isActive = true;
    session.qrSecretSalt = qrSalt;
    await session.save();

    return res.status(200).json({
      message: 'Attendance session is now open',
      session: {
        id: session.id,
        sessionName: session.sessionName,
        isActive: session.isActive,
        roomLocation: session.roomLocation,
        latitude: session.latitude,
        longitude: session.longitude,
        allowedRadiusMeters: session.allowedRadiusMeters
      }
    });
  } catch (error) {
    console.error('Error opening attendance session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/sessions/close/:sessionId - Close an attendance session (Lecturer only)
exports.closeSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await ClassSession.findByPk(sessionId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    if (session.course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    session.isActive = false;
    session.qrSecretSalt = null; // Clear salt to invalidate all outstanding QR codes
    await session.save();

    return res.status(200).json({
      message: 'Attendance session has been closed',
      session: {
        id: session.id,
        sessionName: session.sessionName,
        isActive: session.isActive
      }
    });
  } catch (error) {
    console.error('Error closing attendance session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/sessions/:sessionId/qr - Get dynamic QR token for lecturer screen (Lecturer only)
exports.getQRToken = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await ClassSession.findByPk(sessionId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    if (session.course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    if (!session.isActive) {
      return res.status(400).json({ error: 'Class session is not active' });
    }

    const { generateQRToken } = require('../utils/qr');
    const qrToken = generateQRToken(session.id, session.qrSecretSalt);

    return res.status(200).json({
      qrToken,
      expiresInSeconds: 180
    });
  } catch (error) {
    console.error('Error generating QR token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/sessions/rooms - List all rooms
exports.listRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['name', 'ASC']]
    });
    return res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
