const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  city: {
    type: String,
    default: 'Sydney',
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dateTime: {
    type: Date,
    index: true
  },
  endDate: {
    type: Date
  },
  venue: {
    name: String,
    address: String,
    city: {
      type: String,
      default: 'Sydney',
      index: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  category: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  imageUrl: String,
  imageUrls: [String],
  source: {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    eventUrl: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['new', 'updated', 'inactive', 'imported'],
    default: 'new',
    index: true
  },
  importedAt: Date,
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  importNotes: String,
  lastScrapedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  scrapedFromSourceAt: Date,
  price: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'AUD'
    },
    isFree: Boolean
  },
  availability: {
    type: String,
    enum: ['available', 'sold_out', 'limited', 'waitlist', 'unknown'],
    default: 'unknown'
  },
  organizer: String,
  ageRestriction: String,
  originalData: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

eventSchema.index({ dateTime: 1, city: 1 });
eventSchema.index({ status: 1, city: 1 });
eventSchema.index({ 'source.eventUrl': 1 }, { unique: true });
eventSchema.index({ lastScrapedAt: 1 });

eventSchema.methods.markAsInactive = function() {
  this.status = 'inactive';
  this.lastUpdatedAt = new Date();
  return this.save();
};

eventSchema.methods.markAsUpdated = function() {
  if (this.status !== 'imported') {
    this.status = 'updated';
  }
  this.lastUpdatedAt = new Date();
  return this.save();
};

eventSchema.methods.markAsNew = function() {
  this.status = 'new';
  this.lastUpdatedAt = new Date();
  return this.save();
};

eventSchema.methods.importEvent = function(userId, notes) {
  this.status = 'imported';
  this.importedAt = new Date();
  this.importedBy = userId;
  this.importNotes = notes;
  this.lastUpdatedAt = new Date();
  return this.save();
};

eventSchema.statics.findActiveByCity = function(city, options = {}) {
  const query = {
    city: city || 'Sydney',
    status: { $ne: 'inactive' },
    dateTime: { $gte: new Date() }
  };
  
  return this.find(query)
    .sort({ dateTime: 1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

eventSchema.statics.findInactiveEvents = function(options = {}) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (options.cutoffDays || 30));
  
  return this.find({
    status: 'inactive',
    lastUpdatedAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Event', eventSchema);
