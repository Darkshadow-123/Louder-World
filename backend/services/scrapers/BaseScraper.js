const axios = require('axios');
const cheerio = require('cheerio');
const Event = require('../../models/Event');
const logger = require('../../utils/logger');

class BaseScraper {
  constructor(sourceName, baseUrl) {
    this.sourceName = sourceName;
    this.baseUrl = baseUrl;
    this.events = [];
  }

  async fetchHTML(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000,
        maxRedirects: 5
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        logger.warn(`Access denied (403) for ${url} - site may be blocking scrapers`);
      } else {
        logger.error(`Error fetching ${url}: ${error.message}`);
      }
      return null;
    }
  }

  async fetchWithPuppeteer(url, options = {}) {
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000
      });
      
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 5000 });
      }
      
      const html = await page.content();
      await browser.close();
      return html;
    } catch (error) {
      logger.error(`Puppeteer error for ${url}: ${error.message}`);
      return null;
    }
  }

  normalizeEventData(eventData) {
    return {
      city: 'Sydney',
      title: this.cleanText(eventData.title),
      description: this.cleanText(eventData.description || ''),
      dateTime: this.parseDateTime(eventData.dateTime),
      endDate: eventData.endDate ? this.parseDateTime(eventData.endDate) : null,
      venue: {
        name: this.cleanText(eventData.venueName || ''),
        address: this.cleanText(eventData.venueAddress || ''),
        city: 'Sydney',
        coordinates: eventData.coordinates || null
      },
      category: this.ensureArray(eventData.category),
      tags: this.ensureArray(eventData.tags),
      imageUrl: eventData.imageUrl || null,
      imageUrls: eventData.imageUrls || [],
      price: eventData.price || null,
      availability: eventData.availability || 'unknown',
      organizer: eventData.organizer || null,
      ageRestriction: eventData.ageRestriction || null,
      source: {
        name: this.sourceName,
        url: this.baseUrl,
        eventUrl: eventData.eventUrl
      },
      scrapedFromSourceAt: new Date(),
      originalData: eventData.rawData || null
    };
  }

  cleanText(text) {
    if (!text) return '';
    return text.toString().trim().replace(/\s+/g, ' ');
  }

  parseDateTime(dateTimeStr) {
    if (!dateTimeStr) return null;
    if (dateTimeStr instanceof Date) return dateTimeStr;
    
    const date = new Date(dateTimeStr);
    return isNaN(date.getTime()) ? null : date;
  }

  ensureArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  async saveEvent(normalizedEvent) {
    try {
      const existingEvent = await Event.findOne({ 
        'source.eventUrl': normalizedEvent.source.eventUrl 
      });

      if (existingEvent) {
        const hasChanges = this.detectChanges(existingEvent, normalizedEvent);
        
        if (hasChanges) {
          Object.assign(existingEvent, normalizedEvent, {
            status: existingEvent.status !== 'imported' ? 'updated' : existingEvent.status,
            lastUpdatedAt: new Date(),
            lastScrapedAt: new Date()
          });
          
          const savedEvent = await existingEvent.save();
          logger.info(`Updated event: ${savedEvent.title}`);
          return { event: savedEvent, action: 'updated' };
        }
        
        Object.assign(existingEvent, {
          lastScrapedAt: new Date()
        });
        await existingEvent.save();
        return { event: existingEvent, action: 'unchanged' };
      } else {
        const newEvent = new Event({
          ...normalizedEvent,
          status: 'new',
          lastScrapedAt: new Date(),
          lastUpdatedAt: new Date()
        });
        
        const savedEvent = await newEvent.save();
        logger.info(`New event: ${savedEvent.title}`);
        return { event: savedEvent, action: 'created' };
      }
    } catch (error) {
      if (error.code === 11000) {
        logger.warn(`Duplicate event skipped: ${normalizedEvent.source.eventUrl}`);
        return { event: null, action: 'duplicate' };
      }
      logger.error(`Error saving event: ${error.message}`);
      return { event: null, action: 'error', error };
    }
  }

  detectChanges(existingEvent, newEvent) {
    const fieldsToCheck = [
      'title', 'description', 'dateTime', 'endDate', 
      'venue.name', 'venue.address', 'imageUrl', 'price',
      'availability'
    ];
    
    for (const field of fieldsToCheck) {
      const existingValue = this.getNestedValue(existingEvent, field);
      const newValue = this.getNestedValue(newEvent, field);
      
      if (existingValue !== newValue) {
        return true;
      }
    }
    
    return false;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  async markInactiveEvents(activeEventUrls) {
    try {
      const result = await Event.updateMany(
        {
          'source.name': this.sourceName,
          'source.eventUrl': { $nin: activeEventUrls },
          status: { $ne: 'inactive' }
        },
        {
          status: 'inactive',
          lastUpdatedAt: new Date()
        }
      );
      
      logger.info(`Marked ${result.modifiedCount} events as inactive from ${this.sourceName}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error(`Error marking inactive events: ${error.message}`);
      return 0;
    }
  }
}

module.exports = BaseScraper;
