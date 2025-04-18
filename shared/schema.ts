import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base game/engine versions
export const doomVersions = pgTable("doom_versions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  executable: text("executable").notNull(),
  args: text("args"),
});

export const insertDoomVersionSchema = createInsertSchema(doomVersions).omit({
  id: true,
});

// Game mods/instances
export const mods = pgTable("mods", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  screenshotPath: text("screenshot_path"),
  doomVersionId: integer("doom_version_id").notNull(),
  sourcePort: text("source_port").notNull(),
  saveDirectory: text("save_directory"),
  moddbId: integer("moddb_id"),
  launchParameters: text("launch_parameters"),
});

export const insertModSchema = createInsertSchema(mods).omit({
  id: true,
});

// Mod files (WADs, PK3s, etc.)
export const modFiles = pgTable("mod_files", {
  id: serial("id").primaryKey(),
  modId: integer("mod_id").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  loadOrder: integer("load_order").notNull(),
  isRequired: boolean("is_required").default(true),
});

export const insertModFileSchema = createInsertSchema(modFiles).omit({
  id: true,
});

// Define types
export type DoomVersion = typeof doomVersions.$inferSelect;
export type InsertDoomVersion = z.infer<typeof insertDoomVersionSchema>;

export type Mod = typeof mods.$inferSelect;
export type InsertMod = z.infer<typeof insertModSchema>;

export type ModFile = typeof modFiles.$inferSelect;
export type InsertModFile = z.infer<typeof insertModFileSchema>;

// Simplified in-memory schema
export interface IDoomVersion {
  id: number;
  name: string;
  slug: string;
  icon: string;
  executable: string;
  args?: string;
}

export interface IMod {
  id: number;
  title: string;
  description?: string;
  screenshotPath?: string;
  doomVersionId: number;
  sourcePort: string;
  saveDirectory?: string;
  moddbId?: number;
  launchParameters?: string;
}

export interface IModFile {
  id: number;
  modId: number;
  filePath: string;
  fileName: string;
  fileType: string;
  loadOrder: number;
  isRequired: boolean;
}

// ModDB API response types
export interface ModDBSearchResult {
  id: number;
  name: string;
  summary: string;
  thumbnail: string;
  downloads: number;
  rating: number;
  // Add other properties as needed
}

export interface ModDBModDetails {
  id: number;
  name: string;
  summary: string;
  description: string;
  thumbnail: string;
  downloads: number;
  rating: number;
  files: ModDBFile[];
  // Add other properties as needed
}

export interface ModDBFile {
  id: number;
  name: string;
  size: number;
  date: string;
  url: string;
  // Add other properties as needed
}
