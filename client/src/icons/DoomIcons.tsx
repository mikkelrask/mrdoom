import React from 'react';
import doom from './doom.png';
import doom2 from './doom2.png';
import freedoom from './freedoom.png';
import freedoom2 from './freedoom2.png';
import plutonia from './plutonia.png';
import tnt from './tnt.png';

// SVG icons for the Doom versions
interface DoomIconProps {
  className?: string;
}

export const DoomIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <img src={doom} alt="Doom Icon" className={className} />
);

export const Doom2Icon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <img src={doom2} alt="Doom 2 Icon" className={className} />
);

export const FreeDoomIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <img src={freedoom} alt="FreeDoom Icon" className={className} />
);

export const FreeDoom2Icon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <img src={freedoom2} alt="FreeDoom 2 Icon" className={className} />
);

export const PlutoniaIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <img src={plutonia} alt="Plutonia Icon" className={className} />
);

export const TntIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <img src={tnt} alt="TNT Icon" className={className} />
);

interface DoomVersionIconProps {
  version: string;
  className?: string;
}

export const DoomVersionIcon: React.FC<DoomVersionIconProps> = ({ version, className }) => {
  switch (version) {
    case 'doom':
      return <DoomIcon className={className} />;
    case 'doom2':
      return <Doom2Icon className={className} />;
    case 'freedoom':
      return <FreeDoomIcon className={className} />;
    case 'freedoom2':
      return <FreeDoom2Icon className={className} />;
    case 'plutonia':
      return <PlutoniaIcon className={className} />;
    case 'tnt':
      return <TntIcon className={className} />;
    default:
      return <DoomIcon className={className} />;
  }
};
