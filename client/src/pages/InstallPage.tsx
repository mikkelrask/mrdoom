import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModFileList from '@/components/ModFileList';
import { useToast } from '@/hooks/use-toast';
import { gameService } from '@/lib/gameService';
import { IMod, IModFile } from '@shared/schema';
import { slugify } from '@/lib/utils'; //Import added here

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  doomVersionId: z.string().min(1, "Base game is required"),
  sourcePort: z.string().min(1, "Source port is required"),
  saveDirectory: z.string().optional(),
  moddbId: z.string().optional(),
  screenshotPath: z.string().optional(),
  launchParameters: z.string().optional(),
});

export const InstallPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<IModFile[]>([]);

  // Fetch doom versions
  const { data: versions = [] } = useQuery<any[]>({ 
    queryKey: ['/api/versions'],
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      doomVersionId: "",
      sourcePort: "GZDoom",
      saveDirectory: "",
      launchParameters: "",
    },
  });

  // Create mod mutation
  const createMutation = useMutation({
    mutationFn: (data: { mod: Omit<IMod, 'id'>, files: Omit<IModFile, 'id' | 'modId'>[] }) => 
      gameService.createMod(data.mod, data.files),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Mod installed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mods'] });
      form.reset();
      setFiles([]);
      // Navigate to the Games page
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to install mod: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const handleVersionSelect = (version: string) => {
    setActiveVersion(version === activeVersion ? null : version);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const mod: Omit<IMod, 'id'> = {
      title: data.title,
      description: data.description,
      doomVersionId: parseInt(data.doomVersionId),
      sourcePort: data.sourcePort,
      saveDirectory: data.saveDirectory,
      moddbId: data.moddbId ? parseInt(data.moddbId) : undefined,
      screenshotPath: data.screenshotPath,
      launchParameters: data.launchParameters,
    };

    const fileData = files.map(file => ({
      fileName: file.fileName,
      filePath: file.filePath,
      fileType: file.fileType,
      loadOrder: file.loadOrder,
      isRequired: file.isRequired
    }));

    createMutation.mutate({ mod, files: fileData });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeVersion={activeVersion} 
        onVersionSelect={handleVersionSelect} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header onSearch={handleSearch} />

        <div className="flex-1 overflow-y-auto p-4">
          <Card className="bg-[#162b3d] border-[#262626] mb-6">
            <CardHeader>
              <CardTitle>Install New Mod</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mod Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter mod title" 
                                className="bg-[#0c1c2a] border-[#262626]" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Update save directory when title changes
                                  const sluggedTitle = slugify(e.target.value);
                                  form.setValue('saveDirectory', `/home/runner/workspace/saves/${sluggedTitle}`);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter mod description" 
                                className="bg-[#0c1c2a] border-[#262626]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="screenshotPath"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Screenshot URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter screenshot URL" 
                                className="bg-[#0c1c2a] border-[#262626]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="doomVersionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Game</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-[#0c1c2a] border-[#262626]">
                                  <SelectValue placeholder="Select Doom Version" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#162b3d] border-[#262626] text-white">
                                {versions.map((version) => (
                                  <SelectItem key={version.id} value={version.id.toString()}>
                                    {version.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sourcePort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Port</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="GZDoom" 
                                className="bg-[#0c1c2a] border-[#262626]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="saveDirectory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Save Directory (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="~/.config/gzdoom/saves/" 
                                className="bg-[#0c1c2a] border-[#262626]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="launchParameters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Launch Parameters (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="-skill 4 -warp 01" 
                                className="bg-[#0c1c2a] border-[#262626]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-mono mb-2">Mod Files</h3>
                    <p className="text-sm text-[#e6e6e6] mb-2">Add the mod files in the order they should be loaded.</p>
                    <ModFileList files={files} onChange={setFiles} />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-[#d41c1c] hover:bg-[#b21616]"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? 'Installing...' : 'Install Mod'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstallPage;