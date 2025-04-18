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
  const imagePlaceholder = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&h=160&q=80';
  
  return (
    <div className="game-card">
      <div className="h-40 overflow-hidden relative">
        <img 
          src={mod.screenshotPath || imagePlaceholder} 
          alt={mod.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = imagePlaceholder;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <h3 className="absolute bottom-2 left-3 text-white font-mono text-lg font-bold">{mod.title}</h3>
      </div>
      <div className="absolute bottom-2 right-3">
        <DoomVersionIcon version={doomVersion.slug} className="w-7 h-7" />
      </div>
      <div className="card-actions">
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
