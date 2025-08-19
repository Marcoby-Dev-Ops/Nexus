import fs from 'fs';
import path from 'path';

const migrationsDir = './server/migrations';

function analyzeMigrations() {
  console.log('🔍 Analyzing migration conflicts...\n');
  
  const files = fs.readdirSync(migrationsDir);
  const migrations = files
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (match) {
        return {
          number: parseInt(match[1]),
          name: match[2],
          filename: file,
          fullPath: path.join(migrationsDir, file)
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);

  // Find duplicates
  const duplicates = {};
  migrations.forEach(migration => {
    if (!duplicates[migration.number]) {
      duplicates[migration.number] = [];
    }
    duplicates[migration.number].push(migration);
  });

  console.log('📊 Migration Analysis:');
  console.log(`Total migrations: ${migrations.length}`);
  console.log(`Unique numbers: ${Object.keys(duplicates).length}`);
  
  // Show duplicates
  const duplicateNumbers = Object.keys(duplicates).filter(num => duplicates[num].length > 1);
  if (duplicateNumbers.length > 0) {
    console.log('\n🚨 DUPLICATE MIGRATION NUMBERS:');
    duplicateNumbers.forEach(num => {
      console.log(`\nMigration ${num}:`);
      duplicates[num].forEach(migration => {
        console.log(`  - ${migration.filename}`);
      });
    });
  }

  // Show ensure_user_profile migrations
  const ensureUserProfileMigrations = migrations.filter(m => 
    m.name.toLowerCase().includes('ensure_user_profile')
  );
  
  if (ensureUserProfileMigrations.length > 0) {
    console.log('\n🔄 ENSURE_USER_PROFILE MIGRATIONS:');
    ensureUserProfileMigrations.forEach(migration => {
      console.log(`  - ${migration.filename}`);
    });
  }

  // Show disabled migrations
  const disabledMigrations = files.filter(file => file.includes('.disabled'));
  if (disabledMigrations.length > 0) {
    console.log('\n❌ DISABLED MIGRATIONS:');
    disabledMigrations.forEach(file => {
      console.log(`  - ${file}`);
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Keep only migration 058_consolidate_user_profile_system.sql');
  console.log('2. Delete all other ensure_user_profile migrations (020-057)');
  console.log('3. Delete all .disabled files');
  console.log('4. Delete duplicate numbered migrations');
  console.log('5. Consider squashing all migrations into a few clean ones');

  return {
    migrations,
    duplicates,
    ensureUserProfileMigrations,
    disabledMigrations
  };
}

function generateCleanupScript(analysis) {
  console.log('\n🧹 GENERATING CLEANUP SCRIPT...\n');
  
  const toDelete = [];
  
  // Add ensure_user_profile migrations (except 058)
  analysis.ensureUserProfileMigrations.forEach(migration => {
    if (migration.number !== 58) {
      toDelete.push(migration.filename);
    }
  });
  
  // Add disabled migrations
  analysis.disabledMigrations.forEach(file => {
    toDelete.push(file);
  });
  
  // Add duplicate migrations (keep the latest)
  Object.keys(analysis.duplicates).forEach(num => {
    const migrations = analysis.duplicates[num];
    if (migrations.length > 1) {
      // Keep the one with the most recent timestamp or the one that's not disabled
      const toKeep = migrations.find(m => !m.filename.includes('.disabled')) || migrations[migrations.length - 1];
      migrations.forEach(migration => {
        if (migration.filename !== toKeep.filename) {
          toDelete.push(migration.filename);
        }
      });
    }
  });

  console.log('Files to delete:');
  toDelete.forEach(file => {
    console.log(`  rm "${path.join(migrationsDir, file)}"`);
  });

  return toDelete;
}

// Run analysis
const analysis = analyzeMigrations();
const toDelete = generateCleanupScript(analysis);

console.log(`\n📈 SUMMARY:`);
console.log(`- Total migrations: ${analysis.migrations.length}`);
console.log(`- Files to delete: ${toDelete.length}`);
console.log(`- Remaining migrations: ${analysis.migrations.length - toDelete.length}`);
