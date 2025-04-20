import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { spawn } from 'child_process';
import path from 'path';
import * as storage from './storage';
import { app, BrowserWindow } from 'electron';
import { gameService } from './services/gameService';
import { IMod, IModFile } from '@shared/schema';
// import { getAppMainWindowUrl } from './utils'; // Removed unused import

// Declare global electron object for TypeScript
declare global {
  var electron: {
    dialog: {
      showOpenDialog: (options: any) => Promise<{ canceled: boolean, filePaths: string[] }>;
      showSaveDialog: (options: any) => Promise<{ canceled: boolean, filePath: string }>;
    };
    ipcMain?: any;
  } | undefined;
}

// Variables to hold electron modules
let electron: any;
let ipcMain: any;

// Conditionally import Electron APIs
try {
  electron = require('electron');
  ipcMain = electron.ipcMain;
  
  // Make Electron APIs available globally for dialog routes
  global.electron = {
    dialog: electron.dialog,
    ipcMain: electron.ipcMain
  };
  
  console.log('Running in Electron environment, dialog APIs available');
} catch (e) {
  console.log('Running in non-Electron environment, dialog APIs will be limited');
}

const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: false }));

expressApp.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Make launchMod available for import
export async function launchMod(modId: number) {
  try {
    // Get the mod details
    const { mod } = await storage.getMod(modId.toString()); // Convert number to string
    if (!mod) {
      throw new Error(`Mod with ID ${modId} not found`);
    }
    
    // Get the associated mod files in load order
    const modFiles: IModFile[] = await storage.getModFiles(modId.toString()); // Convert number to string
    if (!modFiles.length) {
      throw new Error(`No mod files found for mod with ID ${modId}`);
    }
    
    // Get app settings for executable path
    const settings = await storage.getSettings();
    console.log("Retrieved settings for launch:", settings);
    
    // Check for required GZDoom path
    if (!settings?.gzDoomPath) {
      throw new Error('GZDoom executable path not set in settings. Please set it in Settings.');
    }
    
    const executable = settings.gzDoomPath;
    const args: string[] = [];
    
    // Add mod files in order
    for (const file of modFiles.sort((a, b) => a.loadOrder - b.loadOrder)) {
      if (!file.filePath) {
        console.warn(`Mod file ${file.id} has no file path, skipping`);
        continue;
      }
      args.push('-file', file.filePath);
    }
    
    // Add any custom launch parameters
    if (mod.launchParameters) { // Correct access to mod.launchParameters
      const customParams = mod.launchParameters.split(' ');
      args.push(...customParams);
    }
    
    console.log(`Launching ${executable} with args:`, args);
    
    // Launch the process
    const process = spawn(executable, args, {
      detached: true, // Run in background
      stdio: 'ignore'
    });
    
    // Don't wait for child process
    process.unref();
    
    return { success: true, message: 'Mod launched' };
  } catch (error: any) { // Add type :any
    console.error('Failed to launch mod:', error);
    return { success: false, message: error.message };
  }
}

// Only set up IPC if running in Electron
function setupIpc() {
  // Make sure we have Electron APIs available
  if (!ipcMain || !global.electron?.dialog) {
    console.log('IPC setup skipped: not running in Electron');
    return;
  }
  
  // Launch mod
  ipcMain.handle('launch-mod', async (event: Electron.IpcMainInvokeEvent, modId: number) => { // Add type for event
    return await launchMod(modId);
  });
  
  // File dialogs
  ipcMain.handle('dialog:openFile', async (event: Electron.IpcMainInvokeEvent, options: Electron.OpenDialogOptions) => { // Add types for event and options
    return await global.electron?.dialog.showOpenDialog(options);
  });
  
  ipcMain.handle('dialog:saveFile', async (event: Electron.IpcMainInvokeEvent, options: Electron.SaveDialogOptions) => { // Add types for event and options
    return await global.electron?.dialog.showSaveDialog(options);
  });

  ipcMain.handle('getMod', async (_, modId: string) => {
    try {
      // storage.getMod now returns both mod and files
      const { mod, files } = await storage.getMod(modId);
      return { success: true, mod, files };
    } catch (error) {
      console.error('Error getting mod:', error);
      return { success: false, error: (error as Error).message };
    }
  });
  
  // Replace the separate getModFiles handler with a consolidated approach
  // since storage.getMod now returns both mod and files
  ipcMain.handle('getModFiles', async (_, modId: string) => {
    try {
      const { files } = await storage.getMod(modId);
      return { success: true, files };
    } catch (error) {
      console.error('Error getting mod files:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Helper function for the electron dialog
  function showOpenDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
    return global.electron?.dialog.showOpenDialog(options);
  }
  
  ipcMain.handle('openFileDialog', async (_, options: Electron.OpenDialogOptions) => {
    try {
      return await showOpenDialog(options);
    } catch (error) {
      console.error('Error opening file dialog:', error);
      throw error;
    }
  });
}

// Only call setupIpc if we're in Electron environment
if (typeof ipcMain !== 'undefined' && ipcMain) {
  setupIpc();

  ipcMain.handle('dialog:openFile', async (_event, options: Electron.OpenDialogOptions) => {
    const { canceled, filePaths } = await global.electron?.dialog.showOpenDialog(options);
    return { canceled, filePaths };
  });

  ipcMain.handle('dialog:openDirectory', async (_event, options: Electron.OpenDialogOptions) => {
    return await global.electron?.dialog.showOpenDialog({ ...options, properties: ['openDirectory'] });
  });

  ipcMain.handle('dialog:save', async (_event, options: Electron.SaveDialogOptions) => {
    return await global.electron?.dialog.showSaveDialog(options);
  });
}

expressApp.get('/api/mods/:id/files', async (req: Request, res: Response) => {
  try {
    const modId = req.params.id;
    // Use the storage.getMod method which already includes files property
    const modWithFiles = await storage.getMod(modId);
    return res.json(modWithFiles.files);
  } catch (error) {
    console.error('Error getting mod files:', error);
    return res.status(500).json({ error: 'Failed to get mod files' });
  }
});

expressApp.delete('/api/mods/:id/files/:fileId', async (req: Request, res: Response) => {
  try {
    const modId = req.params.id;
    const fileId = req.params.fileId;
    
    // Load the mod with its files
    const modWithFiles = await storage.getMod(modId);
    
    // Access files directly on modWithFiles instead of modWithFiles.mod
    modWithFiles.files = modWithFiles.files.filter(file => file.id.toString() !== fileId);
    
    // Save the updated mod with files
    await storage.saveMod(modWithFiles);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file from mod:', error);
    return res.status(500).json({ error: 'Failed to delete file from mod' });
  }
});

expressApp.post('/api/mods/:id/files/sort', async (req: Request, res: Response) => {
  try {
    const modId = req.params.id;
    const sortedIds: string[] = req.body.sortedIds;
    
    // Load the mod with its files
    const modWithFiles = await storage.getMod(modId);
    
    // Sort the files array based on the provided order
    modWithFiles.files.sort((a: IModFile, b: IModFile) => {
      const aIndex = sortedIds.indexOf(a.id.toString());
      const bIndex = sortedIds.indexOf(b.id.toString());
      return aIndex - bIndex;
    });
    
    // Update load order based on the new positions
    modWithFiles.files.forEach((file: IModFile, index: number) => {
      file.loadOrder = index;
    });
    
    // Save the updated mod with files
    await storage.saveMod(modWithFiles);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error sorting mod files:', error);
    return res.status(500).json({ error: 'Failed to sort mod files' });
  }
});

expressApp.post('/api/dialog/open', (req: Request, res: Response) => {
  const options = req.body;
  global.electron?.dialog.showOpenDialog(options)
    .then(result => res.json(result))
    .catch(err => {
      console.error('Error showing open dialog:', err);
      res.status(500).json({ error: 'Failed to show open dialog' });
    });
});

expressApp.post('/api/dialog/save', (req: Request, res: Response) => {
  const options = req.body;
  global.electron?.dialog.showSaveDialog(options)
    .then(result => res.json(result))
    .catch(err => {
      console.error('Error showing save dialog:', err);
      res.status(500).json({ error: 'Failed to show save dialog' });
    });
});

expressApp.get('/api/mods/:modId', async (req: Request, res: Response) => {
  try {
    const modData = await storage.getMod(req.params.modId);
    // Fix: Extract mod properties separately 
    const { files, ...modProperties } = modData;
    res.json({
      status: 'success',
      mod: modProperties,
      files
    });
  } catch (error) {
    res.status(404).json({ status: 'error', message: (error as Error).message });
  }
});

expressApp.get('/api/mods/:modId/files', async (req: Request, res: Response) => {
  try {
    // Use getMod and extract the files property
    const modData = await storage.getMod(req.params.modId);
    res.json({
      status: 'success', 
      files: modData.files
    });
  } catch (error) {
    res.status(404).json({ status: 'error', message: (error as Error).message });
  }
});

expressApp.get('/api/versions', async (req: Request, res: Response) => {
  try {
    const versions = await storage.getDoomVersions();
    console.log('[API] /api/versions - versions from storage:', versions, 'isArray:', Array.isArray(versions));
    res.json(Array.isArray(versions) ? versions : []);
  } catch (error) {
    console.error('[API] /api/versions error:', error);
    res.status(500).json({ status: 'error', message: (error as Error).message, versions: [] });
  }
});

// Settings API
expressApp.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const settings = await storage.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('[API] /api/settings GET error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

expressApp.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const updated = await storage.saveSettings(req.body);
    res.json(updated);
  } catch (error) {
    console.error('[API] /api/settings PUT error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

(async () => {
  const server = await registerRoutes(expressApp);

  expressApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (expressApp.get("env") === "development") {
    await setupVite(expressApp, server);
  } else {
    serveStatic(expressApp);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
