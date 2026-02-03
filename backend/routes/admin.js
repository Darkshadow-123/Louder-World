const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const scraperRunner = require('../services/scraperRunner');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/status', protect, authorize('admin'), (req, res) => {
  const status = scraperRunner.getScraperStatus();
  res.json({
    success: true,
    status
  });
});

router.post('/run', protect, authorize('admin'), async (req, res) => {
  try {
    const { scraper } = req.body;

    if (scraper) {
      const result = await scraperRunner.runSingleScraper(scraper);
      res.json({
        success: true,
        result
      });
    } else {
      const result = await scraperRunner.runAll();
      res.json({
        success: true,
        result
      });
    }
  } catch (error) {
    logger.error(`Error running scraper: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error running scraper' 
    });
  }
});

router.post('/cleanup', protect, authorize('admin'), async (req, res) => {
  try {
    await scraperRunner.cleanupOldEvents();
    await scraperRunner.updateEventStatuses();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    logger.error(`Error during cleanup: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error during cleanup' 
    });
  }
});

module.exports = router;
