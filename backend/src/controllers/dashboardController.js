const { Lead } = require('../models/Lead');
const { Activity } = require('../models/Activity');

// @desc    Get dashboard summary metrics calculated from database records
// @route   GET /api/v1/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Total leads for current user
    const totalLeadsPromise = Lead.countDocuments({ createdBy: userId });

    // 2. Active leads: those NOT in 'Won' or 'Lost' stages (Section 6 Business Rules)
    const activeLeadsPromise = Lead.countDocuments({
      createdBy: userId,
      stage: { $nin: ['Won', 'Lost'] },
    });

    // 3. Won leads
    const wonLeadsPromise = Lead.countDocuments({
      createdBy: userId,
      stage: 'Won',
    });

    // 4. Pending follow-ups
    const pendingFollowUpsPromise = Activity.countDocuments({
      createdBy: userId,
      status: 'Pending',
    });

    // 5. Overdue follow-ups: Pending activities whose dueAt < current server time
    // Completed activities are never overdue (Section 6 Business Rules)
    const overdueFollowUpsPromise = Activity.countDocuments({
      createdBy: userId,
      status: 'Pending',
      dueAt: { $lt: now },
    });

    const [
      totalLeads,
      activeLeads,
      wonLeads,
      pendingFollowUps,
      overdueFollowUps,
    ] = await Promise.all([
      totalLeadsPromise,
      activeLeadsPromise,
      wonLeadsPromise,
      pendingFollowUpsPromise,
      overdueFollowUpsPromise,
    ]);

    res.status(200).json({
      success: true,
      message: 'Dashboard metrics calculated successfully',
      data: {
        totalLeads,
        activeLeads,
        wonLeads,
        pendingFollowUps,
        overdueFollowUps,
        serverTime: now.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
