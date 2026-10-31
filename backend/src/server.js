require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
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

// Serve frontend static build in production
const distPath = path.join(__dirname, '../../frontend/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[LeadFlow API] Server running on port ${PORT}`);
});

module.exports = { app, server };
