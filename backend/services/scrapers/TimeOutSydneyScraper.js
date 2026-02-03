const BaseScraper = require('./BaseScraper');
const logger = require('../../utils/logger');

class TimeOutSydneyScraper extends BaseScraper {
  constructor() {
    super('Time Out Sydney', 'https://www.timeout.com');
  }

  async scrape() {
    logger.info('Starting Time Out Sydney scrape...');
    
    const urls = [
      'https://www.timeout.com/sydney/things-to-do',
      'https://www.timeout.com/sydney/music',
      'https://www.timeout.com/sydney/art',
      'https://www.timeout.com/sydney/theatre'
    ];

    const activeEventUrls = [];

    for (const url of urls) {
      try {
        const html = await this.fetchWithPuppeteer(url, {
          waitForSelector: '.card, article'
        });

        if (!html) continue;

        const $ = require('cheerio').load(html);
        
        $('.card, article, .event-item').each((index, element) => {
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

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Error scraping ${url}: ${error.message}`);
      }
    }

    await this.markInactiveEvents(activeEventUrls);
    
    logger.info(`Time Out Sydney scrape complete. Processed ${activeEventUrls.length} events.`);
    return { success: true, eventCount: activeEventUrls.length };
  }

  extractEventData($element) {
    const $ = require('cheerio');
    
    const title = $element.find('h3, h4, .card-title, .title').first().text().trim();
    const eventUrl = $element.find('a').first().attr('href');
    const imageUrl = $element.find('img').first().attr('src') || $element.find('img').first().attr('data-src');
    const dateTimeText = $element.find('.date, .time, .card-date, [datetime], time').first().text().trim();
    const venueText = $element.find('.location, .venue, .card-venue, .address').first().text().trim();
    const description = $element.find('.description, .card-description, p').first().text().trim();
    const categoryText = $element.find('.category, .tag, [class*="tag"]').first().text().trim();

    if (!title || title.length < 5) {
      return null;
    }

    const fullEventUrl = eventUrl ? (eventUrl.startsWith('http') ? eventUrl : `${this.baseUrl}${eventUrl}`) : `${this.baseUrl}/sydney/things-to-do`;
    const fullImageUrl = imageUrl && imageUrl.startsWith('http') ? imageUrl : null;

    const dateTime = this.parseTimeOutDateTime(dateTimeText);
    const venueParts = venueText.split(',').map(p => p.trim()).filter(p => p);
    
    if (!dateTime) {
      logger.debug(`No dateTime found for "${title}" from TimeOut Sydney. dateTimeText: "${dateTimeText}"`);
    }
    
    return {
      title,
      description,
      dateTime,
      eventUrl: fullEventUrl,
      imageUrl: fullImageUrl,
      venueName: venueParts[0] || '',
      venueAddress: venueParts.slice(1).join(', ') || '',
      category: categoryText ? [categoryText] : [],
      rawData: { dateTimeText, venueText, categoryText }
    };
  }

  parseTimeOutDateTime(dateTimeText) {
    if (!dateTimeText) return null;

    try {
      const dateMatch = dateTimeText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/i);
      
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const months = {
          'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
          'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
        };
        
        const monthNum = months[month.toLowerCase()];
        if (monthNum !== undefined) {
          return new Date(parseInt(year), monthNum, parseInt(day));
        }
      }
      
      return new Date(dateTimeText);
    } catch (error) {
      logger.warn(`Error parsing date: ${dateTimeText}`);
      return null;
    }
  }
}

module.exports = TimeOutSydneyScraper;
