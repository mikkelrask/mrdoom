import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { IMod, IModFile, IDoomVersion } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '@/lib/gameService';
import { useToast } from '@/hooks/use-toast';
import ModFileList from './ModFileList';
import LaunchOptions from './LaunchOptions';

interface GameSettingsModalProps {
  modId: number | null;
  isOpen: boolean;
  onClose: () => void;
  doomVersions: IDoomVersion[] | undefined;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({ 
  modId, 
  isOpen, 
  onClose,
  doomVersions
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [mod, setMod] = useState<IMod | null>(null);
  const [files, setFiles] = useState<IModFile[]>([]);
  
  // Fetch mod details
  const { data, isLoading } = useQuery({
    queryKey: [`/api/mods/${modId}`],
    enabled: !!modId && isOpen,
  });
  
  // Update mod mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, mod, files }: { id: number, mod: Partial<IMod>, files: Omit<IModFile, 'id' | 'modId'>[] }) => 
      gameService.updateMod(id, mod, files),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Mod settings saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mods'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete mod mutation
  const deleteMutation = useMutation({
    mutationFn: gameService.deleteMod,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Mod deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mods'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete mod: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Launch mod mutation
  const launchMutation = useMutation({
    mutationFn: gameService.launchMod,
    onSuccess: () => {
      toast({
        title: 'Game launched',
        description: `${mod?.title} is now running`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Launch failed',
        description: `Failed to launch game: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Initialize form state when data is loaded
  useEffect(() => {
    if (data) {
      setMod(data.mod);
      setFiles(data.files);
    }
  }, [data]);
  
  const handleSave = () => {
    if (!mod || !modId) return;
    
    const filesWithoutIds = files.map(f => ({
      fileName: f.fileName,
      filePath: f.filePath,
      fileType: f.fileType,
      loadOrder: f.loadOrder,
      isRequired: f.isRequired
    }));
    
    updateMutation.mutate({ 
      id: modId, 
      mod, 
      files: filesWithoutIds 
    });
  };
  
  const handleDelete = () => {
    if (!modId) return;
    if (confirm('Are you sure you want to delete this mod?')) {
      deleteMutation.mutate(modId);
    }
  };
  
  const handleLaunch = () => {
    if (!modId) return;
    launchMutation.mutate(modId);
  };
  
  const handleUpdateFromModDB = () => {
    toast({
      title: 'Not implemented',
      description: 'ModDB update feature is not implemented yet',
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMod(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setMod(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#162b3d] text-white border-[#262626] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono font-bold">{mod?.title}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-4 text-center">Loading mod details...</div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="mb-4">
                <img 
                  src={mod?.screenshotPath || 'https://images.unsplash.com/photo-1634898010511-df5fe04d2252?auto=format&fit=crop&w=800&h=300&q=80'} 
                  alt={mod?.title} 
                  className="w-full h-64 object-cover rounded"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="title">Mod Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={mod?.title || ''} 
                    onChange={handleInputChange} 
                    className="bg-[#0c1c2a] border-[#262626]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={mod?.description || ''} 
                    onChange={handleInputChange} 
                    className="bg-[#0c1c2a] border-[#262626]"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-mono mb-2">Game Configuration</h3>
                  <div className="bg-[#0c1c2a] p-3 rounded space-y-2">
                    <div>
                      <Label htmlFor="doomVersionId">Base Game</Label>
                      <Select 
                        value={mod?.doomVersionId?.toString() || ''} 
                        onValueChange={(value) => handleSelectChange('doomVersionId', value)}
                      >
                        <SelectTrigger className="bg-[#162b3d] border-[#262626]">
                          <SelectValue placeholder="Select Doom Version" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#162b3d] border-[#262626] text-white">
                          {doomVersions?.map(version => (
                            <SelectItem key={version.id} value={version.id.toString()}>
                              {version.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sourcePort">Source Port</Label>
                      <Input 
                        id="sourcePort" 
                        name="sourcePort" 
                        value={mod?.sourcePort || 'GZDoom'} 
                        onChange={handleInputChange} 
                        className="bg-[#162b3d] border-[#262626]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="saveDirectory">Save Directory</Label>
                      <Input 
                        id="saveDirectory" 
                        name="saveDirectory" 
                        value={mod?.saveDirectory || ''} 
                        onChange={handleInputChange} 
                        className="bg-[#162b3d] border-[#262626]"
                        placeholder="~/.config/gzdoom/saves/"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-mono mb-2">Mod Files</h3>
                  <ModFileList files={files} onChange={setFiles} />
                </div>
              </div>
              
              <LaunchOptions 
                launchParameters={mod?.launchParameters || ''} 
                onChange={(params) => setMod(prev => prev ? { ...prev, launchParameters: params } : null)} 
              />
            </div>
            
            <DialogFooter className="flex justify-between mt-6">
              <div>
                <Button 
                  variant="outline" 
                  onClick={handleDelete} 
                  className="bg-[#0c1c2a] hover:bg-[#162b3d] text-white border-[#262626]"
                  disabled={deleteMutation.isPending}
                >
                  Delete Instance
                </Button>
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  onClick={handleSave} 
                  className="mr-2 bg-[#0c1c2a] hover:bg-[#162b3d] text-white border-[#262626]"
                  disabled={updateMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button 
                  onClick={handleLaunch} 
                  className="bg-[#d41c1c] hover:bg-[#b21616] text-white"
                  disabled={launchMutation.isPending}
                >
                  PLAY
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GameSettingsModal;
