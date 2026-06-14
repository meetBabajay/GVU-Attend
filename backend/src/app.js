require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const { seedDatabase } = require("./db/seedHelper");

const app = express();

const forceSync = process.env.DB_FORCE_SYNC === 'true';
let dbReady = false;
let dbError = null;

const dbInitPromise = sequelize.sync({ force: forceSync })
  .then(() => {
    console.log(`Database connected and schema synced (force: ${forceSync}).`);
    return seedDatabase();
  })
  .then(() => {
    dbReady = true;
    console.log("Database seeded and ready.");
  })
  .catch((err) => {
    dbError = err;
    console.error("Critical: Database initialization failed:", err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Block requests until database is ready
app.use((req, res, next) => {
  if (dbReady) {
    return next();
  }
  if (dbError) {
    return res.status(500).json({ error: "Database initialization failed", details: dbError.message });
  }
  dbInitPromise
    .then(() => next())
    .catch((err) => res.status(500).json({ error: "Database initialization failed", details: err.message }));
});

// Root test route
app.get("/", (req, res) => {
  res.json({ message: "Attendance API Running" });
});

// Health check endpoint for test suite
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// API Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api/courses", courseRoutes);
app.use("/courses", courseRoutes);

app.use("/api/sessions", sessionRoutes);
app.use("/sessions", sessionRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/attendance", attendanceRoutes);

app.use("/api/reports", reportRoutes);
app.use("/reports", reportRoutes);

const path = require("path");
const PORT = process.env.PORT || 5000;

// Serve frontend static files if running in production, explicitly enabled, or if a build directory exists
const fs = require("fs");
const distPath = path.join(__dirname, "../../frontend/dist");
const hasBuiltFrontend = fs.existsSync(distPath);
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

if (!isVercel && (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "true" || hasBuiltFrontend)) {
  app.use(express.static(distPath));
  
  // Fallback for SPA routing: serve index.html for all non-API paths
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
  console.log(`Serving static production build from: ${distPath}`);
}

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("=================================");
    console.log(` Server started on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log("=================================");
  });
}

module.exports = app;