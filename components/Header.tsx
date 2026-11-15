
import React from 'react';
import { BrainCircuitIcon, SettingsIcon, UserIcon } from './IconComponents';

interface HeaderProps {
    onOpenSettings: () => void;
    onOpenProfile: () => void;
    activeProfileName?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenProfile, activeProfileName }) => {
  return (
    <header className="bg-brand-secondary/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <BrainCircuitIcon className="w-8 h-8 text-brand-accent" />
            <h1 className="ml-3 text-xl font-bold tracking-wider text-brand-text">
            AI Sports Analytics Pro
            </h1>
        </div>
        <div className="flex items-center gap-2">
            {activeProfileName && <span className="text-sm font-semibold text-brand-text-secondary hidden sm:block">{activeProfileName}</span>}
            <button
                onClick={onOpenProfile}
                className="text-brand-text-secondary hover:text-brand-accent transition-colors duration-200 p-2 rounded-full hover:bg-gray-700"
                aria-label="Open User Profiles"
            >
                <UserIcon className="w-6 h-6" />
            </button>
            <button
                onClick={onOpenSettings}
                className="text-brand-text-secondary hover:text-brand-accent transition-colors duration-200 p-2 rounded-full hover:bg-gray-700"
                aria-label="Open Settings"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
      <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>
    </header>
  );
};