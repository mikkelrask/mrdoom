import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite"; // Import setupVite for development
import * as storage from './storage';
import { IModFile } from '../shared/schema';
import { spawn } from 'child_process'; // Import spawn

const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: false }));

expressApp.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args] as [any, ...any[]]);
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

// Make launchMod available for import (Keep this if needed by other parts, otherwise remove)
export async function launchMod(modId: number) {
  try {
    const { mod } = await storage.getMod(modId.toString());
    if (!mod) {
      throw new Error(`Mod with ID ${modId} not found`);
    }

    const modFiles: IModFile[] = await storage.getModFiles(modId.toString());
    if (!modFiles.length) {
      throw new Error(`No mod files found for mod with ID ${modId}`);
    }

    const settings = await storage.getSettings();
    console.log("Retrieved settings for launch:", settings);

    if (!settings?.gzDoomPath) {
      throw new Error('GZDoom executable path not set in settings. Please set it in Settings.');
    }

    const executable = settings.gzDoomPath;
    const args: string[] = [];

    for (const file of modFiles.sort((a, b) => (a.loadOrder ?? 0) - (b.loadOrder ?? 0))) {
      if (!file.filePath) {
        console.warn(`Mod file ${file.id} has no file path, skipping`);
        continue;
      }
      args.push('-file', file.filePath);
    }

    if (mod.launchParameters) {
      const customParams = mod.launchParameters.split(' ');
      args.push(...customParams);
    }

    console.log(`Launching ${executable} with args:`, args);

    const process = spawn(executable, args, {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();

    return { success: true, message: 'Mod launched' };
  } catch (error: any) {
    console.error('Failed to launch mod:', error);
    return { success: false, message: error.message };
  }
}

(async () => {
  console.log("Starting Development Server...");
  console.log("Current working directory:", process.cwd());

  const server = await registerRoutes(expressApp);

  expressApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Always use setupVite in the development entry point
  console.log("Starting Vite server...");
  await setupVite(expressApp, server);

  const port = 7666;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Development server is running on port ${port}`);
    }
  );
})();
