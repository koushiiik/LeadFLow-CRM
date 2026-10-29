const mongoose = require('mongoose');

const STAGE_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const SERVICE_INTEREST_OPTIONS = [
  'Web Development',
  'Digital Marketing',
  'SEO',
  'Mobile App',
  'UI/UX Design',
  'Other',
];
const SOURCE_OPTIONS = [
  'Website',
  'Referral',
  'Social Media',
  'Email',
  'Outreach',
  'Other',
];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    serviceInterest: {
      type: String,
      enum: SERVICE_INTEREST_OPTIONS,
      default: 'Web Development',
    },
    source: {
      type: String,
      enum: SOURCE_OPTIONS,
      default: 'Website',
    },
    budget: {
      type: Number,
      min: [0, 'Budget must be greater than or equal to 0'],
      default: 0,
    },
    stage: {
      type: String,
      enum: STAGE_OPTIONS,
      default: 'New',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for efficient search and filtering
leadSchema.index({ createdBy: 1, name: 'text', company: 'text' });
leadSchema.index({ createdBy: 1, stage: 1 });

module.exports = {
  Lead: mongoose.model('Lead', leadSchema),
  STAGE_OPTIONS,
  SERVICE_INTEREST_OPTIONS,
  SOURCE_OPTIONS,
};
