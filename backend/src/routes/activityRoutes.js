const express = require('express');
const router = express.Router();
const {
  getActivities,
  createActivity,
  updateActivity,
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// All activity routes are protected
router.use(protect);

router.route('/')
  .get(getActivities)
  .post(createActivity);

router.route('/:id')
  .patch(updateActivity);

module.exports = router;
