import { IAppSettings } from "@shared/schema";
import { api } from "./api";

// Cache the settings to avoid repeated API calls
let cachedSettings: IAppSettings | null = null;

/**
 * Fetches application settings from the backend
 */
export const getSettings = async (): Promise<IAppSettings> => {
  try {
    // Return cached settings if available
    if (cachedSettings) {
      return cachedSettings;
    }
    
    console.log('Fetching settings from API...');
    const response = await api.get<IAppSettings>('/api/settings');
    cachedSettings = response.data;
    
    console.log('Received settings:', cachedSettings);
    return cachedSettings;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    throw new Error('Failed to fetch application settings');
  }
};

/**
 * Updates application settings
 */
export const updateSettings = async (settings: Partial<IAppSettings>): Promise<IAppSettings> => {
  try {
    console.log('Updating settings:', settings);
    const response = await api.post<IAppSettings>('/api/settings', settings);
    
    // Update cache with the new settings
    cachedSettings = response.data;
    
    console.log('Settings updated successfully:', cachedSettings);
    return cachedSettings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw new Error('Failed to update application settings');
  }
};

/**
 * Clears the settings cache to force a reload on next getSettings() call
 */
export const clearSettingsCache = (): void => {
  cachedSettings = null;
};