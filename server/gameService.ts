import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { getSettings, getMod, getDoomVersion } from './storage';
import { fileService } from './services/fileService';
import { IModFile } from '@shared/schema';

// Define a local type for launch options
interface LaunchOptions {
  modId?: string | number;
  customArgs?: string;
  skill?: number;
  warp?: string;
}

// Unified launch function for mods/game instances
export async function launchGame(launchOptions: LaunchOptions) {
  try {
    console.log('Launching game with options:', launchOptions);
    // Get current settings
    const settings = await getSettings();
    const gzDoomPath = settings.gzDoomPath;
    if (!gzDoomPath) throw new Error('GZDoom path is not set. Please configure it in settings.');
    if (!fs.existsSync(gzDoomPath)) throw new Error(`GZDoom executable not found at path: ${gzDoomPath}`);

    const args: string[] = [];
    let files: IModFile[] = [];
    let doomVersionArgs: string[] = [];
    let saveDir: string | undefined = undefined;
    let customArgs: string[] = [];

    if (launchOptions.modId) {
      const modWithFiles = await getMod(launchOptions.modId.toString());
      const { files: modFiles, ...mod } = modWithFiles;
      files = modFiles || [];
      // Load Doom version args
      const doomVersionId = (mod as any).doomVersionId;
      if (doomVersionId !== undefined) {
        const doomVersion: any = await getDoomVersion(doomVersionId);
        if (doomVersion && typeof doomVersion.args === 'string') {
          doomVersionArgs = doomVersion.args.split(' ');
        }
      }
      // Save dir: prefer mod.saveDirectory, else settings.savegamesPath
      saveDir = (mod as any).saveDirectory || settings.savegamesPath;
      // Custom launch params from mod
      if ((mod as any).launchParameters) {
        customArgs = (mod as any).launchParameters.split(' ');
      }
    }

    // Add doom version args
    args.push(...doomVersionArgs);
    // Add mod files in load order
    if (files.length > 0) {
      args.push('-file');
      files.sort((a, b) => (a.loadOrder ?? 0) - (b.loadOrder ?? 0)).forEach(file => {
        if (file.filePath) args.push(path.resolve(file.filePath));
      });
    }
    // Add save dir
    if (saveDir) {
      args.push('-savedir', saveDir);
    }
    // Add custom args from mod
    args.push(...customArgs);
    // Add custom args from launchOptions
    if (launchOptions.customArgs) {
      args.push(...launchOptions.customArgs.split(' ').filter((arg: string) => arg.trim().length > 0));
    }
    // Add skill/warp if specified
    if (launchOptions.skill) {
      args.push('-skill', launchOptions.skill.toString());
    }
    if (launchOptions.warp) {
      args.push('-warp', launchOptions.warp);
    }

    console.log(`Launching GZDoom at ${gzDoomPath} with args:`, args);
    console.log('Launching command:', gzDoomPath, args);
    // Use fileService to launch the game
    const success = await fileService.launchGame(gzDoomPath, args);
    return { success };
  } catch (error) {
    const err = error as Error;
    console.error('Error launching game:', err);
    throw new Error(`Failed to launch game: ${err.message}`);
  }
}