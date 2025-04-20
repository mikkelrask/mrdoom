import type { Express } from "express";
import { createServer, type Server } from "http";
import { gameService } from "./services/gameService";
import { moddbService } from "./services/moddbService";
import * as storage from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize services and load mods from config
  await gameService.loadModsFromConfig();

  // === API Routes ===
  
  // === Doom Versions API ===
  app.get("/api/versions", async (req, res) => {
    const versions = await storage.getDoomVersions();
    res.json(versions); // Ensure this sends the array directly
  });

  app.get("/api/versions/:slug", async (req, res) => {
    const version = await storage.getDoomVersionBySlug(req.params.slug);
    if (!version) {
      return res.status(404).json({ message: "Doom version not found" });
    }
    res.json(version);
  });

  // === Mods API ===
  app.get("/api/mods", async (req, res) => {
    // const { version } = req.query; // Version filtering commented out
    
    // if (version && typeof version === 'string') {
      // const mods = await gameService.getModsByDoomVersion(version);
      // return res.json(mods);
    // }
    
    const mods = await gameService.getAllMods();
    res.json(mods);
  });

  app.get("/api/mods/:id", async (req, res) => {
    const id = req.params.id; // Keep ID as string
    // if (isNaN(id)) {
      // return res.status(400).json({ message: "Invalid mod ID" });
    // }
    
    try {
      const { mod, files } = await gameService.getMod(id);
      res.json({ mod, files });
    } catch (error: any) {
      res.status(404).json({ message: error.message || "Mod not found" });
    }
  });

  app.post("/api/mods", async (req, res) => {
    const { mod, files } = req.body;
    
    // Basic validation - might need more depending on IMod structure
    if (!mod || !mod.title /* || !mod.doomVersionId || !mod.sourcePort */) { // Removed version/port checks for now
      return res.status(400).json({ message: "Missing required mod properties" });
    }
    
    try {
      const savedMod = await gameService.saveMod(mod, files || []);
      res.status(201).json(savedMod);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to save mod" });
    }
  });

  app.put("/api/mods/:id", async (req, res) => {
    const id = req.params.id; // Keep ID as string
    // if (isNaN(id)) {
      // return res.status(400).json({ message: "Invalid mod ID" });
    // }
    
    const { mod, files } = req.body;
    if (!mod) {
      return res.status(400).json({ message: "Missing mod data" });
    }
    
    mod.id = id; // Assign string ID
    try {
      const updatedMod = await gameService.saveMod(mod, files || []);
      res.json(updatedMod);
    } catch (error: any) {
       res.status(404).json({ message: error.message || "Mod not found or failed to update" });
    }
  });

  app.delete("/api/mods/:id", async (req, res) => {
    const id = req.params.id; // Keep ID as string
    // if (isNaN(id)) {
      // return res.status(400).json({ message: "Invalid mod ID" });
    // }
    
    try {
      const success = await gameService.deleteMod(id);
      if (!success) {
         throw new Error("Mod not found or failed to delete");
      }
      res.status(204).send();
    } catch (error: any) {
       res.status(404).json({ message: error.message || "Mod not found or failed to delete" });
    }
  });

  // Launch a mod
  app.post("/api/mods/:id/launch", async (req, res) => {
    const id = req.params.id; // Use string ID
    if (!id) {
      return res.status(400).json({ message: "Invalid mod ID" });
    }
    try {
       const result = await gameService.launchMod(id);
       if (!result.success) {
         throw new Error(result.message || "Failed to launch mod");
       }
       res.json({ success: true });
    } catch (error: any) {
       res.status(500).json({ message: error.message || "Failed to launch mod" });
    }
  });

  // === Mod Files API === // New Section
  app.get("/api/mod-files/catalog", async (req, res) => {
    try {
      const catalog = await storage.getModFileCatalog();
      if (!Array.isArray(catalog)) {
        console.warn('routes.ts: getModFileCatalog did not return an array:', catalog);
        return res.json([]);
      }
      res.json(catalog);
    } catch (error) {
      console.error('routes.ts: Error in /api/mod-files/catalog:', error);
      res.json([]);
    }
  });

  app.post("/api/mod-files/catalog", async (req, res) => {
    try {
      console.log("POST /api/mod-files/catalog received with body:", req.body);
      
      const fileData = req.body;
      
      // Basic validation
      if (!fileData || !fileData.filePath) {
        console.log("Validation failed: Missing required file properties");
        return res.status(400).json({ message: "Missing required file properties" });
      }

      console.log("Adding file to catalog:", fileData);
      const savedFile = await storage.addModFileToCatalog(fileData);
      console.log("File added to catalog successfully:", savedFile);
      
      res.status(201).json(savedFile);
    } catch (error: any) {
      console.error("Error in POST /api/mod-files/catalog:", error);
      res.status(500).json({ message: error.message || "Failed to add file to catalog" });
    }
  });

  // === ModDB API ===
  app.get("/api/moddb/search", async (req, res) => {
    const { query, game } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const gameFilter = typeof game === 'string' ? game : undefined;
    const results = await moddbService.searchMods(query, gameFilter);
    
    res.json(results);
  });

  app.get("/api/moddb/mods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid mod ID" });
    }
    
    const mod = await moddbService.getModDetails(id);
    
    if (!mod) {
      return res.status(404).json({ message: "Mod not found on ModDB" });
    }
    
    res.json(mod);
  });

  app.get("/api/moddb/popular", async (req, res) => {
    const mods = await moddbService.getPopularDoomMods();
    res.json(mods);
  });

  app.get("/api/moddb/latest", async (req, res) => {
    const mods = await moddbService.getLatestDoomMods();
    res.json(mods);
  });

  // === Dialog API === (For file selection)
  app.post("/api/dialog/open", async (req, res) => {
    try {
      // Check if we're running in Electron
      if (!global.electron) {
        return res.status(400).json({ 
          canceled: true, 
          filePaths: [],
          message: "File dialogs are only available in the Electron app" 
        });
      }
      
      const options = req.body;
      const result = await global.electron.dialog.showOpenDialog(options);
      res.json(result);
    } catch (error: any) {
      console.error("Error showing open dialog:", error);
      res.status(500).json({ 
        canceled: true, 
        filePaths: [],
        message: error.message || "Failed to show open dialog" 
      });
    }
  });

  app.post("/api/dialog/save", async (req, res) => {
    try {
      // Check if we're running in Electron
      if (!global.electron) {
        return res.status(400).json({ 
          canceled: true, 
          filePath: "",
          message: "File dialogs are only available in the Electron app" 
        });
      }
      
      const options = req.body;
      const result = await global.electron.dialog.showSaveDialog(options);
      res.json(result);
    } catch (error: any) {
      console.error("Error showing save dialog:", error);
      res.status(500).json({ 
        canceled: true, 
        filePath: "",
        message: error.message || "Failed to show save dialog" 
      });
    }
  });

  return httpServer;
}
