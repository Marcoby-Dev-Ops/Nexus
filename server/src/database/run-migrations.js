#!/usr/bin/env node
/* Run pending DB migrations using MigrationRunner */
const MigrationRunner = require('./migrate');
const { logger } = require('../utils/logger');

(async () => {
  try {
    const runner = new MigrationRunner();
    const statusBefore = await runner.getMigrationStatus();
    logger.info('Migration status before applying:', statusBefore);

    const result = await runner.runMigrations();
    logger.info('Migration run result:', result);

    if (result && result.success) {
      console.log('Migrations applied successfully');
      process.exit(0);
    } else {
      console.error('Migrations completed with errors', result);
      process.exit(2);
    }
  } catch (error) {
    logger.error('Migration runner error:', error);
    console.error('Migration runner error:', error.message || error);
    process.exit(1);
  }
})();
