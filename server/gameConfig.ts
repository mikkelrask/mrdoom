import fs from 'fs/promises';
import path from 'path';
import { IDoomVersion, IMod, IModFile } from '../shared/schema';
import { storage } from './storage';

// Safely import electron
let electronApp: any = null;
try {
  const electron = require('electron');
  electronApp = electron.app;
} catch (error) {
  console.log('Electron not available in gameConfig, using fallback paths');
}

function getDownloadsPath(): string {
  if (electronApp) {
    return electronApp.getPath('downloads');
  }
  return path.join(process.cwd(), 'downloads');
}

/**
 * Interface representing a complete game configuration that can be imported/exported
 */
interface GameConfig {
  doomVersion: IDoomVersion;
  mods: IMod[];
  modFiles: IModFile[];
}

/**
 * Exports a game's configuration to a JSON file that can be shared
 * @param doomVersionId The ID of the game to export
 * @param filePath Optional destination file path. If not provided, saves to Downloads folder.
 * @returns The path to the saved file
 */
export async function exportGameConfig(doomVersionId: number, filePath?: string): Promise<string> {
  // Get the game version
  const doomVersion = await storage.getDoomVersion(doomVersionId);
  if (!doomVersion) {
    throw new Error(`Game with ID ${doomVersionId} not found`);
  }
  
  // Get the mods for this game
  const mods = await storage.getModsByDoomVersion(doomVersionId);
  
  // Get all mod files for each mod
  let modFiles: IModFile[] = [];
  for (const mod of mods) {
    const files = await storage.getModFiles(mod.id);
    modFiles = modFiles.concat(files);
  }
  
  // Create the game config
  const gameConfig: GameConfig = {
    doomVersion: { ...doomVersion, id: 1 }, // Reset ID to 1 for portability
    mods: mods.map((mod, index) => ({ ...mod, id: index + 1, doomVersionId: 1 })), // Reset IDs
    modFiles: modFiles.map((file, index) => {
      // Find the index of the parent mod to update modId reference
      const parentMod = mods.find(m => m.id === file.modId);
      const parentModIndex = parentMod ? mods.indexOf(parentMod) : -1;
      
      return {
        ...file,
        id: index + 1,
        modId: parentModIndex !== -1 ? parentModIndex + 1 : 1
      };
    })
  };
  
  // Determine save path
  let savePath: string;
  if (filePath) {
    savePath = filePath;
  } else {
    const downloadsPath = getDownloadsPath();
    
    // Ensure downloads directory exists
    try {
      await fs.mkdir(downloadsPath, { recursive: true });
    } catch (err) {
      console.warn('Could not create downloads directory:', err);
    }
    
    const fileName = `${doomVersion.slug}_config.json`;
    savePath = path.join(downloadsPath, fileName);
  }
  
  // Save the file
  try {
    await fs.writeFile(
      savePath,
      JSON.stringify(gameConfig, null, 2)
    );
    
    return savePath;
  } catch (err) {
    console.error('Failed to export game config:', err);
    throw new Error(`Failed to export game config: ${err.message}`);
  }
}

/**
 * Imports a game configuration from a JSON file
 * @param filePath Path to the configuration file
 * @param mergeWithExisting If true and game version exists, will merge mods. Otherwise creates new game.
 * @returns The ID of the imported game version
 */
export async function importGameConfig(filePath: string, mergeWithExisting: boolean = false): Promise<number> {
  try {
    // Read and parse the file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const gameConfig = JSON.parse(fileContent) as GameConfig;
    
    let existingGame: IDoomVersion | undefined;
    
    // Check if we have this game version already
    if (mergeWithExisting) {
      existingGame = await storage.getDoomVersionBySlug(gameConfig.doomVersion.slug);
    }
    
    let doomVersionId: number;
    
    if (existingGame) {
      // Update existing game with any new properties
      const updatedGame = await storage.updateDoomVersion(
        existingGame.id, 
        gameConfig.doomVersion
      );
      doomVersionId = existingGame.id;
      
      // Import mods
      for (const mod of gameConfig.mods) {
        // Create new mod with reference to existing game
        const newMod = await storage.createMod({
          ...mod,
          doomVersionId: existingGame.id
        });
        
        // Import mod files
        const modFiles = gameConfig.modFiles.filter(f => f.modId === mod.id);
        for (const file of modFiles) {
          await storage.createModFile({
            ...file,
            modId: newMod.id
          });
        }
      }
    } else {
      // Create new game version
      const newGame = await storage.createDoomVersion(gameConfig.doomVersion);
      doomVersionId = newGame.id;
      
      // Import mods
      for (const mod of gameConfig.mods) {
        // Create new mod with reference to new game
        const newMod = await storage.createMod({
          ...mod,
          doomVersionId: newGame.id
        });
        
        // Import mod files
        const modFiles = gameConfig.modFiles.filter(f => f.modId === mod.id);
        for (const file of modFiles) {
          await storage.createModFile({
            ...file,
            modId: newMod.id
          });
        }
      }
    }
    
    return doomVersionId;
  } catch (err) {
    console.error('Failed to import game config:', err);
    throw new Error(`Failed to import game config: ${err.message}`);
  }
}