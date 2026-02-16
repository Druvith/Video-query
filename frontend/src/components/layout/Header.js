import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconLogo } from '../icons/Icons';

const Header = ({ title, showBack }) => (
  <header className="py-6 border-b border-border-subtle bg-canvas/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
    <div className="container mx-auto px-6 flex justify-between items-center max-w-6xl">
        <div className="flex items-center gap-4">
            {showBack && (
                <Link to="/" className="text-text-muted hover:text-text-main transition-colors p-2 -ml-2 rounded-full hover:bg-panel">
                    <IconArrowLeft />
                </Link>
            )}
            <Link to="/" className="flex items-center gap-3 font-serif text-xl font-bold text-text-main no-underline tracking-tight group">
                <div className="text-text-main group-hover:text-accent-primary transition-colors duration-500">
                  <IconLogo />
                </div>
                <span>Video Query <span className="text-accent-primary">.</span></span>
            </Link>
        </div>
        {title && (
          <span className="hidden md:inline-block text-xs font-mono text-text-muted bg-panel px-4 py-1.5 rounded-full border border-border-subtle/50">
            {title}
          </span>
        )}
    </div>
  </header>
);

export default Header;
