import { apiRequest } from './queryClient';
import type { IMod, IModFile, IDoomVersion } from '@shared/schema';

// Service to interact with the game-related API endpoints
export const gameService = {
  // Get all doom versions
  async getDoomVersions(): Promise<IDoomVersion[]> {
    const res = await apiRequest('GET', '/api/versions');
    return res.json();
  },

  // Get doom version by slug
  async getDoomVersionBySlug(slug: string): Promise<IDoomVersion> {
    const res = await apiRequest('GET', `/api/versions/${slug}`);
    return res.json();
  },

  // Get all mods or filter by version
  async getMods(versionSlug?: string): Promise<IMod[]> {
    const url = versionSlug 
      ? `/api/mods?version=${versionSlug}` 
      : '/api/mods';
    
    const res = await apiRequest('GET', url);
    return res.json();
  },

  // Get a specific mod with its files
  async getMod(id: number): Promise<{ mod: IMod; files: IModFile[] }> {
    const res = await apiRequest('GET', `/api/mods/${id}`);
    return res.json();
  },

  // Create a new mod
  async createMod(mod: Omit<IMod, 'id'>, files: Omit<IModFile, 'id' | 'modId'>[]): Promise<IMod> {
    const res = await apiRequest('POST', '/api/mods', { mod, files });
    return res.json();
  },

  // Update an existing mod
  async updateMod(id: number, mod: Partial<IMod>, files: Omit<IModFile, 'id' | 'modId'>[]): Promise<IMod> {
    const res = await apiRequest('PUT', `/api/mods/${id}`, { mod, files });
    return res.json();
  },

  // Delete a mod
  async deleteMod(id: number): Promise<void> {
    await apiRequest('DELETE', `/api/mods/${id}`);
  },

  // Launch a mod
  async launchMod(id: number): Promise<{ success: boolean }> {
    const res = await apiRequest('POST', `/api/mods/${id}/launch`);
    return res.json();
  }
};
