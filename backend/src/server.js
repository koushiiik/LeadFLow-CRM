require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[LeadFlow API] Server running on port ${PORT}`);
});

module.exports = { app, server };
