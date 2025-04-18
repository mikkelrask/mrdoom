import type { Express } from "express";
import { createServer, type Server } from "http";
import { gameService } from "./services/gameService";
import { moddbService } from "./services/moddbService";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize services and load mods from config
  await gameService.loadModsFromConfig();

  // === API Routes ===
  
  // === Doom Versions API ===
  app.get("/api/versions", async (req, res) => {
    const versions = await storage.getDoomVersions();
    res.json(versions);
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
    const { version } = req.query;
    
    if (version && typeof version === 'string') {
      const mods = await gameService.getModsByDoomVersion(version);
      return res.json(mods);
    }
    
    const mods = await gameService.getAllMods();
    res.json(mods);
  });

  app.get("/api/mods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid mod ID" });
    }
    
    const mod = await gameService.getMod(id);
    if (!mod) {
      return res.status(404).json({ message: "Mod not found" });
    }
    
    const files = await gameService.getModFiles(id);
    res.json({ mod, files });
  });

  app.post("/api/mods", async (req, res) => {
    const { mod, files } = req.body;
    
    if (!mod || !mod.title || !mod.doomVersionId || !mod.sourcePort) {
      return res.status(400).json({ message: "Missing required mod properties" });
    }
    
    const savedMod = await gameService.saveMod(mod, files || []);
    
    if (!savedMod) {
      return res.status(500).json({ message: "Failed to save mod" });
    }
    
    res.status(201).json(savedMod);
  });

  app.put("/api/mods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid mod ID" });
    }
    
    const { mod, files } = req.body;
    if (!mod) {
      return res.status(400).json({ message: "Missing mod data" });
    }
    
    mod.id = id;
    const updatedMod = await gameService.saveMod(mod, files || []);
    
    if (!updatedMod) {
      return res.status(404).json({ message: "Mod not found" });
    }
    
    res.json(updatedMod);
  });

  app.delete("/api/mods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid mod ID" });
    }
    
    const success = await gameService.deleteMod(id);
    
    if (!success) {
      return res.status(404).json({ message: "Mod not found" });
    }
    
    res.status(204).send();
  });

  // Launch a mod
  app.post("/api/mods/:id/launch", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid mod ID" });
    }
    
    const success = await gameService.launchMod(id);
    
    if (!success) {
      return res.status(500).json({ message: "Failed to launch mod" });
    }
    
    res.json({ success: true });
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

  return httpServer;
}
