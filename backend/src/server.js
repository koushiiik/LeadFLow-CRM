require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Sanitize CORS origin (strip trailing slash)
const clientOrigin = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.replace(/\/+$/, '')
  : true;
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());

// Database connection middleware for serverless & long-running servers
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Database Middleware Error]:', err.message);
    res.status(500).json({
      success: false,
      message: `Database connection error: ${err.message}. Please verify MONGODB_URI and check that 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.`,
      errors: [err.message],
    });
  }
});

// REST API v1 Endpoints
app.use('/api/v1/health', require('./routes/healthRoutes'));
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/leads', require('./routes/leadRoutes'));
app.use('/api/v1/activities', require('./routes/activityRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));

// Serve frontend static build
const candidatePaths = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../dist'),
  path.join(__dirname, '../../frontend/dist'),
];
const staticPath = candidatePaths.find((p) => fs.existsSync(p));

if (staticPath && (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV)) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LeadFlow API] Server running on port ${PORT}`);
  });
}

module.exports = app;
module.exports.app = app;
