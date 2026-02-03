const express = require('express');
const Event = require('../models/Event');
const EmailLead = require('../models/EmailLead');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { emailLeadValidation, eventImportValidation, eventFilterValidation } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      city = 'Sydney',
      status,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { city };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category) {
      filter.category = { $in: [new RegExp(category, 'i')] };
    }

    if (startDate || endDate) {
      filter.dateTime = {};
      if (startDate) filter.dateTime.$gte = new Date(startDate);
      if (endDate) filter.dateTime.$lte = new Date(endDate);
    } else {
      filter.$or = filter.$or || [];
      filter.$or.push({ dateTime: null });
    }
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'venue.name': new RegExp(search, 'i') },
        { 'venue.address': new RegExp(search, 'i') }
      ];
    }
    
    const events = await Event.find(filter)
      .sort({ dateTime: 1, lastScrapedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      events
    });
  } catch (error) {
    logger.error(`Error fetching events: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching events' 
    });
  }
});

router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const events = await Event.find({
      city: 'Sydney',
      status: { $ne: 'inactive' },
      dateTime: { $gte: new Date() }
    })
      .sort({ lastScrapedAt: -1 })
      .limit(6)
      .lean();

    res.json({
      success: true,
      events
    });
  } catch (error) {
    logger.error(`Error fetching featured events: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching featured events' 
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: { $ne: 'inactive' } } },
      { $unwind: '$category' },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      categories: categories.map(c => c._id)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories' 
    });
  }
});

router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Event.aggregate([
      { $match: { city: 'Sydney' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          updated: { $sum: { $cond: [{ $eq: ['$status', 'updated'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          imported: { $sum: { $cond: [{ $eq: ['$status', 'imported'] }, 1, 0] } }
        }
      }
    ]);

    const sources = await Event.aggregate([
      { $match: { city: 'Sydney' } },
      { $group: { _id: '$source.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || { total: 0, new: 0, updated: 0, inactive: 0, imported: 0 },
      sources
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching stats' 
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching event' 
    });
  }
});

router.post('/import', protect, eventImportValidation, async (req, res) => {
  try {
    const { eventId, notes } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    await event.importEvent(req.user._id, notes);

    logger.info(`Event ${event._id} imported by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Event imported successfully',
      event
    });
  } catch (error) {
    logger.error(`Error importing event: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error importing event' 
    });
  }
});

router.post('/leads', emailLeadValidation, async (req, res) => {
  try {
    const { email, consent, eventId } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    const existingLead = await EmailLead.findOne({ email, eventId });
    if (existingLead) {
      return res.json({
        success: true,
        message: 'Email already registered for this event',
        redirectUrl: event.source.eventUrl
      });
    }

    const lead = await EmailLead.create({
      email,
      consent,
      eventId,
      eventTitle: event.title,
      eventSource: event.source.name,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    logger.info(`New lead captured: ${email} for event ${event.title}`);

    res.json({
      success: true,
      message: 'Email registered successfully',
      lead,
      redirectUrl: event.source.eventUrl
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: 'Email already registered for this event'
      });
    }
    logger.error(`Error creating lead: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering email' 
    });
  }
});

router.get('/dashboard/filter', protect, authorize('admin'), eventFilterValidation, async (req, res) => {
  try {
    const { filters = {} } = req.query;
    const {
      city = 'Sydney',
      search,
      status,
      startDate,
      endDate,
      source,
      page = 1,
      limit = 50
    } = filters;

    const filter = { city };

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'venue.name': new RegExp(search, 'i') },
        { 'venue.address': new RegExp(search, 'i') }
      ];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (source) {
      filter['source.name'] = source;
    }

    if (startDate || endDate) {
      filter.dateTime = {};
      if (startDate) filter.dateTime.$gte = new Date(startDate);
      if (endDate) filter.dateTime.$lte = new Date(endDate);
    }

    const events = await Event.find(filter)
      .sort({ lastUpdatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      events
    });
  } catch (error) {
    logger.error(`Error filtering events: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error filtering events' 
    });
  }
});

module.exports = router;
