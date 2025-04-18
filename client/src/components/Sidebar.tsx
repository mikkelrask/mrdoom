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
      {/* App Logo */}
      <div className="w-12 h-12 mb-8 bg-[#162b3d] rounded-md flex items-center justify-center">
        <svg className="w-10 h-10 text-[#d41c1c]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 6V18L12 22L22 18V6L12 2ZM12 4.2L18 6.9V16.2L12 19.8L6 16.2V6.9L12 4.2ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" />
        </svg>
      </div>
      
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
