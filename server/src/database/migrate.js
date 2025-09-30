const fs = require('fs').promises;
const path = require('path');
require('../../loadEnv');
const { query, transaction } = require('./connection');
const { logger } = require('../utils/logger');

/**
 * Database Migration Runner
 * Handles database schema migrations with improved error handling
 */
class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, '..', '..', 'migrations');
    this.migrationsTable = 'schema_migrations';
  }

  /**
   * Initialize migrations table if it doesn't exist
   */
  async initializeMigrationsTable() {
    try {
      // First, check if table exists and get its structure
      const checkTableSQL = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `;
      
      const checkResult = await query(checkTableSQL, [this.migrationsTable]);
      
      // Check if table exists by looking at the result
      if (checkResult.error || !checkResult.data || checkResult.data.length === 0) {
        // Table doesn't exist, create it
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
            id SERIAL PRIMARY KEY,
            version VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64),
            execution_time_ms INTEGER
          )
        `;

        const result = await query(createTableSQL);
        
        if (result.error) {
          throw new Error(`Failed to create migrations table: ${result.error}`);
        }

        logger.info('Migrations table created');
        return true;
      }

      // Table exists, check if it has all required columns
      const existingColumns = checkResult.data.map(col => col.column_name);
      const requiredColumns = ['id', 'version', 'name', 'applied_at', 'checksum', 'execution_time_ms'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        logger.info('Migrations table exists but missing columns, adding them', { missingColumns });
        
        // Add missing columns
        for (const column of missingColumns) {
          let alterSQL;
          switch (column) {
            case 'applied_at':
              alterSQL = `ALTER TABLE ${this.migrationsTable} ADD COLUMN applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
              break;
            case 'checksum':
              alterSQL = `ALTER TABLE ${this.migrationsTable} ADD COLUMN checksum VARCHAR(64)`;
              break;
            case 'execution_time_ms':
              alterSQL = `ALTER TABLE ${this.migrationsTable} ADD COLUMN execution_time_ms INTEGER`;
              break;
            default:
              logger.warn('Unknown missing column, skipping', { column });
              continue;
          }
          
          const alterResult = await query(alterSQL);
          if (alterResult.error) {
            logger.warn(`Failed to add column ${column}:`, alterResult.error);
          } else {
            logger.info(`Added column ${column} to migrations table`);
          }
        }
      }

      logger.info('Migrations table initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize migrations table:', error);
      throw error;
    }
  }

  /**
   * Get list of migration files
   */
  async getMigrationFiles() {
    try {
      // Check if migrations directory exists
      try {
        await fs.access(this.migrationsPath);
      } catch (error) {
        // Directory doesn't exist, create it and return empty array
        logger.info('Migrations directory does not exist, creating it');
        await fs.mkdir(this.migrationsPath, { recursive: true });
        return [];
      }

      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort((a, b) => {
          // Extract numeric prefix from filenames for proper sorting
          const aPrefix = parseInt(a.split('_')[0]) || 0;
          const bPrefix = parseInt(b.split('_')[0]) || 0;
          return aPrefix - bPrefix;
        })
        .map(file => ({
          filename: file,
          path: path.join(this.migrationsPath, file),
          version: file.split('_')[0]
        }));
    } catch (error) {
      logger.error('Failed to read migration files:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations() {
    try {
      const sql = `SELECT version, name, applied_at FROM ${this.migrationsTable} ORDER BY version`;
      const result = await query(sql);
      
      if (result.error) {
        throw new Error(`Failed to get applied migrations: ${result.error}`);
      }

      return result.data || [];
    } catch (error) {
      logger.error('Failed to get applied migrations:', error);
      throw error;
    }
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath) {
    try {
      const crypto = require('crypto');
      const content = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      logger.error('Failed to calculate checksum:', error);
      throw error;
    }
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migrationFile) {
    const startTime = Date.now();
    
    try {
      logger.info(`Applying migration: ${migrationFile.filename}`);

      // Read migration file
      const migrationSQL = await fs.readFile(migrationFile.path, 'utf8');
      
      if (!migrationSQL.trim()) {
        logger.warn(`Migration file is empty: ${migrationFile.filename}`);
        return { success: true, skipped: true };
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(migrationFile.path);

      // Apply migration in transaction
      const result = await transaction(async (client) => {
        // Execute migration SQL
        const migrationResult = await client.query(migrationSQL);
        
        if (migrationResult.error) {
          throw new Error(`Migration SQL failed: ${migrationResult.error}`);
        }

        // Record migration in migrations table
        const recordSQL = `
          INSERT INTO ${this.migrationsTable} (version, name, checksum, execution_time_ms)
          VALUES ($1, $2, $3, $4)
        `;
        
        const executionTime = Date.now() - startTime;
        const recordResult = await client.query(recordSQL, [
          migrationFile.version,
          migrationFile.filename,
          checksum,
          executionTime
        ]);

        if (recordResult.error) {
          throw new Error(`Failed to record migration: ${recordResult.error}`);
        }

        return migrationResult;
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const executionTime = Date.now() - startTime;
      logger.info(`Migration applied successfully: ${migrationFile.filename} (${executionTime}ms)`);
      
      return { 
        success: true, 
        executionTime,
        rowCount: result.data?.rowCount || 0
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Migration failed: ${migrationFile.filename} (${executionTime}ms)`, error);
      
      return { 
        success: false, 
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    try {
      logger.info('Starting database migrations...');

      // Initialize migrations table
      await this.initializeMigrationsTable();

      // Get migration files and applied migrations
      const [migrationFiles, appliedMigrations] = await Promise.all([
        this.getMigrationFiles(),
        this.getAppliedMigrations()
      ]);

      if (migrationFiles.length === 0) {
        logger.info('No migration files found');
        return { success: true, applied: 0, total: 0 };
      }

      // Find pending migrations
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = migrationFiles.filter(m => !appliedVersions.has(m.version));

      if (pendingMigrations.length === 0) {
        logger.info('All migrations are up to date');
        return { success: true, applied: 0, total: migrationFiles.length };
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      // Apply migrations sequentially
      const results = [];
      let successCount = 0;

      for (const migration of pendingMigrations) {
        const result = await this.applyMigration(migration);
        results.push({
          filename: migration.filename,
          version: migration.version,
          ...result
        });

        if (result.success) {
          successCount++;
        } else {
          // Stop on first failure
          logger.error(`Migration failed, stopping: ${migration.filename}`);
          break;
        }
      }

      const summary = {
        success: successCount === pendingMigrations.length,
        applied: successCount,
        total: migrationFiles.length,
        pending: pendingMigrations.length,
        results
      };

      if (summary.success) {
        logger.info(`Migrations completed successfully: ${successCount}/${pendingMigrations.length} applied`);
      } else {
        logger.error(`Migrations failed: ${successCount}/${pendingMigrations.length} applied`);
      }

      return summary;

    } catch (error) {
      logger.error('Migration runner failed:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLastMigration() {
    try {
      logger.info('Rolling back last migration...');

      // Get last applied migration
      const sql = `
        SELECT version, name FROM ${this.migrationsTable} 
        ORDER BY applied_at DESC 
        LIMIT 1
      `;
      
      const result = await query(sql);
      
      if (result.error) {
        throw new Error(`Failed to get last migration: ${result.error}`);
      }

      if (!result.data || result.data.length === 0) {
        logger.info('No migrations to rollback');
        return { success: true, rolledBack: null };
      }

      const lastMigration = result.data[0];
      logger.info(`Rolling back: ${lastMigration.name}`);

      // Note: This is a simplified rollback - in production you'd want
      // to store rollback SQL in migration files
      const rollbackResult = await transaction(async (client) => {
        // Remove migration record
        const deleteSQL = `DELETE FROM ${this.migrationsTable} WHERE version = $1`;
        await client.query(deleteSQL, [lastMigration.version]);
        
        return { success: true };
      });

      if (rollbackResult.error) {
        throw new Error(rollbackResult.error);
      }

      logger.info(`Rollback completed: ${lastMigration.name}`);
      return { success: true, rolledBack: lastMigration };

    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      const [migrationFiles, appliedMigrations] = await Promise.all([
        this.getMigrationFiles(),
        this.getAppliedMigrations()
      ]);

      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = migrationFiles.filter(m => !appliedVersions.has(m.version));

      return {
        total: migrationFiles.length,
        applied: appliedMigrations.length,
        pending: pendingMigrations.length,
        migrations: migrationFiles.map(file => ({
          filename: file.filename,
          version: file.version,
          applied: appliedVersions.has(file.version),
          appliedAt: appliedMigrations.find(m => m.version === file.version)?.applied_at
        }))
      };
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  
  runner.runMigrations()
    .then((summary) => {
      logger.info('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migrations failed:', error);
      process.exit(1);
    });
}
