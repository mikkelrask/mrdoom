import fs from 'fs/promises';
import path from 'path';

/**
 * Get the appropriate data directory for storing application data
 */
export function getDataDirectory(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
  return path.join(homeDir, '.config', 'mrdoom', 'data');
}

/**
 * Get the appropriate directory for storing game icons
 */
export function getIconsDirectory(): string {
  return path.join(getDataDirectory(), 'icons');
}

/**
 * Save an icon file to the icons directory
 * @param iconName The name to save the icon as
 * @param iconData The icon data as a Buffer or base64 string
 */
export async function saveIcon(iconName: string, iconData: Buffer | string): Promise<string> {
  const iconsDir = getIconsDirectory();
  
  // Ensure icons directory exists
  await fs.mkdir(iconsDir, { recursive: true });
  
  const iconPath = path.join(iconsDir, iconName);
  
  // Convert base64 string to Buffer if needed
  const data = typeof iconData === 'string' 
    ? Buffer.from(iconData.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    : iconData;
  
  await fs.writeFile(iconPath, data);
  
  // Return the relative path to use in the storage
  return `icons/${iconName}`;
}

/**
 * Get the full path to an icon from its stored relative path
 * @param iconRelativePath The relative path stored in the database (e.g., 'icons/doom.png')
 */
export function getIconFullPath(iconRelativePath: string): string {
  if (!iconRelativePath) {
    return '';
  }
  
  // Handle both 'icons/doom.png' and just 'doom.png'
  const iconName = iconRelativePath.includes('/') 
    ? iconRelativePath.split('/').pop()
    : iconRelativePath;
    
  return path.join(getIconsDirectory(), iconName || '');
}

/**
 * Check if an icon exists in the icons directory
 * @param iconName The name of the icon to check
 */
export async function iconExists(iconName: string): Promise<boolean> {
  try {
    const fullPath = getIconFullPath(iconName);
    await fs.access(fullPath);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Read an icon file as a Base64 string
 * @param iconRelativePath The relative path stored in the database
 */
export async function getIconAsBase64(iconRelativePath: string): Promise<string | null> {
  try {
    const fullPath = getIconFullPath(iconRelativePath);
    const data = await fs.readFile(fullPath);
    
    // Determine mime type based on file extension
    const ext = path.extname(fullPath).toLowerCase().substring(1);
    let mimeType = 'image/png'; // default
    
    if (ext === 'jpg' || ext === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === 'svg') {
      mimeType = 'image/svg+xml';
    } else if (ext === 'gif') {
      mimeType = 'image/gif';
    }
    
    return `data:${mimeType};base64,${data.toString('base64')}`;
  } catch (e) {
    console.error(`Failed to read icon: ${iconRelativePath}`, e);
    return null;
  }
}