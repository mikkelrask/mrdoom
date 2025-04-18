import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Settings, Menu } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  return (
    <header className="bg-[#162b3d] p-4 flex items-center justify-between border-b border-[#262626]">
      {/* Logo and Search Bar */}
      <div className="flex items-center">
        {/* App Logo */}
        <div className="w-10 h-10 mr-4 bg-[#162b3d] rounded-md flex items-center justify-center">
          <svg className="w-8 h-8 text-[#d41c1c]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 6V18L12 22L22 18V6L12 2ZM12 4.2L18 6.9V16.2L12 19.8L6 16.2V6.9L12 4.2ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" />
          </svg>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-96">
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="SEARCH ..." 
              className="w-full bg-gray-200 text-[#1c1c1c] px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d41c1c]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex space-x-12 text-xl font-mono">
        <Link href="/">
          <span className={`nav-tab ${location === '/' ? 'active' : ''} cursor-pointer`}>
            GAMES
          </span>
        </Link>
        <Link href="/moddb">
          <span className={`nav-tab ${location === '/moddb' ? 'active' : ''} cursor-pointer`}>
            MODDB
          </span>
        </Link>
        <Link href="/install">
          <span className={`nav-tab ${location === '/install' ? 'active' : ''} cursor-pointer`}>
            INSTALL
          </span>
        </Link>
      </nav>
      
      {/* User Profile */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-[#0c1c2a] rounded-md p-1">
          <div className="w-8 h-8 rounded bg-[#d41c1c] flex items-center justify-center text-white">
            R
          </div>
          <span className="text-white font-mono ml-2 mr-1">ROBOTEARS</span>
          <span className="text-xs text-[#e6e6e6]">LVL 71</span>
        </div>
        <button className="w-8 h-8 bg-[#0c1c2a] rounded flex items-center justify-center hover:bg-[#162b3d]">
          <Settings className="h-5 w-5" />
        </button>
        <button className="w-8 h-8 bg-[#0c1c2a] rounded flex items-center justify-center hover:bg-[#162b3d]">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
