#!/usr/bin/env node
/**
 * migrate-structure.js (ESM Version - Improved Move Order)
 *
 * A Node.js CLI to reshape your `src/` tree into the ideal domain-driven layout,
 * updated for "type": "module" projects. Supports --dry-run (default) and --apply.
 *
 * Changes:
 *  - Moves existing domains BEFORE creating empty target dirs to avoid collisions
 *  - Merges contents if dest exists
 *
 * Install dependencies:
 *   npm install ts-morph fs-extra yargs chalk
 *
 * Usage:
 *   node scripts/migrate-structure.js --dry-run
 *   node scripts/migrate-structure.js --apply
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { Project } from 'ts-morph';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

// CLI setup
const argv = yargs(hideBin(process.argv))
  .option('apply', { type: 'boolean', description: 'Apply changes (without this flag, runs dry-run)' })
  .help()
  .parseSync();
const DRY_RUN = !argv.apply;

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC = path.resolve(__dirname, 'src');

// Desired structure
const STRUCTURE = [
  'app',
  'core',
  'shared',
  'domains/dashboard',
  'domains/workspace',
  'domains/marketplace',
  'domains/inbox',
  'domains/departments/sales',
  'domains/departments/finance',
  'domains/departments/operations',
  'domains/admin',
];

// Map existing top-level folders -> new domain paths
const MOVES = {
  dashboard: 'domains/dashboard',
  workspace: 'domains/workspace',
  marketplace: 'domains/marketplace',
  inbox: 'domains/inbox',
  departments: 'domains/departments', // contents subfolders already exist
  admin: 'domains/admin',
};

// Alias map for import rewriting
const ALIAS_MAP = {
  '@core/': 'src/core/',
  '@shared/': 'src/shared/',
  '@dashboard/': 'src/domains/dashboard/',
  '@workspace/': 'src/domains/workspace/',
  '@marketplace/': 'src/domains/marketplace/',
  '@inbox/': 'src/domains/inbox/',
  '@sales/': 'src/domains/departments/sales/',
  '@finance/': 'src/domains/departments/finance/',
  '@operations/': 'src/domains/departments/operations/',
  '@admin/': 'src/domains/admin/',
};

async function main() {
  console.log(chalk.blue(`\n🔄 ${DRY_RUN ? 'Dry-run' : 'Applying'} migration...`));

  // 1. Move existing domains (merge if dest exists)
  for (const [oldName, newRel] of Object.entries(MOVES)) {
    const srcDir = path.join(SRC, oldName);
    const destDir = path.join(SRC, newRel);
    if (await fs.pathExists(srcDir)) {
      if (!(await fs.pathExists(destDir))) {
        console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[>]'} Move ${srcDir} → ${destDir}`));
        if (!DRY_RUN) await fs.move(srcDir, destDir);
      } else {
        // If merging departments, recursively merge subfolders
        if (oldName === 'departments') {
          const subfolders = await fs.readdir(srcDir);
          for (const sub of subfolders) {
            const subSrc = path.join(srcDir, sub);
            const subDest = path.join(destDir, sub);
            if (await fs.pathExists(subDest)) {
              // Merge files from subSrc into subDest
              const files = await fs.readdir(subSrc);
              for (const file of files) {
                const fileSrc = path.join(subSrc, file);
                const fileDest = path.join(subDest, file);
                if (await fs.pathExists(fileDest)) {
                  console.log(chalk.red(`[!] Conflict: ${fileDest} already exists. Skipping.`));
                } else {
                  console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[>]'} Move ${fileSrc} → ${fileDest}`));
                  if (!DRY_RUN) await fs.move(fileSrc, fileDest);
                }
              }
              // Remove subSrc if empty
              if (!DRY_RUN && (await fs.readdir(subSrc)).length === 0) {
                await fs.rmdir(subSrc);
              }
            } else {
              console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[>]'} Move ${subSrc} → ${subDest}`));
              if (!DRY_RUN) await fs.move(subSrc, subDest);
            }
          }
          // Remove srcDir if empty
          if (!DRY_RUN && (await fs.readdir(srcDir)).length === 0) {
            await fs.rmdir(srcDir);
          }
        } else {
          console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[~]'} Merge ${srcDir} → ${destDir}`));
          if (!DRY_RUN) {
            const items = await fs.readdir(srcDir);
            for (const item of items) {
              const pSrc = path.join(srcDir, item);
              const pDest = path.join(destDir, item);
              if (await fs.pathExists(pDest)) {
                console.log(chalk.red(`[!] Conflict: ${pDest} already exists. Skipping.`));
              } else {
                console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[>]'} Move ${pSrc} → ${pDest}`));
                await fs.move(pSrc, pDest, { overwrite: false });
              }
            }
            await fs.remove(srcDir);
          }
        }
      }
    }
  }

  // 2. Create missing directories
  for (const rel of STRUCTURE) {
    const full = path.join(SRC, rel);
    if (!(await fs.pathExists(full))) {
      console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[+]'} Create ${full}`));
      if (!DRY_RUN) await fs.mkdirp(full);
    }
  }

  // 3. Clean up empty features folder
  const featDir = path.join(SRC, 'features');
  if (await fs.pathExists(featDir)) {
    const files = await fs.readdir(featDir);
    if (files.length === 0) {
      console.log(chalk.yellow(`${DRY_RUN ? '[ ]' : '[-]'} Remove empty ${featDir}`));
      if (!DRY_RUN) await fs.rmdir(featDir);
    } else {
      console.log(chalk.gray(`ℹ️  features/ not empty—skipping removal`));
    }
  }

  // 4. Rewrite imports via ts-morph
  console.log(chalk.blue(`\n🔧 Rewriting import aliases...`));
  const project = new Project({ tsConfigFilePath: path.join(__dirname, 'tsconfig.json') });
  for (const file of project.getSourceFiles()) {
    let updated = false;
    for (const dec of file.getImportDeclarations()) {
      const moduleSpec = dec.getModuleSpecifierValue();
      for (const [oldAlias, newPath] of Object.entries(ALIAS_MAP)) {
        if (moduleSpec.startsWith(oldAlias)) {
          const suffix = moduleSpec.slice(oldAlias.length);
          const newSpec = newPath + suffix;
          console.log(chalk.green(`${DRY_RUN ? '[ ]' : '[~]'} ${file.getFilePath()}: ${moduleSpec} → ${newSpec}`));
          if (!DRY_RUN) dec.setModuleSpecifier(newSpec);
          updated = true;
        }
      }
    }
    if (updated && !DRY_RUN) file.saveSync();
  }

  console.log(chalk.blue(`
✅ ${DRY_RUN ? 'Dry-run complete' : 'Migration complete'}!`));
  console.log(chalk.gray(`Run with --apply to persist changes.`));
}

main().catch((err) => {
  console.error(chalk.red('Migration failed:'), err);
  process.exit(1);
});
