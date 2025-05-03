#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: bump-version.mjs <version> (e.g. 1.2.3)');
  process.exit(1);
}

const TAG = `v${version}`;
console.log(`🔧 Bumping to version ${version} (${TAG})...`);

// Helper to read/write JSON
const updateJSON = (filePath, updater) => {
  const abs = path.resolve(filePath);
  const content = JSON.parse(fs.readFileSync(abs, 'utf-8'));
  updater(content);
  fs.writeFileSync(abs, JSON.stringify(content, null, 2) + '\n');
};

// Update root package.json
updateJSON('package.json', json => {
  json.version = version;
});

// Update server package.json
updateJSON('server/server-package.json', json => {
  json.version = version;
});

// Update tauri.conf.json
updateJSON('src-tauri/tauri.conf.json', json => {
  json.version = version;
});

// Update Cargo.toml
const cargoPath = 'src-tauri/Cargo.toml';
const cargoContent = fs.readFileSync(cargoPath, 'utf-8');
const updatedCargo = cargoContent.replace(
  /^version\s*=\s*".*?"$/m,
  `version = "${version}"`
);
fs.writeFileSync(cargoPath, updatedCargo);

console.log('✅ Updated version fields');

// Commit & tag
execSync('git add package.json server/server-package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml');
execSync(`git commit -m "chore: bump version to v${version}"`);
execSync(`git tag ${TAG}`);
execSync(`git push origin main`);
execSync(`git push origin ${TAG}`);

console.log(`🚀 Version ${version} committed, tagged, and pushed.`);
