// This file is the single Vercel Serverless Function entry point.
// It wraps the entire Express app so all /api/* routes are handled here.
const app = require('../backend/src/app');

module.exports = app;
