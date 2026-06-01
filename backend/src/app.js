const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const { seedDatabase } = require('./db/seedHelper');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API Routers
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Attendance Management API is running' });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Sync Database and start the server
const startServer = async () => {
  try {
    // Sync and seed DB in development
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` Server successfully started on port ${PORT}      `);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
      console.log(` URL: http://localhost:${PORT}                    `);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
