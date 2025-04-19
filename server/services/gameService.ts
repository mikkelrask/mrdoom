import path from 'path';
import os from 'os';
import { storage } from '../storage';
import { fileService } from './fileService';
import { IMod, IModFile } from '@shared/schema';

// Service to handle game-related operations
export class GameService {
  // Base config directory (usually in user's home directory)
  private getConfigDir(): string {
    return path.join(os.homedir(), '.config', 'mrdoom');
  }

  // Mod config file path
  private getModConfigPath(modId: number): string {
    return path.join(this.getConfigDir(), 'mods', `${modId}.json`);
  }

  // Get a list of all mods
  async getAllMods(): Promise<IMod[]> {
    return storage.getMods();
  }

  // Get mods filtered by Doom version
  async getModsByDoomVersion(versionSlug: string): Promise<IMod[]> {
    const version = await storage.getDoomVersionBySlug(versionSlug);
    if (!version) return [];
    
    return storage.getModsByDoomVersion(version.id);
  }

  // Get a single mod by ID
  async getMod(id: number): Promise<IMod | undefined> {
    return storage.getMod(id);
  }

  // Get mod files for a specific mod
  async getModFiles(modId: number): Promise<IModFile[]> {
    return storage.getModFiles(modId);
  }

  // Save a mod configuration
  async saveMod(mod: IMod, files: IModFile[]): Promise<IMod | undefined> {
    // Save to in-memory storage first
    let savedMod: IMod | undefined;
    
    if (mod.id) {
      savedMod = await storage.updateMod(mod.id, mod);
    } else {
      savedMod = await storage.createMod(mod);
    }
    
    if (!savedMod) return undefined;
    
    // Process files (delete existing ones and add new ones)
    const existingFiles = await storage.getModFiles(savedMod.id);
    
    // Delete existing files
    for (const file of existingFiles) {
      await storage.deleteModFile(file.id);
    }
    
    // Add new files
    for (const file of files) {
      await storage.createModFile({
        ...file,
        modId: savedMod.id
      });
    }
    
    // Save mod config to file system for persistence
    await this.saveModToConfig(savedMod);
    
    return savedMod;
  }

  // Delete a mod
  async deleteMod(id: number): Promise<boolean> {
    // Delete files first
    const files = await storage.getModFiles(id);
    for (const file of files) {
      await storage.deleteModFile(file.id);
    }
    
    // Delete mod
    const success = await storage.deleteMod(id);
    
    // Delete config file
    if (success) {
      await fileService.deleteFile(this.getModConfigPath(id));
    }
    
    return success;
  }

  // Save mod config to file system
  private async saveModToConfig(mod: IMod): Promise<boolean> {
    const files = await storage.getModFiles(mod.id);
    const config = {
      mod,
      files
    };
    
    return fileService.writeFile(
      this.getModConfigPath(mod.id),
      JSON.stringify(config, null, 2)
    );
  }

  // Load mods from file system on startup
  async loadModsFromConfig(): Promise<void> {
    const configDir = path.join(this.getConfigDir(), 'mods');
    const files = await fileService.readDirectory(configDir);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(configDir, file);
      const content = await fileService.readFile(filePath);
      
      if (content) {
        try {
          const config = JSON.parse(content);
          const { mod, files } = config;
          
          // Add to storage
          const savedMod = await storage.createMod(mod);
          
          for (const file of files) {
            await storage.createModFile({
              ...file,
              modId: savedMod.id
            });
          }
        } catch (error) {
          console.error(`Error loading mod config from ${filePath}:`, error);
        }
      }
    }
  }

  // Launch a mod
  async launchMod(id: number): Promise<boolean> {
    const mod = await storage.getMod(id);
    if (!mod) return false;
    
    const version = await storage.getDoomVersion(mod.doomVersionId);
    if (!version) return false;
    
    const files = await storage.getModFiles(id);
    
    // Build launch parameters
    const baseArgs = version.args?.split(' ') || [];
    let customArgs: string[] = [];
    
    if (mod.launchParameters) {
      customArgs = mod.launchParameters.split(' ');
    }
    
    // Add mod files in order
    const fileArgs: string[] = [];
    if (files.length > 0) {
      fileArgs.push('-file');
      files.sort((a, b) => a.loadOrder - b.loadOrder)
        .forEach(file => {
          // Ensure we're using the full path to the mod file
          const fullPath = path.resolve(file.filePath);
          fileArgs.push(fullPath);
        });
    }
    
    // Add save directory if specified
    const saveArgs: string[] = [];
    if (mod.saveDirectory) {
      saveArgs.push('-savedir', mod.saveDirectory);
    }
    
    // Combine all args
    const args = [...baseArgs, ...fileArgs, ...saveArgs, ...customArgs];
    
    // Launch the game
    return fileService.launchGame(version.executable, args);
  }
}

export const gameService = new GameService();
