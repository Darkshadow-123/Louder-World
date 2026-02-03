const mongoose = require('mongoose');

const emailLeadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  consent: {
    type: Boolean,
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventTitle: String,
  eventSource: String,
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

emailLeadSchema.index({ email: 1, eventId: 1 }, { unique: true });
emailLeadSchema.index({ createdAt: 1 });

module.exports = mongoose.model('EmailLead', emailLeadSchema);
