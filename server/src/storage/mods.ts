export const getMods = async (versionId?: string): Promise<IMod[]> => {
  try {
    // Get all mods from storage
    const mods = await storage.get<IMod[]>('mods') || [];
    
    // Filter by version if specified
    if (versionId) {
      return mods.filter(mod => mod.doomVersionId?.toString() === versionId);
    }
    
    return mods;
  } catch (error) {
    console.error('Error getting mods:', error);
    throw error;
  }
}; 