const mongoose = require('mongoose');
const { Activity, ACTIVITY_TYPE_OPTIONS, ACTIVITY_STATUS_OPTIONS } = require('../models/Activity');
const { Lead } = require('../models/Lead');

const RESTRICTED_FIELDS = ['_id', 'leadId', 'createdBy', 'createdAt', 'updatedAt'];

// Helper to find activity and verify ownership
const findUserActivity = async (id, userId, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid activity ID format', errors: ['Invalid ObjectId'] });
    return null;
  }
  const activity = await Activity.findById(id);
  if (!activity) {
    res.status(404).json({ success: false, message: 'Activity not found', errors: ['No activity exists with this ID'] });
    return null;
  }
  if (activity.createdBy.toString() !== userId.toString()) {
    res.status(403).json({ success: false, message: 'Access denied', errors: ['Forbidden resource access'] });
    return null;
  }
  return activity;
};

// GET /api/v1/activities - List follow-ups
const getActivities = async (req, res, next) => {
  try {
    const { status, leadId } = req.query;
    const query = { createdBy: req.user._id };

    if (status && status !== 'All' && ACTIVITY_STATUS_OPTIONS.includes(status)) {
      query.status = status;
    }
    if (leadId) {
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({ success: false, message: 'Invalid leadId format', errors: ['Invalid ObjectId'] });
      }
      query.leadId = leadId;
    }

    const activities = await Activity.find(query)
      .populate('leadId', 'name company email phone stage')
      .sort({ dueAt: 1 });

    res.status(200).json({ success: true, message: 'Activities retrieved successfully', data: { activities, count: activities.length } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/activities - Create a follow-up
const createActivity = async (req, res, next) => {
  try {
    const { leadId, title, dueAt, type } = req.body;

    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({ success: false, message: 'Valid lead reference required', errors: ['Invalid leadId'] });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Referenced lead not found', errors: ['Lead not found'] });
    }
    if (lead.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead', errors: ['Forbidden'] });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required', errors: ['Title cannot be empty'] });
    }
    if (!dueAt || isNaN(new Date(dueAt).getTime())) {
      return res.status(400).json({ success: false, message: 'Valid due date is required', errors: ['Invalid dueAt'] });
    }
    if (!type || !ACTIVITY_TYPE_OPTIONS.includes(type)) {
      return res.status(400).json({ success: false, message: `Type must be: ${ACTIVITY_TYPE_OPTIONS.join(', ')}`, errors: ['Invalid type'] });
    }

    const activity = await Activity.create({
      leadId,
      title: title.trim(),
      dueAt: new Date(dueAt),
      type,
      status: 'Pending',
      createdBy: req.user._id,
    });

    const populated = await Activity.findById(activity._id).populate('leadId', 'name company email phone stage');
    res.status(201).json({ success: true, message: 'Follow-up created successfully', data: { activity: populated } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/activities/:id - Update permitted fields or mark completed
const updateActivity = async (req, res, next) => {
  try {
    const attemptedRestricted = RESTRICTED_FIELDS.filter((f) => f in req.body);
    if (attemptedRestricted.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Modification of restricted fields is not permitted: ${attemptedRestricted.join(', ')}`,
        errors: attemptedRestricted.map((f) => `Cannot modify restricted field '${f}'`),
      });
    }

    const activity = await findUserActivity(req.params.id, req.user._id, res);
    if (!activity) return;

    const { title, dueAt, type, status } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty', errors: ['Title required'] });
      activity.title = title.trim();
    }
    if (dueAt !== undefined) {
      const parsed = new Date(dueAt);
      if (isNaN(parsed.getTime())) return res.status(400).json({ success: false, message: 'Invalid due date', errors: ['Invalid date'] });
      activity.dueAt = parsed;
    }
    if (type !== undefined) {
      if (!ACTIVITY_TYPE_OPTIONS.includes(type)) return res.status(400).json({ success: false, message: 'Invalid type', errors: ['Invalid type'] });
      activity.type = type;
    }
    if (status !== undefined) {
      if (!ACTIVITY_STATUS_OPTIONS.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status', errors: ['Invalid status'] });
      if (status === 'Completed' && activity.status !== 'Completed') {
        activity.completedAt = new Date();
      } else if (status === 'Pending') {
        activity.completedAt = null;
      }
      activity.status = status;
    }

    await activity.save();
    const populated = await Activity.findById(activity._id).populate('leadId', 'name company email phone stage');
    res.status(200).json({ success: true, message: 'Activity updated successfully', data: { activity: populated } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivities, createActivity, updateActivity };
