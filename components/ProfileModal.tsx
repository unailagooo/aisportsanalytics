
import React, { useState, useRef } from 'react';
import type { UserProfile } from '../types';
import { UserIcon, TrashIcon, LayersIcon, RefreshIcon } from './IconComponents';

interface ProfileModalProps {
    profiles: UserProfile[];
    activeProfileId: string | null;
    onSelectProfile: (id: string) => void;
    onCreateProfile: (name: string) => void;
    onDeleteProfile: (id: string) => void;
    onClose: () => void;
    onImportData: (data: UserProfile[]) => void;
    onExportData: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ profiles, activeProfileId, onSelectProfile, onCreateProfile, onDeleteProfile, onClose, onImportData, onExportData }) => {
    const [newProfileName, setNewProfileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importError, setImportError] = useState<string | null>(null);

    const handleCreate = () => {
        if (newProfileName.trim()) {
            onCreateProfile(newProfileName.trim());
            setNewProfileName('');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setImportError(null);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    if (Array.isArray(json)) {
                        onImportData(json);
                    } else {
                        setImportError("Invalid file format. Expected an array of profiles.");
                    }
                } catch (err) {
                    setImportError("Failed to parse JSON file.");
                }
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60]"
            onClick={onClose}
        >
            <div
                className="bg-brand-secondary border border-brand-accent/30 rounded-xl shadow-2xl w-full max-w-md m-4"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-brand-accent flex items-center gap-2">
                        <UserIcon />
                        Manage Profiles & Data
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                </header>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Data Vault Section */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-sm font-bold mb-2 text-brand-accent flex items-center gap-2"><LayersIcon className="w-4 h-4"/>Data Vault (Backup/Restore)</h4>
                        <p className="text-xs text-brand-text-secondary mb-3">Save your betting history and settings to a file to prevent data loss when refreshing.</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={onExportData}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-2 rounded transition-colors flex items-center justify-center gap-1"
                            >
                                Export Backup
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-2 rounded transition-colors flex items-center justify-center gap-1"
                            >
                                <RefreshIcon className="w-3 h-3"/> Restore Data
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept=".json" 
                                className="hidden" 
                            />
                        </div>
                        {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-brand-text">Select Profile</h4>
                        <div className="space-y-2">
                            {profiles.map(profile => (
                                <div 
                                    key={profile.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeProfileId === profile.id ? 'bg-brand-accent/20 border-brand-accent' : 'bg-gray-700/50 hover:bg-gray-600/50 border-transparent'} border`}
                                    onClick={() => onSelectProfile(profile.id)}
                                >
                                    <div>
                                        <span className="font-semibold text-brand-text block">{profile.name}</span>
                                        <span className="text-xs text-brand-text-secondary">Bankroll: ${profile.bankroll.toFixed(2)}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }}
                                        className="text-gray-500 hover:text-red-400 disabled:opacity-50"
                                        disabled={profiles.length <= 1}
                                        aria-label={`Delete profile ${profile.name}`}
                                    >
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold mb-2 mt-4 text-brand-text">Create New Profile</h4>
                        <div className="flex gap-2">
                             <input 
                                type="text"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Enter profile name..."
                                className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                             />
                             <button
                                onClick={handleCreate}
                                className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold px-4 rounded transition-colors"
                             >
                                 Create
                             </button>
                        </div>
                    </div>
                </div>
                 <footer className="p-3 bg-gray-900/50 text-right">
                    <button 
                        onClick={onClose}
                        className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-4 rounded transition-colors"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};
