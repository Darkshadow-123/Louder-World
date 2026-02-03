const BaseScraper = require('./BaseScraper');
const logger = require('../../utils/logger');
const parser = require('xml2js');

class RSSFeedScraper extends BaseScraper {
  constructor(sourceName, feedUrl, baseUrl) {
    super(sourceName, baseUrl);
    this.feedUrl = feedUrl;
  }

  async scrape() {
    logger.info(`Starting RSS feed scrape for ${this.sourceName}...`);
    
    try {
      const response = await this.fetchHTML(this.feedUrl);
      if (!response) {
        logger.error(`Failed to fetch RSS feed from ${this.feedUrl}`);
        return { success: false, eventCount: 0 };
      }

      let parsedFeed;
      try {
        parsedFeed = await parser.parseStringPromise(response);
      } catch (parseError) {
        logger.error(`XML parsing error for ${this.sourceName}: ${parseError.message}`);
        
        const preprocessed = response.replace(/&(?!(?:amp|lt|gt|quot|apos|nbsp);)/g, '&amp;');
        try {
          parsedFeed = await parser.parseStringPromise(preprocessed);
        } catch (retryError) {
          logger.error(`Retry parsing failed for ${this.sourceName}: ${retryError.message}`);
          return { success: false, eventCount: 0, error: retryError.message };
        }
      }
      
      const items = parsedFeed.rss?.channel?.[0]?.item || [];

      const activeEventUrls = [];
      
      for (const item of items) {
        try {
          const eventData = this.extractEventData(item);
          if (eventData && eventData.title) {
            const normalizedEvent = this.normalizeEventData(eventData);
            await this.saveEvent(normalizedEvent);
            activeEventUrls.push(normalizedEvent.source.eventUrl);
          }
        } catch (error) {
          logger.error(`Error processing RSS item: ${error.message}`);
        }
      }

      await this.markInactiveEvents(activeEventUrls);
      
      logger.info(`${this.sourceName} RSS scrape complete. Processed ${activeEventUrls.length} events.`);
      return { success: true, eventCount: activeEventUrls.length };
    } catch (error) {
      logger.error(`Error parsing RSS feed: ${error.message}`);
      return { success: false, eventCount: 0 };
    }
  }

  extractEventData(rssItem) {
    const title = rssItem.title?.[0] || '';
    const eventUrl = rssItem.link?.[0] || '';
    const description = rssItem.description?.[0] || '';
    const pubDate = rssItem.pubDate?.[0] || '';
    const categories = rssItem.category || [];
    
    const imageUrlMatch = description.match(/src=["']([^"']+\.(jpg|jpeg|png|webp))["']/i);
    const imageUrl = imageUrlMatch ? imageUrlMatch[1] : (rssItem['media:thumbnail']?.[0]?.$.url || rssItem.enclosure?.[0]?.$.url || '');
    
    const dateTime = this.parseDateTime(pubDate);
    
    const venueMatch = description.match(/(?:venue|location|where)[:\s]+([^.]+)/i);
    const venueName = venueMatch ? venueMatch[1].trim() : '';
    
    const categoryArray = Array.isArray(categories) 
      ? categories.map(c => typeof c === 'string' ? c : (c._ || c))
      : [categories];

    return {
      title: this.cleanText(title),
      description: this.stripHTML(description),
      dateTime,
      eventUrl,
      imageUrl: imageUrl || null,
      venueName,
      venueAddress: '',
      category: categoryArray.filter(Boolean),
      price: null,
      rawData: rssItem
    };
  }

  stripHTML(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
      .substring(0, 500);
  }
}

module.exports = RSSFeedScraper;
