import React from 'react';

// SVG icons for the Doom versions
interface DoomIconProps {
  className?: string;
}

export const DoomIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V28H28V4H4ZM6 6H26V26H6V6ZM14 8V13H12V15H10V24H22V15H20V13H18V8H14ZM16 10H16.5V11H16V10ZM16 13H18V15H14V13H16ZM12 17H20V22H12V17Z" />
  </svg>
);

export const Doom2Icon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V28H28V4H4ZM6 6H26V26H6V6ZM10 8V10H14V12H10V22H14V18H16V22H20V12H16V10H20V8H10ZM12 14H14V16H12V14ZM16 14H18V16H16V14Z" />
  </svg>
);

export const FreeDoomIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V28H28V4H4ZM6 6H26V26H6V6ZM10 8V12H12V13H14V12H19V13H20V18H19V19H16V18H14V19H13V24H20V22H22V8H20V10H12V8H10ZM14 14H18V16H14V14Z" />
  </svg>
);

export const FreeDoom2Icon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V28H28V4H4ZM6 6H26V26H6V6ZM10 8V10H14V12H10V14H12V17H13V18H12V20H10V22H14V20H16V22H20V20H18V18H17V17H18V14H20V12H16V10H20V8H10ZM12 14H14V16H12V14ZM16 14H18V16H16V14Z" />
  </svg>
);

export const PlutoniaIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V28H28V4H4ZM6 6H26V26H6V6ZM12 8V10H14V8H12ZM18 8V10H20V8H18ZM12 12C10.9 12 10 12.9 10 14V22H14V20H18V22H22V14C22 12.9 21.1 12 20 12H12ZM12 14H20V18H12V14Z" />
  </svg>
);

export const TntIcon: React.FC<DoomIconProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V28H28V4H4ZM6 6H26V26H6V6ZM16 8C13.8 8 12 9.8 12 12V13H10V18H12V19C12 21.2 13.8 23 16 23C18.2 23 20 21.2 20 19V18H22V13H20V12C20 9.8 18.2 8 16 8ZM16 10C17.1 10 18 10.9 18 12V13H14V12C14 10.9 14.9 10 16 10ZM12 15H20V16H12V15ZM14 18H18V19C18 20.1 17.1 21 16 21C14.9 21 14 20.1 14 19V18Z" />
  </svg>
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
