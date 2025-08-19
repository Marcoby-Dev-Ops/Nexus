import fs from 'fs';
import path from 'path';

const migrationsDir = './server/migrations';

// Files to delete (from the analysis)
const filesToDelete = [
  // ensure_user_profile migrations (keep only 058)
  '006_fix_ensure_user_profile_function.sql',
  '007_fix_ensure_user_profile_with_mapping.sql',
  '019_fix_ensure_user_profile_table.sql',
  '020_fix_ensure_user_profile_auth_table.sql',
  '021_fix_ensure_user_profile_ambiguous_columns.sql',
  '022_fix_ensure_user_profile_final.sql',
  '024_update_ensure_user_profile_with_organization.sql',
  '042_fix_ensure_user_profile_type_mismatch.sql',
  '044_fix_ensure_user_profile_ambiguous_columns.sql',
  '046_fix_ensure_user_profile_type_comparison.sql',
  '049_fix_ensure_user_profile_final.sql',
  '050_fix_ensure_user_profile_ambiguous_columns_final.sql',
  '052_simplify_ensure_user_profile.sql',
  '053_fix_ensure_user_profile_no_users_view.sql',
  '054_fix_ensure_user_profile_text_version.sql',
  '055_fix_ensure_user_profile_ambiguous_columns.sql',
  '056_fix_ensure_user_profile_missing_id.sql',
  '057_remove_internal_user_id_dependencies.sql',
  
  // disabled migrations
  '003_create_narrative_dashboard_tables.sql.disabled',
  '023_ensure_default_organizations.sql.disabled',
  '039_refactor_to_authentik_user_ids.sql.disabled',
  '040_fix_functions_for_authentik_user_ids.sql.disabled',
  
  // duplicate migrations (keeping the better ones)
  '012_insert_data_point_definitions.sql',
  '020_fix_ensure_user_profile_auth_table.sql',
  '021_fix_onboarding_foreign_keys.sql',
  '022_create_datapoint_definitions_table.sql',
  '022_fix_ensure_user_profile_final.sql',
  '024_update_ensure_user_profile_with_organization.sql',
  '040_update_user_id_columns.sql'
];

function cleanupMigrations() {
  console.log('🧹 Starting migration cleanup...\n');
  
  let deletedCount = 0;
  let errorCount = 0;
  
  filesToDelete.forEach(filename => {
    const filePath = path.join(migrationsDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted: ${filename}`);
        deletedCount++;
      } else {
        console.log(`⚠️  Not found: ${filename}`);
      }
    } catch (error) {
      console.log(`❌ Error deleting ${filename}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`- Files deleted: ${deletedCount}`);
  console.log(`- Errors: ${errorCount}`);
  console.log(`- Files processed: ${filesToDelete.length}`);
  
  // Show remaining migrations
  const remainingFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`\n📁 Remaining migrations (${remainingFiles.length}):`);
  remainingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

// Execute cleanup
cleanupMigrations();
