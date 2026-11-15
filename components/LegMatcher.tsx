
import React, { useState } from 'react';
import { getLegMatcherOptions } from '../services/geminiService';
import type { AIAnalysisBet, BetSlipItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { LinkIcon, BrainCircuitIcon, DollarSignIcon } from './IconComponents';
import { BetCard } from './BetCard';

interface LegMatcherProps {
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

export const LegMatcher: React.FC<LegMatcherProps> = ({ onBack, onToggleBet, betSlip }) => {
    const [userPick, setUserPick] = useState('');
    const [options, setOptions] = useState<AIAnalysisBet[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!userPick.trim()) return;
        setIsLoading(true);
        setOptions([]);
        try {
            const result = await getLegMatcherOptions(userPick);
            setOptions(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-lg">
                        <LinkIcon className="w-8 h-8 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">The Leg Matcher</h2>
                        <p className="text-brand-text-secondary">Encuentra "anclas" de alta probabilidad para tu pick.</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-brand-secondary p-8 rounded-2xl border border-gray-800 shadow-xl mb-12">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Introduce tu selección principal</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text" 
                        value={userPick}
                        onChange={(e) => setUserPick(e.target.value)}
                        placeholder="Ej: Manchester City gana @1.45"
                        className="flex-grow bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-accent outline-none"
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={isLoading || !userPick}
                        className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black px-8 py-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner /> : 'BUSCAR ANCLAS'}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-4 italic">Nexus-9 buscará selecciones con probabilidad &gt;88% en todos los deportes disponibles hoy.</p>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent font-mono text-sm animate-pulse">ESCANEANDO MERCADOS GLOBALES EN BUSCA DE SELECCIONES SEGURAS...</p>
                </div>
            )}

            {options.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                        <BrainCircuitIcon className="text-brand-accent w-5 h-5"/> Selecciones Sugeridas para Combinar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {options.map((opt, i) => (
                            <BetCard key={i} bet={opt} onToggleBet={onToggleBet} betSlip={betSlip} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
