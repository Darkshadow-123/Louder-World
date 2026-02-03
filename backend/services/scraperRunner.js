const cron = require('node-cron');
const EventbriteScraper = require('./scrapers/EventbriteScraper');
const SydneyTodayScraper = require('./scrapers/SydneyTodayScraper');
const TimeOutSydneyScraper = require('./scrapers/TimeOutSydneyScraper');
const RSSFeedScraper = require('./scrapers/RSSFeedScraper');
const Event = require('../models/Event');
const logger = require('../utils/logger');

class ScraperRunner {
  constructor() {
    this.scrapers = [
      new EventbriteScraper(),
      new SydneyTodayScraper(),
      new TimeOutSydneyScraper(),
      new RSSFeedScraper(
        'Sydney Events RSS',
        'https://www.eventbrite.com.au/d/au--sydney/events/rss/',
        'https://www.eventbrite.com.au'
      )
    ];
    this.isRunning = false;
  }

  async runAll() {
    if (this.isRunning) {
      logger.warn('Scraping is already in progress');
      return { success: false, message: 'Scraping already in progress' };
    }

    this.isRunning = true;
    logger.info('Starting scraping cycle...');

    const results = {
      totalEventsProcessed: 0,
      scrapers: []
    };

    for (const scraper of this.scrapers) {
      try {
        logger.info(`Running scraper: ${scraper.sourceName}`);
        const result = await scraper.scrape();
        
        results.scrapers.push({
          name: scraper.sourceName,
          success: result.success,
          eventCount: result.eventCount || 0
        });
        
        results.totalEventsProcessed += result.eventCount || 0;
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        logger.error(`Error running ${scraper.sourceName}: ${error.message}`);
        results.scrapers.push({
          name: scraper.sourceName,
          success: false,
          error: error.message
        });
      }
    }

    await this.cleanupOldEvents();
    await this.updateEventStatuses();

    this.isRunning = false;
    logger.info(`Scraping cycle complete. Total events: ${results.totalEventsProcessed}`);
    
    return results;
  }

  async cleanupOldEvents() {
    try {
      const cutoffDays = parseInt(process.env.EVENT_CUTOFF_DAYS) || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);

      const result = await Event.deleteMany(
        {
          status: 'inactive',
          lastUpdatedAt: { $lt: cutoffDate }
        }
      );

      if (result.deletedCount > 0) {
        logger.info(`Deleted ${result.deletedCount} old inactive events`);
      }
    } catch (error) {
      logger.error(`Error cleaning up old events: ${error.message}`);
    }
  }

  async updateEventStatuses() {
    try {
      const now = new Date();
      
      const pastEventsResult = await Event.updateMany(
        {
          status: { $ne: 'inactive' },
          dateTime: { $lt: now }
        },
        { $set: { status: 'inactive', lastUpdatedAt: now } }
      );

      if (pastEventsResult.modifiedCount > 0) {
        logger.info(`Marked ${pastEventsResult.modifiedCount} past events as inactive`);
      }

      const result = await Event.updateMany(
        {
          status: 'new',
          lastScrapedAt: { $lt: new Date(now - 7 * 24 * 60 * 60 * 1000) }
        },
        { $set: { status: 'updated' } }
      );

    } catch (error) {
      logger.error(`Error updating event statuses: ${error.message}`);
    }
  }

  startScheduledScraping() {
    const intervalMinutes = parseInt(process.env.SCRAPE_INTERVAL_MINUTES) || 60;
    const cronExpression = `*/${intervalMinutes} * * * *`;

    logger.info(`Starting scheduled scraping every ${intervalMinutes} minutes`);

    cron.schedule(cronExpression, async () => {
      logger.info('Running scheduled scraping...');
      await this.runAll();
    });

    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily cleanup and status update...');
      await this.cleanupOldEvents();
      await this.updateEventStatuses();
    });
  }

  async runSingleScraper(scraperName) {
    const scraper = this.scrapers.find(s => 
      s.sourceName.toLowerCase() === scraperName.toLowerCase()
    );

    if (!scraper) {
      return { success: false, message: `Scraper ${scraperName} not found` };
    }

    try {
      logger.info(`Running single scraper: ${scraperName}`);
      const result = await scraper.scrape();
      return result;
    } catch (error) {
      logger.error(`Error running ${scraperName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  getScraperStatus() {
    return {
      isRunning: this.isRunning,
      scrapers: this.scrapers.map(s => ({
        name: s.sourceName,
        baseUrl: s.baseUrl
      }))
    };
  }
}

const scraperRunner = new ScraperRunner();

module.exports = scraperRunner;
