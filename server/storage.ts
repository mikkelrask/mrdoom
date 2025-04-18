import { 
  IDoomVersion, 
  IMod, 
  IModFile, 
  InsertDoomVersion, 
  InsertMod, 
  InsertModFile 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // DoomVersion operations
  getDoomVersions(): Promise<IDoomVersion[]>;
  getDoomVersion(id: number): Promise<IDoomVersion | undefined>;
  getDoomVersionBySlug(slug: string): Promise<IDoomVersion | undefined>;
  createDoomVersion(version: InsertDoomVersion): Promise<IDoomVersion>;
  
  // Mod operations
  getMods(): Promise<IMod[]>;
  getModsByDoomVersion(doomVersionId: number): Promise<IMod[]>;
  getMod(id: number): Promise<IMod | undefined>;
  createMod(mod: InsertMod): Promise<IMod>;
  updateMod(id: number, mod: Partial<IMod>): Promise<IMod | undefined>;
  deleteMod(id: number): Promise<boolean>;
  
  // ModFile operations
  getModFiles(modId: number): Promise<IModFile[]>;
  getModFile(id: number): Promise<IModFile | undefined>;
  createModFile(file: InsertModFile): Promise<IModFile>;
  updateModFile(id: number, file: Partial<IModFile>): Promise<IModFile | undefined>;
  deleteModFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private doomVersions: Map<number, IDoomVersion>;
  private mods: Map<number, IMod>;
  private modFiles: Map<number, IModFile>;
  private doomVersionIdCounter: number;
  private modIdCounter: number;
  private modFileIdCounter: number;

  constructor() {
    this.doomVersions = new Map();
    this.mods = new Map();
    this.modFiles = new Map();
    this.doomVersionIdCounter = 1;
    this.modIdCounter = 1;
    this.modFileIdCounter = 1;
    
    // Initialize with default Doom versions
    this.initializeDefaultDoomVersions();
  }

  private initializeDefaultDoomVersions() {
    const defaultVersions: InsertDoomVersion[] = [
      {
        name: "Doom",
        slug: "doom",
        icon: "doom",
        executable: "gzdoom",
        args: "-iwad doom.wad"
      },
      {
        name: "Doom 2",
        slug: "doom2",
        icon: "doom2",
        executable: "gzdoom",
        args: "-iwad doom2.wad"
      },
      {
        name: "FreeDoom",
        slug: "freedoom",
        icon: "freedoom",
        executable: "gzdoom",
        args: "-iwad freedoom1.wad"
      },
      {
        name: "FreeDoom 2",
        slug: "freedoom2",
        icon: "freedoom2",
        executable: "gzdoom",
        args: "-iwad freedoom2.wad"
      },
      {
        name: "Plutonia",
        slug: "plutonia",
        icon: "plutonia",
        executable: "gzdoom",
        args: "-iwad plutonia.wad"
      },
      {
        name: "TNT Evilution",
        slug: "tnt",
        icon: "tnt",
        executable: "gzdoom",
        args: "-iwad tnt.wad"
      }
    ];

    defaultVersions.forEach(version => {
      this.createDoomVersion(version);
    });
  }

  // DoomVersion operations
  async getDoomVersions(): Promise<IDoomVersion[]> {
    return Array.from(this.doomVersions.values());
  }

  async getDoomVersion(id: number): Promise<IDoomVersion | undefined> {
    return this.doomVersions.get(id);
  }

  async getDoomVersionBySlug(slug: string): Promise<IDoomVersion | undefined> {
    return Array.from(this.doomVersions.values()).find(
      version => version.slug === slug
    );
  }

  async createDoomVersion(version: InsertDoomVersion): Promise<IDoomVersion> {
    const id = this.doomVersionIdCounter++;
    const newVersion: IDoomVersion = { ...version, id };
    this.doomVersions.set(id, newVersion);
    return newVersion;
  }

  // Mod operations
  async getMods(): Promise<IMod[]> {
    return Array.from(this.mods.values());
  }

  async getModsByDoomVersion(doomVersionId: number): Promise<IMod[]> {
    return Array.from(this.mods.values()).filter(
      mod => mod.doomVersionId === doomVersionId
    );
  }

  async getMod(id: number): Promise<IMod | undefined> {
    return this.mods.get(id);
  }

  async createMod(mod: InsertMod): Promise<IMod> {
    const id = this.modIdCounter++;
    const newMod: IMod = { ...mod, id };
    this.mods.set(id, newMod);
    return newMod;
  }

  async updateMod(id: number, mod: Partial<IMod>): Promise<IMod | undefined> {
    const existingMod = this.mods.get(id);
    if (!existingMod) return undefined;
    
    const updatedMod: IMod = { ...existingMod, ...mod };
    this.mods.set(id, updatedMod);
    return updatedMod;
  }

  async deleteMod(id: number): Promise<boolean> {
    return this.mods.delete(id);
  }

  // ModFile operations
  async getModFiles(modId: number): Promise<IModFile[]> {
    return Array.from(this.modFiles.values())
      .filter(file => file.modId === modId)
      .sort((a, b) => a.loadOrder - b.loadOrder);
  }

  async getModFile(id: number): Promise<IModFile | undefined> {
    return this.modFiles.get(id);
  }

  async createModFile(file: InsertModFile): Promise<IModFile> {
    const id = this.modFileIdCounter++;
    const newFile: IModFile = { ...file, id };
    this.modFiles.set(id, newFile);
    return newFile;
  }

  async updateModFile(id: number, file: Partial<IModFile>): Promise<IModFile | undefined> {
    const existingFile = this.modFiles.get(id);
    if (!existingFile) return undefined;
    
    const updatedFile: IModFile = { ...existingFile, ...file };
    this.modFiles.set(id, updatedFile);
    return updatedFile;
  }

  async deleteModFile(id: number): Promise<boolean> {
    return this.modFiles.delete(id);
  }
}

export const storage = new MemStorage();
