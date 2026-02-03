const BaseScraper = require('./BaseScraper');
const logger = require('../../utils/logger');

class SydneyTodayScraper extends BaseScraper {
  constructor() {
    super('Sydney Today', 'https://www.sydneytoday.com');
  }

  async scrape() {
    logger.info('Starting Sydney Today scrape...');
    
    const urls = [
      'https://www.sydneytoday.com/events',
      'https://www.sydneytoday.com/whats-on'
    ];

    const activeEventUrls = [];

    for (const url of urls) {
      try {
        const html = await this.fetchHTML(url);
        if (!html) continue;

        const $ = require('cheerio').load(html);
        
        $('.event-item, .event-card, article').each((index, element) => {
          try {
            const eventData = this.extractEventData($(element));
            if (eventData && eventData.title) {
              const normalizedEvent = this.normalizeEventData(eventData);
              this.saveEvent(normalizedEvent);
              activeEventUrls.push(normalizedEvent.source.eventUrl);
            }
          } catch (error) {
            logger.error(`Error extracting event: ${error.message}`);
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error scraping ${url}: ${error.message}`);
      }
    }

    await this.markInactiveEvents(activeEventUrls);
    
    logger.info(`Sydney Today scrape complete. Processed ${activeEventUrls.length} events.`);
    return { success: true, eventCount: activeEventUrls.length };
  }

  extractEventData($element) {
    const $ = require('cheerio');
    
    const title = $element.find('h2, h3, .event-title, .title').first().text().trim();
    const eventUrl = $element.find('a').first().attr('href');
    const imageUrl = $element.find('img').first().attr('src') || $element.find('img').first().attr('data-src');
    const dateTimeText = $element.find('.event-date, .date, .time').first().text().trim();
    const venueText = $element.find('.event-venue, .venue, .location').first().text().trim();
    const description = $element.find('.event-description, .description, p').first().text().trim();
    const priceText = $element.find('.event-price, .price').first().text().trim();

    if (!title) return null;

    const fullEventUrl = eventUrl ? (eventUrl.startsWith('http') ? eventUrl : `${this.baseUrl}${eventUrl}`) : `${this.baseUrl}/event/${Date.now()}`;
    const fullImageUrl = imageUrl && imageUrl.startsWith('http') ? imageUrl : null;

    const dateTime = this.parseDateTime(dateTimeText);
    const price = this.parsePrice(priceText);
    const venueParts = venueText.split(',').map(p => p.trim()).filter(p => p);
    
    return {
      title,
      description,
      dateTime,
      eventUrl: fullEventUrl,
      imageUrl: fullImageUrl,
      venueName: venueParts[0] || '',
      venueAddress: venueParts.slice(1).join(', ') || '',
      price,
      rawData: { dateTimeText, venueText, priceText }
    };
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    const price = priceText.replace(/[^0-9.]/g, '');
    const numPrice = parseFloat(price);
    
    if (priceText.toLowerCase().includes('free')) {
      return { isFree: true, currency: 'AUD' };
    }
    
    if (!isNaN(numPrice)) {
      return { min: numPrice, max: numPrice, currency: 'AUD' };
    }
    
    return null;
  }
}

module.exports = SydneyTodayScraper;
