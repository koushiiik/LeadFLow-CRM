const express = require('express');
const router = express.Router();
const {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

// All lead routes are protected by authentication
router.use(protect);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLeadById)
  .patch(updateLead)
  .delete(deleteLead);

module.exports = router;
