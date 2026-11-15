import React, { useState } from 'react';
import type { UserPreferences, RiskProfile, OddsFormat, AppTheme, Sport } from '../types';
import { Sport as SportEnum } from '../types';
import { SettingsIcon } from './IconComponents';

interface SettingsModalProps {
    currentPreferences: UserPreferences;
    onSave: (preferences: UserPreferences) => void;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentPreferences, onSave, onClose }) => {
    const [prefs, setPrefs] = useState<UserPreferences>(currentPreferences);
    
    const handleSave = () => {
        onSave(prefs);
        onClose();
    };

    const handleFavoriteSportToggle = (sport: Sport) => {
        const favoriteSports = prefs.favoriteSports || [];
        const newFavorites = favoriteSports.includes(sport)
            ? favoriteSports.filter(s => s !== sport)
            : [...favoriteSports, sport];
        setPrefs(p => ({ ...p, favoriteSports: newFavorites }));
    };

    return (
         <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60]"
            onClick={onClose}
        >
            <div
                className="bg-brand-secondary border border-brand-accent/30 rounded-xl shadow-2xl w-full max-w-lg m-4"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-brand-accent flex items-center gap-2">
                        <SettingsIcon />
                        Personalize Your Dashboard
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                </header>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-brand-text">Theme</label>
                         <div className="grid grid-cols-2 gap-2">
                            {(['Dark', 'Light'] as AppTheme[]).map(theme => (
                                <button 
                                    key={theme}
                                    onClick={() => setPrefs(p => ({ ...p, theme }))}
                                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${prefs.theme === theme ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-brand-text">Your Risk Profile</label>
                        <p className="text-xs text-brand-text-secondary mb-3">This helps the AI tailor its 'Safest' and 'Value' bet suggestions to your preferred style.</p>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Conservative', 'Balanced', 'Aggressive'] as RiskProfile[]).map(profile => (
                                <button 
                                    key={profile}
                                    onClick={() => setPrefs(p => ({...p, riskProfile: profile}))}
                                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${prefs.riskProfile === profile ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {profile}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2 text-brand-text">Odds Format</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Decimal', 'American', 'Fractional'] as OddsFormat[]).map(format => (
                                <button 
                                    key={format}
                                    onClick={() => setPrefs(p => ({ ...p, oddsFormat: format }))}
                                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${prefs.oddsFormat === format ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2 text-brand-text">Favorite Sports</label>
                        <p className="text-xs text-brand-text-secondary mb-3">Select your favorite sports to highlight them on the dashboard (feature coming soon).</p>
                        <div className="flex flex-wrap gap-2">
                            {(Object.values(SportEnum) as Sport[]).map(sport => (
                                 <button 
                                    key={sport}
                                    onClick={() => handleFavoriteSportToggle(sport)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${prefs.favoriteSports?.includes(sport) ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {sport}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 <footer className="p-3 bg-gray-900/50 flex justify-end gap-2">
                     <button 
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-4 rounded transition-colors"
                    >
                        Save Preferences
                    </button>
                </footer>
            </div>
        </div>
    );
};