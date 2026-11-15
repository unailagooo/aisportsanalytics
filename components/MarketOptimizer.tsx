
import React, { useState } from 'react';
import { getMarketOptimization } from '../services/geminiService';
import type { OptimizerResult, BetSlipItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { TargetIcon, RefreshIcon, DollarSignIcon, BrainCircuitIcon } from './IconComponents';

interface MarketOptimizerProps {
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

export const MarketOptimizer: React.FC<MarketOptimizerProps> = ({ onBack, onToggleBet, betSlip }) => {
    const [intuition, setIntuition] = useState('');
    const [result, setResult] = useState<OptimizerResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleOptimize = async () => {
        if (!intuition.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const data = await getMarketOptimization(intuition);
            setResult(data);
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
                    <div className="p-3 bg-yellow-400/20 rounded-lg">
                        <TargetIcon className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">The Market Optimizer</h2>
                        <p className="text-brand-text-secondary">Traduce tu intuición en la cuota más eficiente.</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-brand-secondary p-8 rounded-2xl border border-gray-800 shadow-xl mb-12">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">¿Cuál es tu opinión sobre el partido?</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text" 
                        value={intuition}
                        onChange={(e) => setIntuition(e.target.value)}
                        placeholder="Ej: Creo que el Madrid va a golear al Talavera hoy"
                        className="flex-grow bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                    <button 
                        onClick={handleOptimize}
                        disabled={isLoading || !intuition}
                        className="bg-yellow-400 hover:bg-yellow-500 text-brand-primary font-black px-8 py-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner /> : 'BUSCAR EDGE'}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-yellow-400 font-mono text-sm animate-pulse">ESCANEO DE MERCADOS DERIVADOS EN CURSO (1X2 vs ASIATICOS vs GOLES)...</p>
                </div>
            )}

            {result && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                    <div className="bg-gradient-to-r from-gray-900 via-brand-secondary to-gray-900 rounded-3xl p-8 border border-gray-700 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <DollarSignIcon className="w-32 h-32 text-yellow-400"/>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
                            <div className="text-center lg:text-left flex-grow">
                                <span className="bg-yellow-400/10 text-yellow-400 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-yellow-500/30">Selección Optimizada</span>
                                <h3 className="text-4xl font-black text-white mt-4 uppercase tracking-tighter">{result.selection}</h3>
                                <p className="text-brand-text-secondary text-lg mt-2">{result.suggestedMarket}</p>
                                <div className="mt-6 p-4 bg-gray-800/40 rounded-xl border-l-4 border-yellow-400">
                                    <p className="text-sm text-gray-300 italic leading-relaxed">"{result.reasoning}"</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-4 bg-gray-900/80 p-8 rounded-3xl border border-gray-700 min-w-[200px]">
                                <p className="text-[10px] text-gray-500 uppercase font-black">Mathematical Edge</p>
                                <div className="text-5xl font-black text-brand-accent">+{result.edgePercentage}%</div>
                                <div className="text-3xl font-mono font-bold text-white">@{Number(result.odds).toFixed(2)}</div>
                                <button 
                                    onClick={() => onToggleBet({ matchIdentifier: "Optimizer Selection", marketName: result.suggestedMarket, outcomeName: result.selection, odds: result.odds })}
                                    className="mt-4 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-2 px-6 rounded-lg text-xs"
                                >
                                    AÑADIR A SLIP
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                            <RefreshIcon className="w-4 h-4 text-gray-500"/> Alternativas Comparadas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.alternatives.map((alt, i) => (
                                <div key={i} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-gray-600 transition-all">
                                    <div>
                                        <p className="text-white font-bold text-sm">{alt.market}</p>
                                        <p className="text-[10px] text-brand-text-secondary mt-1">{alt.reason}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-mono font-bold text-gray-400">@{Number(alt.odds).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
