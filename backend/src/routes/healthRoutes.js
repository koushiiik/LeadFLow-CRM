const express = require('express');
const router = express.Router();

// GET /api/v1/health - Health check; do not expose secrets
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LeadFlow CRM API is running and healthy',
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
