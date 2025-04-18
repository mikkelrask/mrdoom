import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ViewToggle from '@/components/ViewToggle';
import GameCard from '@/components/GameCard';
import GameSettingsModal from '@/components/GameSettingsModal';
import { gameService } from '@/lib/gameService';
import { IMod, IDoomVersion } from '@shared/schema';

type ViewMode = 'grid' | 'list' | 'detail';

export const GamesPage: React.FC = () => {
  // State
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModId, setSelectedModId] = useState<number | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Fetch data
  const { data: versions = [] } = useQuery<IDoomVersion[]>({ 
    queryKey: ['/api/versions'],
  });
  
  const { data: mods = [], isLoading: isModsLoading } = useQuery<IMod[]>({
    queryKey: ['/api/mods', activeVersion],
    queryFn: () => gameService.getMods(activeVersion || undefined),
  });
  
  // Event handlers
  const handleVersionSelect = (version: string) => {
    setActiveVersion(version === activeVersion ? null : version);
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };
  
  const handleManageGames = () => {
    alert('Manage Games feature coming soon!');
  };
  
  const handleSettingsClick = (id: number) => {
    setSelectedModId(id);
    setIsSettingsModalOpen(true);
  };
  
  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setSelectedModId(null);
  };
  
  // Filter mods based on search query
  const filteredMods = mods.filter(mod => 
    searchQuery ? mod.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );
  
  // Find version object for each mod
  const getVersionForMod = (mod: IMod): IDoomVersion | undefined => {
    return versions.find((v: IDoomVersion) => v.id === mod.doomVersionId);
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header at the very top spans full width */}
      <Header onSearch={handleSearch} />
      
      {/* Main content area with sidebar and game display */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeVersion={activeVersion} 
          onVersionSelect={handleVersionSelect} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onManageGames={handleManageGames}
          />
          
          <div className="flex-1 overflow-y-auto p-4">
            {isModsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-40 bg-[#1c1c1c] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : filteredMods?.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-2xl font-mono mb-2">No mods found</h3>
                <p className="text-[#e6e6e6]">
                  {activeVersion 
                    ? `No mods installed for this Doom version.` 
                    : `No mods installed. Click "INSTALL" to add your first mod.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMods?.map(mod => {
                  const version = getVersionForMod(mod);
                  if (!version) return null;
                  
                  return (
                    <GameCard 
                      key={mod.id} 
                      mod={mod} 
                      doomVersion={version}
                      onSettingsClick={handleSettingsClick}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <GameSettingsModal 
        modId={selectedModId}
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
        doomVersions={versions}
      />
    </div>
  );
};

export default GamesPage;
