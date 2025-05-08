import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { gameService } from '@/lib/gameService';
import type { IModFile } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { open } from '@tauri-apps/plugin-dialog';

interface ModFileSelectorProps {
  value: Omit<IModFile, 'id' | 'modId'>[];
  onChange: (files: Omit<IModFile, 'id' | 'modId'>[]) => void;
}

export function ModFileSelector({ value = [], onChange }: ModFileSelectorProps) {
  const { toast } = useToast();
  const [catalogFiles, setCatalogFiles] = useState<IModFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load catalog files when component mounts
  useEffect(() => {
    loadCatalogFiles();
  }, []);
  
  const loadCatalogFiles = async () => {
    setIsLoading(true);
    try {
      console.log('Loading catalog files...');
      const files = await gameService.getModFileCatalog();
      console.log(`Loaded ${files.length} catalog files:`, files);
      setCatalogFiles(Array.isArray(files) ? files : []);
    } catch (error) {
      console.error('Failed to load catalog files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mod files from catalog',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFile = () => {
    // Add a new empty file entry
    const newFile: Omit<IModFile, 'id' | 'modId'> = {
      name: '',
      filePath: '',
      fileType: 'WAD',
      loadOrder: value.length,
      isRequired: true,
      fileName: '', // Ensure fileName is present
    };
    onChange([...value, newFile]);
  };
  
  const handleRemoveFile = (index: number) => {
    // Remove file at the given index
    const newFiles = [...value];
    newFiles.splice(index, 1);
    
    // Update load order for remaining files
    const updatedFiles = newFiles.map((file, i) => ({
      ...file,
      loadOrder: i
    }));
    
    onChange(updatedFiles);
  };
  
  const handleUpdateFile = (index: number, field: keyof Omit<IModFile, 'id' | 'modId'>, newValue: any) => {
    // Update a specific field in a file
    const newFiles = [...value];
    newFiles[index] = {
      ...newFiles[index],
      [field]: newValue,
      // Always set fileName from name or filePath
      fileName: field === 'name' ? newValue : (newFiles[index].name || (newFiles[index].filePath ? newFiles[index].filePath.split(/[\\/]/).pop() : '')),
      // Always set isRequired to true if undefined
      isRequired: newFiles[index].isRequired !== undefined ? newFiles[index].isRequired : true,
    };
    onChange(newFiles);
  };
  
  const handleSelectCatalogFile = (index: number, catalogFileId: number) => {
    // Find the catalog file
    const catalogFile = catalogFiles.find(f => f.id === parseInt(catalogFileId + '', 10));
    if (!catalogFile) return;
    
    // Update the file with catalog data
    const newFiles = [...value];
    newFiles[index] = {
      ...newFiles[index],
      name: catalogFile.name,
      filePath: catalogFile.filePath,
      fileType: catalogFile.fileType,
      fileName: catalogFile.fileName,
      isRequired: catalogFile.isRequired ?? true,
      loadOrder: newFiles[index].loadOrder ?? 0,
    };
    onChange(newFiles);
  };
  
  const handleBrowseFile = async (index: number) => {
    try {
      // Use the `open` function from @tauri-apps/plugin-dialog
      const filePath = await open({
        multiple: false, // Allow only a single file to be selected
        filters: [
          { name: 'DOOM Files', extensions: ['wad', 'pk3', 'ipk3', 'deh', 'bex', 'zip'] }
        ]
      });

      // Check if a file was selected
      if (filePath) {
        const fileName = filePath.split(/[\\/]/).pop() || filePath;

        // Update the file path
        handleUpdateFile(index, 'filePath', filePath);

        // If the name is empty, update it with the file name
        if (!value[index].name) {
          handleUpdateFile(index, 'name', fileName);
        }
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      toast({
        title: 'Error',
        description: 'Failed to open file dialog',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mod Files</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleAddFile}
          className="border-[#262626]"
          type="button"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add File
        </Button>
      </div>
      
      {value.length === 0 ? (
        <div className="text-center text-gray-400 py-4">
          No mod files added. Click "Add File" to begin.
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((file, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Pretty name"
                  value={file.name || ''}
                  onChange={(e) => handleUpdateFile(index, 'name', e.target.value)}
                  className="bg-[#0c1c2a] border-[#262626]"
                />
              </div>
              
              <div className="w-24">
                <Select 
                  value={file.fileType} 
                  onValueChange={(value) => handleUpdateFile(index, 'fileType', value)}
                >
                  <SelectTrigger className="bg-[#0c1c2a] border-[#262626]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#162b3d] border-[#262626]">
                    <SelectItem value="WAD">WAD</SelectItem>
                    <SelectItem value="PK3">PK3</SelectItem>
                    <SelectItem value="DEH">DEH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 flex gap-1">
                <Input
                  placeholder="File path"
                  value={file.filePath || ''}
                  onChange={(e) => handleUpdateFile(index, 'filePath', e.target.value)}
                  className="bg-[#0c1c2a] border-[#262626] flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleBrowseFile(index)}
                  className="border-[#262626]"
                  type="button"
                >
                  <FolderOpenIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="w-24">
                <Select
                  onValueChange={(value) => handleSelectCatalogFile(index, parseInt(value, 10))}
                >
                  <SelectTrigger className="bg-[#0c1c2a] border-[#262626]">
                    <SelectValue placeholder="Catalog" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#162b3d] border-[#262626] max-h-[300px]">
                    {Array.isArray(catalogFiles) && catalogFiles.length === 0 ? (
                      <SelectItem value="none" disabled>No catalog files</SelectItem>
                    ) : (
                      Array.isArray(catalogFiles) && catalogFiles.map((catalogFile) => (
                        <SelectItem key={catalogFile.id} value={catalogFile.id.toString()}>
                          {catalogFile.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-14">
                <Input
                  type="number"
                  min={0}
                  placeholder="Order"
                  value={file.loadOrder || 0}
                  onChange={(e) => handleUpdateFile(index, 'loadOrder', parseInt(e.target.value, 10))}
                  className="bg-[#0c1c2a] border-[#262626]"
                />
              </div>
              
              <Button
                variant="ghost"
                onClick={() => handleRemoveFile(index)}
                className="text-red-500 hover:text-red-700 hover:bg-transparent"
                type="button"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}