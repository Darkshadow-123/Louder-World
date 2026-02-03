const BaseScraper = require('./BaseScraper');
const logger = require('../../utils/logger');

class EventbriteScraper extends BaseScraper {
  constructor() {
    super('Eventbrite', 'https://www.eventbrite.com.au');
  }

  async scrape() {
    logger.info('Starting Eventbrite scrape for Sydney events...');
    
    const urls = [
      'https://www.eventbrite.com.au/d/au--sydney/events/',
      'https://www.eventbrite.com.au/d/au--sydney/events/?page=2',
      'https://www.eventbrite.com.au/d/au--sydney/music/',
      'https://www.eventbrite.com.au/d/au--sydney/arts/'
    ];

    const activeEventUrls = [];

    for (const url of urls) {
      try {
        await this.scrapePage(url, activeEventUrls);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Error scraping ${url}: ${error.message}`);
      }
    }

    await this.markInactiveEvents(activeEventUrls);
    
    logger.info(`Eventbrite scrape complete. Processed ${activeEventUrls.length} events.`);
    return { success: true, eventCount: activeEventUrls.length };
  }

  async scrapePage(url, activeEventUrls) {
    const html = await this.fetchWithPuppeteer(url, {
      waitForSelector: '.event-card'
    });

    if (!html) {
      logger.warn(`No HTML received for ${url}`);
      return;
    }

    const $ = require('cheerio').load(html);

    $('.event-card, [data-testid="event-card"]').each((index, element) => {
      try {
        const eventData = this.extractEventData($(element));
        if (eventData && eventData.title && eventData.eventUrl) {
          const normalizedEvent = this.normalizeEventData(eventData);
          this.saveEvent(normalizedEvent);
          activeEventUrls.push(normalizedEvent.source.eventUrl);
        }
      } catch (error) {
        logger.error(`Error extracting event data: ${error.message}`);
      }
    });
  }

  extractEventData($element) {
    const $ = require('cheerio');
    const elementText = $element.text();
    
    const title = $element.find('[data-testid="event-card-title"], .event-card__title, h3, h2').first().text().trim();
    const eventUrl = $element.find('a').first().attr('href');
    const imageUrl = $element.find('img').first().attr('src') || $element.find('img').first().attr('data-src');
    
    let dateTimeText = $element.find('[data-testid="event-card-date"], .event-card__date, .date, .event-date, [class*="date"], [class*="time"], time').first().text().trim();
    
    if (!dateTimeText) {
      const dateSelectors = ['[datetime]', '.event-card__time', '.event-time', '.time-badge', '[class*="date"]', '[class*="time"]', '.text-tag'];
      for (const selector of dateSelectors) {
        const found = $element.find(selector).first();
        if (found.length && found.text().trim().length > 0) {
          dateTimeText = found.text().trim();
          break;
        }
      }
    }
    
    const venueText = $element.find('[data-testid="event-card-venue"], .event-card__venue, .venue, [class*="venue"], [class*="location"], .address').first().text().trim();
    const priceText = $element.find('[data-testid="event-card-price"], .event-card__price, .price, [class*="price"], [class*="cost"]').first().text().trim();
    const categoryText = $element.find('[data-testid="event-card-category"], .event-card__category, .category, [class*="category"], [class*="tag"]').first().text().trim();

    const description = $element.find('[data-testid="event-card-description"], .event-card__description, .description, p').first().text().trim();

    if (!title || !eventUrl) {
      logger.debug(`Skipping element - Title: "${title}", URL: "${eventUrl}"`);
      return null;
    }

    const fullEventUrl = eventUrl.startsWith('http') ? eventUrl : `https://www.eventbrite.com.au${eventUrl}`;
    const fullImageUrl = imageUrl && imageUrl.startsWith('http') ? imageUrl : null;

    const dateTime = this.parseEventbriteDateTime(dateTimeText);
    
    if (!dateTime) {
      logger.debug(`No dateTime parsed for "${title}". dateTimeText: "${dateTimeText}"`);
    }
    
    const venueParts = venueText.split('·').map(p => p.trim()).filter(p => p);
    const venueName = venueParts[0] || '';
    const venueAddress = venueParts.slice(1).join(', ') || '';

    const price = this.parsePrice(priceText);

    return {
      title,
      description,
      dateTime,
      eventUrl: fullEventUrl,
      imageUrl: fullImageUrl,
      venueName,
      venueAddress,
      price,
      category: categoryText ? [categoryText] : [],
      rawData: { dateTimeText, venueText, priceText }
    };
  }

  parseEventbriteDateTime(dateTimeText) {
    if (!dateTimeText || dateTimeText.length < 5) return null;

    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    try {
      const parts = dateTimeText.match(/(\w{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})\s*(\d{1,2}:\d{2}\s*(?:AM|PM|\u200BAM|\u200BPM))?/i);
      
      if (parts) {
        const [, month, day, year, time] = parts;
        const monthNum = months[month] ?? 0;
        const date = new Date(parseInt(year), monthNum, parseInt(day));
        
        if (time) {
          const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const meridiem = timeMatch[3].toUpperCase();
            
            if (meridiem === 'PM' && hours !== 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
            
            date.setHours(hours, minutes, 0, 0);
          }
        }
        
        return date;
      }
      
      const parsedDate = new Date(dateTimeText);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() >= 2020 && parsedDate.getFullYear() <= 2030) {
        return parsedDate;
      }
      
      return null;
    } catch (error) {
      logger.warn(`Error parsing date time: ${dateTimeText} - ${error.message}`);
      return null;
    }
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

module.exports = EventbriteScraper;
