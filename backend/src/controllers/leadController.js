const mongoose = require('mongoose');
const { Lead, STAGE_OPTIONS, SERVICE_INTEREST_OPTIONS, SOURCE_OPTIONS } = require('../models/Lead');
const { Activity } = require('../models/Activity');

const RESTRICTED_FIELDS = ['_id', 'createdBy', 'createdAt', 'updatedAt'];

// Helper to validate common lead fields
const validateLeadData = ({ name, email = '', phone = '', budget, stage, isCreate = false }) => {
  if (isCreate && (!name || typeof name !== 'string' || !name.trim())) {
    return 'Lead name is required';
  }
  if (!isCreate && name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
    return 'Lead name cannot be empty';
  }
  if (isCreate && (!email || !email.trim()) && (!phone || !phone.trim())) {
    return 'At least one of email or phone must be provided';
  }
  if (!isCreate && email !== undefined && phone !== undefined && !email.trim() && !phone.trim()) {
    return 'At least one of email or phone must be provided';
  }
  if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Invalid email format provided';
  }
  if (budget !== undefined && budget !== '' && (isNaN(budget) || Number(budget) < 0)) {
    return 'Budget must be greater than or equal to 0';
  }
  if (stage && !STAGE_OPTIONS.includes(stage)) {
    return `Invalid stage option. Must be one of: ${STAGE_OPTIONS.join(', ')}`;
  }
  return null;
};

// Helper to find lead and verify ownership
const findUserLead = async (id, userId, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid lead ID format', errors: ['Invalid ObjectId'] });
    return null;
  }
  const lead = await Lead.findById(id);
  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found', errors: ['No lead exists with this ID'] });
    return null;
  }
  if (lead.createdBy.toString() !== userId.toString()) {
    res.status(403).json({ success: false, message: 'Access denied', errors: ['Forbidden resource access'] });
    return null;
  }
  return lead;
};

// GET /api/v1/leads - List leads with search and stage filter
const getLeads = async (req, res, next) => {
  try {
    const { search, stage } = req.query;
    const query = { createdBy: req.user._id };

    if (stage && stage !== 'All' && STAGE_OPTIONS.includes(stage)) {
      query.stage = stage;
    }
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { company: reg }];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Leads retrieved successfully', data: { leads, count: leads.length } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/leads - Create a lead
const createLead = async (req, res, next) => {
  try {
    const { name, company = '', email = '', phone = '', serviceInterest, source, budget, stage } = req.body;

    const validationError = validateLeadData({ name, email, phone, budget, stage, isCreate: true });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError, errors: [validationError] });
    }

    const lead = await Lead.create({
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      serviceInterest: SERVICE_INTEREST_OPTIONS.includes(serviceInterest) ? serviceInterest : 'Other',
      source: SOURCE_OPTIONS.includes(source) ? source : 'Other',
      budget: budget !== undefined && budget !== '' ? Number(budget) : 0,
      stage: stage || 'New',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Lead created successfully', data: { lead } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/leads/:id - Get lead and its follow-ups
const getLeadById = async (req, res, next) => {
  try {
    const lead = await findUserLead(req.params.id, req.user._id, res);
    if (!lead) return;

    const activities = await Activity.find({ leadId: lead._id, createdBy: req.user._id }).sort({ dueAt: 1 });
    res.status(200).json({ success: true, message: 'Lead retrieved successfully', data: { lead, activities } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/leads/:id - Update permitted fields only
const updateLead = async (req, res, next) => {
  try {
    const attemptedRestricted = RESTRICTED_FIELDS.filter((f) => f in req.body);
    if (attemptedRestricted.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Modification of restricted fields is not permitted: ${attemptedRestricted.join(', ')}`,
        errors: attemptedRestricted.map((f) => `Cannot modify restricted field '${f}'`),
      });
    }

    const lead = await findUserLead(req.params.id, req.user._id, res);
    if (!lead) return;

    const { name, company, email, phone, serviceInterest, source, budget, stage } = req.body;

    const targetEmail = email !== undefined ? email.trim().toLowerCase() : lead.email;
    const targetPhone = phone !== undefined ? phone.trim() : lead.phone;

    const validationError = validateLeadData({
      name,
      email: targetEmail,
      phone: targetPhone,
      budget,
      stage,
      isCreate: false,
    });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError, errors: [validationError] });
    }

    if (name !== undefined) lead.name = name.trim();
    if (company !== undefined) lead.company = company.trim();
    if (email !== undefined) lead.email = targetEmail;
    if (phone !== undefined) lead.phone = targetPhone;
    if (budget !== undefined) lead.budget = Number(budget);
    if (stage !== undefined) lead.stage = stage;
    if (serviceInterest !== undefined) {
      lead.serviceInterest = SERVICE_INTEREST_OPTIONS.includes(serviceInterest) ? serviceInterest : 'Other';
    }
    if (source !== undefined) {
      lead.source = SOURCE_OPTIONS.includes(source) ? source : 'Other';
    }

    const updatedLead = await lead.save();
    res.status(200).json({ success: true, message: 'Lead updated successfully', data: { lead: updatedLead } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/leads/:id - Delete lead and associated follow-ups
const deleteLead = async (req, res, next) => {
  try {
    const lead = await findUserLead(req.params.id, req.user._id, res);
    if (!lead) return;

    await Lead.findByIdAndDelete(lead._id);
    const { deletedCount } = await Activity.deleteMany({ leadId: lead._id });

    res.status(200).json({
      success: true,
      message: 'Lead and associated follow-ups deleted successfully',
      data: { deletedLeadId: lead._id, deletedFollowUpsCount: deletedCount },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeads, createLead, getLeadById, updateLead, deleteLead };
