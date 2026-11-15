import React, { useState } from 'react';
import { parseCustomBet } from '../services/geminiService';
import type { BetSlipItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { BrainCircuitIcon, TicketIcon, RefreshIcon, WarningIcon, ShieldCheckIcon } from './IconComponents';

interface ManualEntryModalProps {
    onClose: () => void;
    onAddBet: (item: BetSlipItem) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onAddBet }) => {
    const [description, setDescription] = useState('');
    const [oddsStr, setOddsStr] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!description.trim() || !oddsStr) return;
        
        setIsProcessing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const odds = parseFloat(oddsStr);
            const item = await parseCustomBet(description, odds);
            
            if (!item || !item.matchIdentifier || item.matchIdentifier === "null" || (item as any).matchIdentifier === null) {
                throw new Error("AI no ha podido identificar un partido real. Por favor, sé más específico (ej: Equipos, Liga, Fecha).");
            }

            onAddBet(item);
            setSuccessMessage(`Añadido: ${item.outcomeName} @ ${item.odds}`);
            // Clear description but keep window open for potential parlay additions
            setDescription('');
            setOddsStr('');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Error sincronizando con la base de datos de eventos.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0D0D0D] rounded-3xl shadow-[0_0_50px_rgba(0,245,160,0.15)] w-full max-w-md border border-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/20 rounded-lg">
                            <TicketIcon className="w-6 h-6 text-brand-accent" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Manual Bet Builder</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
                </header>
                
                <div className="p-8 space-y-6">
                    <p className="text-xs text-brand-text-secondary leading-relaxed bg-gray-800/30 p-3 rounded-xl border border-gray-700">
                        El motor Nexus-9 verificará la fecha del partido, los equipos oficiales y estandarizará el formato para tu historial y bankroll.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Descripción del Pronóstico</label>
                            <input 
                                type="text" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Real Madrid vs Milan - Over 2.5..."
                                className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-brand-accent shadow-inner font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Cuota (Decimal)</label>
                            <input 
                                type="number" 
                                value={oddsStr}
                                onChange={(e) => setOddsStr(e.target.value)}
                                placeholder="Ej: 1.90"
                                step="0.01"
                                className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-brand-accent font-mono text-center text-xl shadow-inner"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 p-4 rounded-xl text-red-400 text-xs flex items-start gap-3 border border-red-500/30 animate-fade-in">
                            <WarningIcon className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="bg-brand-accent/10 p-4 rounded-xl text-brand-accent text-xs flex items-center gap-3 border border-brand-accent/20 animate-fade-in">
                            <div className="bg-brand-accent rounded-full p-1"><ShieldCheckIcon className="w-3 h-3 text-brand-primary" /></div>
                            <p className="font-bold">{successMessage}</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            onClick={handleAdd}
                            disabled={isProcessing || !description || !oddsStr}
                            className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-4 px-6 rounded-2xl transition-all transform active:scale-95 disabled:opacity-30 shadow-[0_0_20px_rgba(0,245,160,0.2)] flex items-center justify-center gap-3 text-lg"
                        >
                            {isProcessing ? <LoadingSpinner /> : <><BrainCircuitIcon className="w-6 h-6"/> VERIFICAR Y AÑADIR</>}
                        </button>
                        
                        {isProcessing && (
                            <p className="text-center mt-4 text-brand-accent font-mono text-[10px] animate-pulse tracking-[0.3em] uppercase">Sincronizando con satélites...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};