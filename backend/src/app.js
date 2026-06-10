require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const { seedDatabase } = require("./db/seedHelper");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ message: "Attendance API Running" });
});

// Health check endpoint for test suite
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

const path = require("path");

const PORT = process.env.PORT || 5000;
const forceSync = process.env.DB_FORCE_SYNC === 'true';

// Initialize database then start server
sequelize.sync({ force: forceSync })
  .then(() => {
    console.log(`Database connected and schema synced (force: ${forceSync}).`);
    return seedDatabase();
  })
  .then(() => {
    // Serve frontend static files if running in production, explicitly enabled, or if a build directory exists
    const fs = require("fs");
    const distPath = path.join(__dirname, "../../frontend/dist");
    const hasBuiltFrontend = fs.existsSync(distPath);

    if (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "true" || hasBuiltFrontend) {
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
  })
  .catch((err) => {
    console.error("Critical: Database initialization failed:", err);
    process.exit(1);
  });