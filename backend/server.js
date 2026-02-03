require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const scraperRunner = require('./services/scraperRunner');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
    });

    if (process.env.NODE_ENV !== 'test') {
      scraperRunner.startScheduledScraping();
      
      setTimeout(async () => {
        logger.info('Running initial scrape...');
        await scraperRunner.runAll();
      }, 5000);
    }

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
