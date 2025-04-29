import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Construct the path relative to the project root (process.cwd())
  const buildPath = path.resolve(__dirname, 'public'); // Changed path construction

  if (!fs.existsSync(buildPath)) {
    throw new Error(
      `Could not find the build directory: ${buildPath}, make sure to build the client first`,
    );
  }

  console.log(`Serving static files from: ${buildPath}`); // Log the correct path
  app.use(express.static(buildPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html"));
  });
}

// Keep log function here if needed by static server, or move elsewhere if not
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}