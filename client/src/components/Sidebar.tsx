import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameService } from '@/lib/gameService';
import { DoomVersionIcon } from '@/icons/DoomIcons';
import { IDoomVersion } from '@shared/schema';

interface SidebarProps {
  activeVersion: string | null;
  onVersionSelect: (version: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeVersion, onVersionSelect }) => {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['/api/versions'],
  });

  return (
    <div className="w-20 bg-[#0c1c2a] h-full flex flex-col items-center py-6 border-r border-[#162b3d]">      
      {/* Doom Version Filters */}
      <div className="flex flex-col space-y-6">
        {isLoading ? (
          // Loading skeleton
          Array(6).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="sidebar-icon w-12 h-12 rounded-md flex items-center justify-center animate-pulse bg-[#162b3d]"
            />
          ))
        ) : (
          // Render version icons
          Array.isArray(versions) && versions.map((version: IDoomVersion) => (
            <div
              key={version.id}
              className={`sidebar-icon ${activeVersion === version.slug ? 'active' : ''}`}
              onClick={() => onVersionSelect(version.slug)}
            >
              <DoomVersionIcon version={version.slug} />
              <span className="sr-only">{version.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
