import { storage } from './storage';

export interface IDoomVersion {
  id: string;
  name: string;
  slug: string;
  executable?: string;
  args?: string;
}

export const getVersion = async (id: string): Promise<IDoomVersion | undefined> => {
  try {
    const versions = await storage.get<IDoomVersion[]>('versions') || [];
    return versions.find(v => v.id === id);
  } catch (error) {
    console.error('Error getting version:', error);
    throw error;
  }
}; 