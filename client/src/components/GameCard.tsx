import React from 'react';
import { IMod, IDoomVersion } from '@shared/schema';
import { DoomVersionIcon } from '@/icons/DoomIcons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '@/lib/gameService';
import { useToast } from '@/hooks/use-toast';

interface GameCardProps {
  mod: IMod;
  doomVersion: IDoomVersion;
  onSettingsClick: (id: number) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ mod, doomVersion, onSettingsClick }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const launchMutation = useMutation({
    mutationFn: gameService.launchMod,
    onSuccess: () => {
      toast({
        title: 'Game launched',
        description: `${mod.title} is now running`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Launch failed',
        description: `Failed to launch ${mod.title}: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const handleLaunch = () => {
    launchMutation.mutate(mod.id);
  };

  const handleSettings = () => {
    onSettingsClick(mod.id);
  };

  // Image fallback path if screenshot not available
  const imagePlaceholder = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&h=225&q=80';
  
  // Truncate description to a reasonable length for hover display
  const truncatedDescription = mod.description 
    ? mod.description.length > 120 
      ? mod.description.substring(0, 120) + '...' 
      : mod.description 
    : 'No description available';
  
  return (
    <div className="game-card group cursor-pointer relative">
      {/* Using aspect-ratio to enforce 16:9 ratio for screenshots */}
      <div className="aspect-w-16 aspect-h-9 overflow-hidden relative">
        <img 
          src={mod.screenshotPath || imagePlaceholder} 
          alt={mod.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = imagePlaceholder;
          }}
        />
        {/* Dark gradient overlay - always visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
        
        {/* Game title and icon container - starts at the bottom */}
        <div className="absolute inset-x-0 bottom-0 px-3 flex justify-between items-center 
                      transform transition-transform duration-300 group-hover:translate-y-[-100px] z-10">
          {/* Game title */}
          <h3 className="text-white font-mono text-lg font-bold">{mod.title}</h3>
          
          {/* Version icon */}
          <DoomVersionIcon version={doomVersion.slug} className="w-7 h-7" />
        </div>
        
        {/* Description panel that appears on hover */}
        <div className="absolute inset-0 px-4 flex items-center justify-center 
                      bg-black/60 opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300 pt-24 pb-16">
          <p className="text-white text-sm">{truncatedDescription}</p>
        </div>
      </div>
      
      {/* Action buttons that appear on hover at the bottom */}
      <div className="absolute bottom-0 left-0 w-full opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300 bg-[rgba(12,28,42,0.85)] 
                    flex items-center justify-between p-2">
        <button 
          className="px-4 py-1 text-white font-mono rounded bg-[#d41c1c] hover:bg-[#b21616] transition-colors"
          onClick={handleLaunch}
          disabled={launchMutation.isPending}
        >
          {launchMutation.isPending ? 'LAUNCHING...' : 'PLAY'}
        </button>
        <button 
          className="px-4 py-1 text-white font-mono rounded bg-[#0c1c2a] hover:bg-[#162b3d] transition-colors"
          onClick={handleSettings}
        >
          Settings
        </button>
      </div>
    </div>
  );
};

export default GameCard;
