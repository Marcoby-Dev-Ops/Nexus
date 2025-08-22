# PowerShell script to remove outdated migrations that reference old Supabase auth architecture
# These migrations are not compatible with the current Authentik setup

Write-Host "Cleaning up outdated migrations that reference old Supabase auth architecture..."

# List of migrations to remove (they reference auth.users or have incorrect foreign keys)
$migrationsToRemove = @(
    "014_fix_user_profiles.sql",                    # References auth.users
    "017_remove_redundant_users_table.sql",         # References auth.users  
    "020_create_user_onboarding_phases.sql"         # Incorrect foreign key reference
)

# Remove the outdated migrations
foreach ($migration in $migrationsToRemove) {
    if (Test-Path $migration) {
        Write-Host "Removing outdated migration: $migration"
        Remove-Item $migration -Force
    } else {
        Write-Host "Migration not found: $migration"
    }
}

# Also remove the rename script since we're cleaning up
if (Test-Path "rename_migrations.ps1") {
    Write-Host "Removing rename script"
    Remove-Item "rename_migrations.ps1" -Force
}

Write-Host "Cleanup completed!"
Write-Host ""
Write-Host "Remaining migrations that should work with current architecture:"
Get-ChildItem "*.sql" | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name)" }
