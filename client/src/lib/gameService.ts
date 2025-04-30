import type { 
  IDoomVersion, 
  IMod, 
  IModFile, 
  InsertMod, 
  IAppSettings 
} from '@shared/schema';

export interface IMod {
  id: number;
  name: string;
  title?: string;
  filePath: string;
  doomVersionId: string; // Changed from optional number to string
}

// Helper function to handle API errors
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  return response.json();
}

// Client API service
export const gameService = {
  // DoomVersion operations
  async getDoomVersions(): Promise<IDoomVersion[]> {
    const response = await fetch('/api/versions');
    return handleApiResponse<IDoomVersion[]>(response);
  },
  
  async getDoomVersion(id: number): Promise<IDoomVersion> {
    const response = await fetch(`/api/versions/${id}`);
    return handleApiResponse<IDoomVersion>(response);
  },
  
  async getDoomVersionBySlug(slug: string): Promise<IDoomVersion> {
    const response = await fetch(`/api/versions/bySlug/${slug}`);
    return handleApiResponse<IDoomVersion>(response);
  },
  
  async createDoomVersion(version: Omit<IDoomVersion, 'id'>): Promise<IDoomVersion> {
    const response = await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version)
    });
    return handleApiResponse<IDoomVersion>(response);
  },
  
  async updateDoomVersion(id: number, version: Partial<IDoomVersion>): Promise<IDoomVersion> {
    const response = await fetch(`/api/versions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version)
    });
    return handleApiResponse<IDoomVersion>(response);
  },
  
  async deleteDoomVersion(id: number): Promise<void> {
    const response = await fetch(`/api/versions/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete version: ${response.status}`);
    }
  },
  
  // Mod operations
  async getMods(versionSlug?: string, searchQuery?: string): Promise<IMod[]> {
    const params = new URLSearchParams();
    if (versionSlug) params.append('version', versionSlug);
    if (searchQuery) params.append('search', searchQuery);
  
    const url = `/api/mods?${params.toString()}`;
    const response = await fetch(url);
    return handleApiResponse<IMod[]>(response);
  },
  
  async getMod(id: number): Promise<{ mod: IMod, files: IModFile[] }> {
    const response = await fetch(`/api/mods/${id}`);
    return handleApiResponse<{ mod: IMod, files: IModFile[] }>(response);
  },
  
  async createMod(mod: InsertMod, files: Omit<IModFile, 'id' | 'modId'>[] = []): Promise<IMod> {
    const response = await fetch('/api/mods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mod, files })
    });
    return handleApiResponse<IMod>(response);
  },
  
  async updateMod(id: number, mod: Partial<IMod>, files?: Omit<IModFile, 'id' | 'modId'>[]): Promise<IMod> {
    const response = await fetch(`/api/mods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mod, files })
    });
    return handleApiResponse<IMod>(response);
  },
  
  async deleteMod(id: number): Promise<void> {
    const response = await fetch(`/api/mods/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete mod: ${response.status}`);
    }
  },
  
  async launchMod(id: number): Promise<{ success: boolean, message: string }> {
    const response = await fetch(`/api/mods/${id}/launch`, {
      method: 'POST'
    });
    return handleApiResponse<{ success: boolean, message: string }>(response);
  },
  
  // Settings operations
  async getSettings(): Promise<IAppSettings> {
    console.log('Getting settings from API');
    const response = await fetch('/api/settings');
    const data = await handleApiResponse<IAppSettings>(response);
    console.log('Received settings:', data);
    return data;
  },
  
  async updateSettings(settings: Partial<IAppSettings>): Promise<IAppSettings> {
    console.log('Updating settings:', settings);
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return handleApiResponse<IAppSettings>(response);
  },
  
  // ModFile catalog operations
  async getModFileCatalog(): Promise<IModFile[]> {
    console.log('Getting mod file catalog');
    const response = await fetch('/api/mod-files/catalog');
    return handleApiResponse<IModFile[]>(response);
  },
  
  async getModFilesByType(fileType: string): Promise<IModFile[]> {
    console.log(`Getting mod files of type ${fileType}`);
    const response = await fetch(`/api/mod-files/catalog/by-type/${fileType}`);
    return handleApiResponse<IModFile[]>(response);
  },
  
  async addModFileToCatalog(file: Omit<IModFile, 'id' | 'modId'>): Promise<IModFile> {
    console.log('Adding mod file to catalog:', file);
    const response = await fetch('/api/mod-files/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file)
    });
    return handleApiResponse<IModFile>(response);
  },
  
  // Dialog functions
  showOpenDialog: async (options: any) => {
    try {
      console.log('Showing open dialog with options:', options);
      const response = await fetch('/api/dialog/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to show open dialog: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Open dialog result:', result);
      return result;
    } catch (error) {
      console.error('Error opening file dialog:', error);
      // Return a default response to avoid breaking the UI
      return { canceled: true, filePaths: [] };
    }
  },
  
  showSaveDialog: async (options: any) => {
    try {
      console.log('Showing save dialog with options:', options);
      const response = await fetch('/api/dialog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to show save dialog: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Save dialog result:', result);
      return result;
    } catch (error) {
      console.error('Error opening save dialog:', error);
      // Return a default response to avoid breaking the UI
      return { canceled: true, filePath: '' };
    }
  }
};

export async function getModFileCatalog(): Promise<IModFile[]> {
  try {
    const res = await fetch('/api/mod-files/catalog');
    const text = await res.text();
    let data: any = [];
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('gameService: Failed to parse mod file catalog JSON:', err, 'Raw:', text);
      data = [];
    }
    if (!Array.isArray(data)) {
      console.warn('gameService: mod file catalog is not an array, got:', data);
      return [];
    }
    return data;
  } catch (error) {
    console.error('gameService: Error fetching mod file catalog:', error);
    return [];
  }
}
