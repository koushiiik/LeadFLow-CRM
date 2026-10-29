const mongoose = require('mongoose');

const ACTIVITY_TYPE_OPTIONS = ['Call', 'Email', 'Meeting', 'Task'];
const ACTIVITY_STATUS_OPTIONS = ['Pending', 'Completed'];

const activitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference (leadId) is required'],
    },
    title: {
      type: String,
      required: [true, 'Follow-up title is required'],
      trim: true,
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date and time (dueAt) is required'],
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPE_OPTIONS,
      required: [true, 'Activity type is required'],
    },
    status: {
      type: String,
      enum: ACTIVITY_STATUS_OPTIONS,
      default: 'Pending',
    },
    completedAt: {
      type: Date,
      default: null,
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

activitySchema.index({ createdBy: 1, status: 1, dueAt: 1 });
activitySchema.index({ leadId: 1 });

module.exports = {
  Activity: mongoose.model('Activity', activitySchema),
  ACTIVITY_TYPE_OPTIONS,
  ACTIVITY_STATUS_OPTIONS,
};
