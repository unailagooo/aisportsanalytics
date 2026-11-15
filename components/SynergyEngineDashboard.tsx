
import React, { useState } from 'react';
import { getCorrelatedSynergy } from '../services/geminiService';
import type { SynergyResult, AIRecommendedParlayLeg, QuantumVectorAnalysis } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { PuzzleIcon, BrainCircuitIcon, DollarSignIcon, ChartLineIcon, RefreshIcon, WarningIcon, LayersIcon, ShieldCheckIcon, TargetIcon, ActivityIcon, SearchIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface SynergyEngineDashboardProps {
    onBack: () => void;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
}

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;
    const sections = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];
    return (
        <div className="space-y-4">
            {sections.map(s => s.content && s.content !== 'N/A' && (
                <div key={s.title} className="bg-gray-800/40 p-4 rounded-xl border-l-4 border-gray-700">
                    <h5 className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${s.color} mb-2`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.title}
                    </h5>
                    <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line">{s.content}</p>
                </div>
            ))}
        </div>
    );
};

export const SynergyEngineDashboard: React.FC<SynergyEngineDashboardProps> = ({ onBack, onAddParlayToSlip }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SynergyResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeResultIdx, setActiveResultIdx] = useState<number | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResults([]);
        setActiveResultIdx(null);
        try {
            const data = await getCorrelatedSynergy(query);
            if (data.length === 0) {
                setError("No se detectaron núcleos tácticos con sinergia explotable para esta consulta.");
            } else {
                setResults(data);
                setActiveResultIdx(0);
            }
        } catch (e) {
            setError("Error en la terminal de sinergia. La red de correlaciones está saturada.");
        } finally {
            setIsLoading(false);
        }
    };

    const activeResult = activeResultIdx !== null ? results[activeResultIdx] : null;

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                        <PuzzleIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Synergy Engine</h2>
                        <p className="text-[10px] text-blue-400 font-mono tracking-[0.3em] uppercase">Tactical Correlation Detector v1.0</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg border border-gray-700 transition-all uppercase text-xs">
                    &larr; Volver
                </button>
            </div>

            <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <PuzzleIcon className="w-32 h-32 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-6 text-center">Identificar Correlación Táctica (Año 2026)</h3>
                    <form onSubmit={handleSearch} className="relative group">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        <input 
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Ej: Real Madrid, Manchester City vs Arsenal..."
                            className="w-full bg-black/40 border-2 border-gray-800 rounded-2xl py-6 pl-16 pr-6 text-xl text-white focus:outline-none focus:border-blue-400 transition-all shadow-2xl"
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl text-xs uppercase shadow-lg disabled:opacity-30"
                        >
                            {isLoading ? <LoadingSpinner /> : 'ESCANEAR'}
                        </button>
                    </form>
                    <p className="text-[10px] text-gray-600 mt-4 text-center font-mono uppercase tracking-widest">
                        Busca eventos vinculados (Props, Stats, Tarjetas) basados en un núcleo táctico común.
                    </p>
                </div>
            </div>

            {error && (
                <div className="max-w-md mx-auto bg-red-900/10 border border-red-500/30 p-6 rounded-2xl text-center animate-fade-in mb-12">
                    <WarningIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-400 font-bold">{error}</p>
                </div>
            )}

            {results.length > 0 && activeResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-1 space-y-4">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">Núcleos Tácticos Detectados</h4>
                        {results.map((res, i) => (
                            <button 
                                key={i}
                                onClick={() => setActiveResultIdx(i)}
                                className={`w-full p-6 rounded-2xl text-left border-2 transition-all group ${activeResultIdx === i ? 'border-blue-500 bg-blue-500/5' : 'border-transparent bg-gray-900/50'}`}
                            >
                                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{res.matchTitle}</p>
                                <h5 className="text-white font-bold text-lg leading-tight uppercase group-hover:text-blue-400 transition-colors">{res.tacticalCore}</h5>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black uppercase">Sinergia: {res.synergyScore}%</span>
                                    <span className="font-mono font-black text-white">@{res.totalOdds.toFixed(2)}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
                             <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                                <div className="flex-grow">
                                    <span className="bg-blue-500/10 text-blue-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Análisis Forense de Sinergia</span>
                                    <h3 className="text-3xl font-black text-white mt-4 uppercase tracking-tighter leading-none">{activeResult.tacticalCore}</h3>
                                    <p className="text-brand-text-secondary text-sm mt-3 leading-relaxed italic border-l-4 border-blue-500/30 pl-4">"{activeResult.structuralJustification}"</p>
                                </div>
                                <div className="flex gap-4 bg-black/40 p-4 rounded-2xl border border-gray-800 min-w-[200px] justify-center">
                                     <div className="text-center">
                                        <FiabilityGauge score={activeResult.synergyScore} size="large" />
                                        <p className="text-[8px] text-gray-600 font-black mt-2 uppercase tracking-widest">Synergy Match</p>
                                    </div>
                                    <div className="w-px h-16 bg-gray-800 mx-4"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Multiplicador</p>
                                        <p className="text-3xl font-black text-brand-accent font-mono">@{activeResult.totalOdds.toFixed(2)}</p>
                                    </div>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <ActivityIcon className="w-4 h-4 text-brand-accent" /> Desglose de Componentes Vinculados
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeResult.legs.map((leg, i) => (
                                        <div key={i} className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Vínculo #{i+1}</span>
                                                    <span className="font-mono font-black text-white">@{leg.odds.toFixed(2)}</span>
                                                </div>
                                                <p className="text-white font-bold text-sm uppercase">{leg.outcomeName}</p>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{leg.marketName}</p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="h-1 flex-grow bg-gray-800 rounded-full mr-4 overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${leg.correlationFactor}%` }}></div>
                                                </div>
                                                <span className="text-[9px] text-blue-400 font-black uppercase whitespace-nowrap">Corr: {leg.correlationFactor}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             <div className="mt-10 pt-8 border-t border-gray-800">
                                 <StructuredAnalysisDisplay analysis={activeResult.analysis} />
                             </div>

                             <div className="mt-10">
                                <button 
                                    onClick={() => onAddParlayToSlip(activeResult.legs)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                                >
                                    <LayersIcon className="w-6 h-6"/> INYECTAR COMBINADA SINÉRGICA AL BOLETO
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
