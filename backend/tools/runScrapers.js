#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const scraperRunner = require('../services/scraperRunner');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || process.env.DATABASE_URL;

async function main() {
  if (!MONGO_URI) {
    console.error('No MongoDB URI set in environment (MONGO_URI/DATABASE_URL)');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  logger.info('Connected to MongoDB for scraper run');

  try {
    const result = await scraperRunner.runAll();
    logger.info('Scraper run result:', result);
    console.log('Scraper run completed:', JSON.stringify(result, null, 2));
  } catch (err) {
    logger.error('Error running scrapers:', err.message || err);
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
