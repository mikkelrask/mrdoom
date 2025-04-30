import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DoomVersionIcon } from '@/icons/DoomIcons';
import { IDoomVersion } from '@shared/schema';
import logo from '../icons/logo.png';

interface SidebarProps {
  activeVersion: string | null;
  onVersionSelect: (versionId: string) => void; // Pass numeric version ID
}

export const Sidebar: React.FC<SidebarProps> = ({ activeVersion, onVersionSelect }) => {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['/api/versions'],
  });

  return (
    <div className="w-20 bg-[#0c1c2a] h-full flex flex-col items-center py-6 border-r border-[#162b3d]">
      {/* App Logo */}
      <div className="w-12 h-12 mb-12 bg-[#162b3d] rounded-md flex items-center justify-center">
        <img src={logo} alt="Logo" className="w-12 h-12" />
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
              className={`sidebar-icon ${activeVersion === version.id ? 'active' : ''} flex-col`}
              onClick={() => onVersionSelect(version.id)} // Pass numeric ID
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
