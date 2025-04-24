import express from 'express';
import * as storage from './storage';
import * as utils from './utils';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { IMod } from '../shared/schema';

// Import dialog conditionally
let dialog: any;
try {
  const electron = require('electron');
  dialog = electron.dialog;
} catch (e) {
  console.log('Electron dialog not available in API');
}

// Get logger function for API requests
function apiLogger(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`API ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
}

export function setupApiRoutes(app: express.Express): void {
  const router = express.Router();
  
  // Set up file upload middleware
  const upload = multer({
    storage: multer.diskStorage({
      destination: async function(req: any, file: any, cb: any) {
        const iconDir = utils.getIconsDirectory();
        try {
          await fs.mkdir(iconDir, { recursive: true });
          cb(null, iconDir);
        } catch (err) {
          cb(err as Error, '');
        }
      },
      filename: function(req: any, file: any, cb: any) {
        // Create a safe filename with original extension
        const ext = path.extname(file.originalname);
        const safeName = `${Date.now()}-${Math.round(Math.random()*1000)}${ext}`;
        cb(null, safeName);
      }
    })
  });
  
  // Add logging middleware
  router.use(apiLogger);
  
  // Icon routes
  router.get('/icons/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const fullPath = utils.getIconFullPath(filename);
      
      try {
        await fs.access(fullPath);
        return res.sendFile(fullPath);
      } catch (e) {
        // If the file doesn't exist, send a default icon
        return res.status(404).json({ error: 'Icon not found' });
      }
    } catch (error) {
      console.error('Error serving icon:', error);
      return res.status(500).json({ error: 'Failed to serve icon' });
    }
  });
  
  router.post('/icons', upload.single('icon'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return the relative path to the icon
      const relativePath = `icons/${req.file.filename}`;
      return res.status(201).json({ path: relativePath });
    } catch (error) {
      console.error('Error uploading icon:', error);
      return res.status(500).json({ error: 'Failed to upload icon' });
    }
  });
  
  // DoomVersion routes
  router.get('/versions', async (req, res) => {
    try {
      console.log('Getting doom versions from storage');
      const versions = await storage.getDoomVersions();
      console.log(`Returning ${versions.length} doom versions`);
      res.json(versions);
    } catch (error) {
      console.error('Error getting doom versions:', error);
      res.status(500).json({ error: 'Failed to get doom versions' });
    }
  });
  
  router.get('/versions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const version = await storage.getDoomVersion(id);
      if (!version) {
        return res.status(404).json({ error: 'Doom version not found' });
      }
      res.json(version);
    } catch (error) {
      console.error(`Error getting doom version ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get doom version' });
    }
  });
  
  router.get('/versions/bySlug/:slug', async (req, res) => {
    try {
      const version = await storage.getDoomVersionBySlug(req.params.slug);
      if (!version) {
        return res.status(404).json({ error: 'Doom version not found' });
      }
      res.json(version);
    } catch (error) {
      console.error(`Error getting doom version by slug ${req.params.slug}:`, error);
      res.status(500).json({ error: 'Failed to get doom version' });
    }
  });
  
  router.post('/versions', async (req, res) => {
    try {
      const version = await storage.createDoomVersion(req.body);
      res.status(201).json(version);
    } catch (error) {
      console.error('Error creating doom version:', error);
      res.status(500).json({ error: 'Failed to create doom version' });
    }
  });
  
  router.put('/versions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const version = await storage.updateDoomVersion(id, req.body);
      if (!version) {
        return res.status(404).json({ error: 'Doom version not found' });
      }
      res.json(version);
    } catch (error) {
      console.error(`Error updating doom version ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update doom version' });
    }
  });
  
  router.delete('/versions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteDoomVersion(id);
      if (!success) {
        return res.status(404).json({ error: 'Doom version not found' });
      }
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting doom version ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete doom version' });
    }
  });
  
  // Export/Import routes
  router.get('/export/:doomVersionId', async (req, res) => {
    try {
      const id = parseInt(req.params.doomVersionId, 10);
      const gameConfig = await import('./gameConfig');
      
      const filePath = await gameConfig.exportGameConfig(id);
      res.json({ filePath });
    } catch (error) {
      console.error('Error exporting game config:', error);
      res.status(500).json({ error: 'Failed to export game config' });
    }
  });
  
  router.post('/import', async (req, res) => {
    try {
      const { filePath, merge } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: 'No file path provided' });
      }
      
      const { importGameConfig } = await import('./gameConfig');
      const doomVersionId = await importGameConfig(filePath, !!merge);
      res.json({ success: true, doomVersionId });
    } catch (error) {
      console.error('Error importing game config:', error);
      res.status(500).json({ error: 'Failed to import game config' });
    }
  });
  
  // Settings routes
  router.get('/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });
  
  router.put('/settings', async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });
  
  // Mod file catalog routes
  router.get('/mod-files/catalog', async (req, res) => {
    try {
      const files = await storage.getAvailableModFiles();
      console.log(`Returning ${files.length} catalog mod files`);
      res.json(files);
    } catch (error) {
      console.error('Error getting mod file catalog:', error);
      res.status(500).json({ error: 'Failed to get mod file catalog' });
    }
  });
  
  router.get('/mod-files/catalog/by-type/:fileType', async (req, res) => {
    try {
      const fileType = req.params.fileType;
      const files = await storage.getModFilesByType(fileType);
      console.log(`Returning ${files.length} catalog mod files of type ${fileType}`);
      res.json(files);
    } catch (error) {
      console.error(`Error getting mod files by type ${req.params.fileType}:`, error);
      res.status(500).json({ error: 'Failed to get mod files by type' });
    }
  });
  
  router.post('/mod-files/catalog', async (req, res) => {
    try {
      const file = req.body;
      console.log('Adding file to catalog:', file);
      // Use the correct function to add to the catalog
      const modFile = await storage.addModFileToCatalog(file);
      console.log('Added file to catalog:', modFile);
      res.status(201).json(modFile);
    } catch (error) {
      console.error('Error adding mod file to catalog:', error);
      res.status(500).json({ error: 'Failed to add mod file to catalog' });
    }
  });
  
  // Mod routes
  router.get('/mods', async (req, res) => {
    try {
      let mods: IMod[] = [];
      if (req.query.version) {
        const version = await storage.getDoomVersionBySlug(String(req.query.version));
        if (version) {
          mods = await storage.getModsByDoomVersion(version.id as string);
        }
      } else {
        mods = await storage.getMods();
      }
      res.json(mods);
    } catch (error) {
      console.error('Error getting mods:', error);
      res.status(500).json({ error: 'Failed to get mods' });
    }
  });
  
  router.get('/mods/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const mod = await storage.getMod(String(id));
      if (!mod) {
        return res.status(404).json({ error: 'Mod not found' });
      }
      
      const files = await storage.getModFiles(id);
      res.json({ mod, files });
    } catch (error) {
      console.error(`Error getting mod ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get mod' });
    }
  });
  
  router.post('/mods', async (req, res) => {
    try {
      const { mod: modData, files } = req.body;
      const mod = await storage.createMod(modData);
      
      // Create mod files with the new mod ID
      for (const fileData of files || []) {
        await storage.createModFile({
          ...fileData,
          modId: mod.id
        });
      }
      
      res.status(201).json(mod);
    } catch (error) {
      console.error('Error creating mod:', error);
      res.status(500).json({ error: 'Failed to create mod' });
    }
  });
  
  router.put('/mods/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { mod: modData, files } = req.body;
      
      // Update the mod
      const mod = await storage.updateMod(id, modData);
      if (!mod) {
        return res.status(404).json({ error: 'Mod not found' });
      }
      
      // Get current files
      const existingFiles: any[] = await storage.getModFiles(id);
      
      // Delete existing files if new files are provided
      if (files && files.length > 0) {
        for (const file of existingFiles) {
          await storage.deleteModFile((file as any).id);
        }
        
        // Create new files
        for (const fileData of files) {
          await storage.createModFile({
            ...fileData,
            modId: id
          });
        }
      }
      
      res.json(mod);
    } catch (error) {
      console.error(`Error updating mod ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update mod' });
    }
  });
  
  router.delete('/mods/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteMod(id);
      if (!success) {
        return res.status(404).json({ error: 'Mod not found' });
      }
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting mod ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete mod' });
    }
  });
  
  router.post('/mods/:id/launch', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { launchMod } = await import('./index');
      
      const result = await launchMod(id);
      res.json(result);
    } catch (error) {
      console.error(`Error launching mod ${req.params.id}:`, error);
      res.status(500).json({ 
        error: 'Failed to launch mod',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // File dialog routes that work in both Electron and non-Electron environments
  router.post('/dialog/open', async (req, res) => {
    try {
      const options = req.body;
      
      if (dialog) {
        // Use Electron dialog if available
        const result = await dialog.showOpenDialog(options);
        res.json(result);
      } else {
        // In non-Electron environment, return a mock response
        console.log('Mock open dialog with options:', options);
        res.json({ 
          canceled: false, 
          filePaths: ['/mock/path/example.wad'] 
        });
      }
    } catch (error) {
      console.error('Error showing open dialog:', error);
      // Return a valid response even on error
      res.json({ canceled: true, filePaths: [] });
    }
  });
  
  router.post('/dialog/save', async (req, res) => {
    try {
      const options = req.body;
      
      if (dialog) {
        // Use Electron dialog if available
        const result = await dialog.showSaveDialog(options);
        res.json(result);
      } else {
        // In non-Electron environment, return a mock response
        console.log('Mock save dialog with options:', options);
        res.json({ 
          canceled: false, 
          filePath: '/mock/path/saved-file.txt' 
        });
      }
    } catch (error) {
      console.error('Error showing save dialog:', error);
      // Return a valid response even on error
      res.json({ canceled: true, filePath: '' });
    }
  });
  
  // Mount the router
  app.use('/api', router);
}