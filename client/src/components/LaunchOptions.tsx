import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface LaunchOptionsProps {
  launchParameters: string;
  onChange: (parameters: string) => void;
}

export const LaunchOptions: React.FC<LaunchOptionsProps> = ({ launchParameters, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState(launchParameters);
  
  const handleEdit = () => {
    setIsEditing(!isEditing);
    
    if (isEditing) {
      onChange(parameters);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-mono">Launch Options</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEdit}
          className="text-xs bg-[#0c1c2a] border-[#262626]"
        >
          {isEditing ? 'Save Parameters' : 'Edit Parameters'}
        </Button>
      </div>
      
      <div className="bg-[#0c1c2a] p-3 rounded">
        {isEditing ? (
          <Textarea 
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
            className="bg-[#162b3d] border-[#262626] font-mono text-sm"
            placeholder="Enter additional launch parameters..."
            rows={2}
          />
        ) : (
          <code className="text-sm text-[#e6e6e6] font-mono block overflow-x-auto">
            {parameters || '-iwad doom.wad -file [your mod files] -savedir ~/.config/gzdoom/saves/'}
          </code>
        )}
      </div>
    </div>
  );
};

export default LaunchOptions;
