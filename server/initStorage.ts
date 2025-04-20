import { storage } from './storage';

/**
 * Simple script to initialize storage and create default game versions if none exist
 * Run with: bun run server/initStorage.ts
 */
async function initStorage(): Promise<void> {
  console.log('Initializing storage...');
  
  // Give storage time to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get current versions
  const versions = await storage.getDoomVersions();
  console.log(`Found ${versions.length} existing doom versions`);
  
  // If no versions exist, create default ones
  if (versions.length === 0) {
    console.log('No doom versions found. Creating defaults...');
    
    const defaultVersions = [
      {
        name: 'Doom',
        slug: 'doom',
        icon: 'doom.png',
        executable: 'chocolate-doom.exe',
        args: '-iwad doom.wad'
      },
      {
        name: 'Doom II',
        slug: 'doom2',
        icon: 'doom2.png',
        executable: 'gzdoom.exe',
        args: '-iwad doom2.wad'
      },
      {
        name: 'Heretic',
        slug: 'heretic',
        icon: 'heretic.png',
        executable: 'chocolate-heretic.exe',
        args: '-iwad heretic.wad'
      }
    ];
    
    for (const version of defaultVersions) {
      try {
        const newVersion = await storage.createDoomVersion(version);
        console.log(`Created doom version: ${newVersion.name} (ID: ${newVersion.id})`);
      } catch (err) {
        console.error(`Failed to create version ${version.name}:`, err);
      }
    }
    
    // Verify versions were created
    const updatedVersions = await storage.getDoomVersions();
    console.log(`Now have ${updatedVersions.length} doom versions`);
  }
  
  console.log('Listing all doom versions:');
  const allVersions = await storage.getDoomVersions();
  allVersions.forEach(version => {
    console.log(`- ${version.name} (ID: ${version.id}, slug: ${version.slug})`);
  });
  
  console.log('Storage initialization complete.');
}

// Run the initialization
initStorage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed to initialize storage:', err);
    process.exit(1);
  });