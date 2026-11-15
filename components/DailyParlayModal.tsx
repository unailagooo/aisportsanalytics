
import React, { useState, useEffect, useCallback } from 'react';
import type { DailyParlay, DailyParlayLeg, BetSlipItem, QuantumVectorAnalysis, DiscardedLeg } from '../types';
import { getDailyParlay, rerollDailyParlayLeg } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { 
    ShieldCheckIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, 
    LayersIcon, RefreshIcon, TargetIcon, ActivityIcon, 
    ChartLineIcon, TrendingUpIcon, TrashIcon
} from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface DailyParlayModalProps {
    onClose: () => void;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

const FragilityBricks: React.FC<{ fragility: number }> = ({ fragility }) => (
    <div className="flex gap-0.5" title={`Fragilidad: ${fragility}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
            <div 
                key={i} 
                className={`w-3 h-1.5 rounded-sm ${i < fragility ? 'bg-red-500' : 'bg-gray-700'}`}
            />
        ))}
    </div>
);

const AnalysisSection: React.FC<{ title: string, content: string | undefined, color: string, icon: any }> = ({ title, content, color, icon: Icon }) => {
    if (!content || content === 'N/A') return null;
    return (
        <div className="space-y-1">
            <h5 className={`font-black text-[9px] uppercase tracking-widest flex items-center gap-2 ${color}`}>
                <Icon className="w-3.5 h-3.5" /> {title}
            </h5>
            <p className="text-xs text-brand-text-secondary leading-relaxed border-l border-gray-800 pl-4 ml-1">
                {content}
            </p>
        </div>
    );
};

const DetailedAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-black/20 p-6 rounded-2xl border border-gray-800/50 mt-4 animate-fade-in">
            <AnalysisSection title="Vector Cuantitativo" content={analysis.vectorCuantitativo} color="text-blue-400" icon={ChartLineIcon} />
            <AnalysisSection title="Vector Momentum" content={analysis.vectorMomentum} color="text-purple-400" icon={RefreshIcon} />
            <AnalysisSection title="Vector Mercado" content={analysis.vectorMercado} color="text-yellow-400" icon={DollarSignIcon} />
            <AnalysisSection title="Simulación de Estrés" content={analysis.simulacionEstres} color="text-red-400" icon={WarningIcon} />
            <div className="md:col-span-2 pt-2 border-t border-gray-800/50">
                 <AnalysisSection title="Veredicto de Hierro" content={analysis.veredictoCuantico} color="text-brand-accent" icon={BrainCircuitIcon} />
            </div>
        </div>
    );
};

export const DailyParlayModal: React.FC<DailyParlayModalProps> = ({ onClose, onToggleBet, betSlip }) => {
    const [parlay, setParlay] = useState<DailyParlay | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedLeg, setExpandedLeg] = useState<number | null>(null);
    const [showGlobalAnalysis, setShowGlobalAnalysis] = useState(false);
    const [isRerollingLegIdx, setIsRerollingLegIdx] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setExpandedLeg(null);
        setShowGlobalAnalysis(false);
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const data = await getDailyParlay(tz);
            setParlay(data);
        } catch (e) {
            setError("Error al sincronizar con el Comité Central de Riesgos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isAdded = (leg: DailyParlayLeg) => betSlip.some(b => b.matchIdentifier === leg.match && b.outcomeName === leg.market);

    const handleRerollLeg = async (index: number) => {
        if (!parlay || !parlay.legs || isRerollingLegIdx !== null) return;
        
        setIsRerollingLegIdx(index);
        try {
            const legToReplace = parlay.legs[index];
            const newLeg = await rerollDailyParlayLeg(legToReplace, parlay);
            
            const updatedLegs = [...parlay.legs];
            updatedLegs[index] = newLeg;
            
            // Recalcular cuota total
            const newTotalOdds = updatedLegs.reduce((acc, leg) => acc * leg.odds, 1);
            
            setParlay({
                ...parlay,
                legs: updatedLegs,
                totalOdds: newTotalOdds
            });
        } catch (e) {
            console.error("Reroll failed", e);
        } finally {
            setIsRerollingLegIdx(null);
        }
    };

    const addAllToSlip = () => {
        if (!parlay || !parlay.legs) return;
        parlay.legs.forEach(leg => {
            if (!isAdded(leg)) {
                onToggleBet({
                    matchIdentifier: leg.match,
                    marketName: "Combinada del Día",
                    outcomeName: leg.market,
                    odds: leg.odds,
                    fiabilityScore: leg.probability,
                    sport: leg.sport
                });
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex justify-center items-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#080808] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,245,160,0.1)] w-full max-w-5xl max-h-[92vh] flex flex-col border border-gray-800/60 overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-gray-800/50 flex justify-between items-center bg-gray-900/20 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-brand-accent/10 rounded-3xl border border-brand-accent/20 shadow-[0_0_20px_rgba(0,245,160,0.05)]">
                             <ShieldCheckIcon className="w-10 h-10 text-brand-accent"/>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Bunker: Combinada del Día</h3>
                                <span className="bg-brand-accent text-brand-primary text-[9px] font-black px-2 py-0.5 rounded tracking-widest animate-pulse">ELITE VALUE</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono tracking-[0.4em] uppercase mt-1">NEXUS-9 RISK ADVISORY BOARD // NO-MEDIOCRE POLICY</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-600 hover:text-white transition-all p-3 hover:bg-gray-800/50 rounded-full text-2xl">&times;</button>
                </header>

                <div className="flex-grow overflow-y-auto p-6 md:p-12 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-80">
                            <LoadingSpinner />
                            <p className="mt-8 text-brand-accent font-mono text-sm animate-pulse tracking-[0.5em] uppercase">ESCRUTANDO VALOR ASIMÉTRICO...</p>
                            <p className="text-[10px] text-gray-600 mt-2 font-bold italic">Buscando ineficiencias matemáticas en el mercado de hoy.</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="p-6 bg-red-900/10 rounded-full mb-6 border border-red-500/20">
                                <WarningIcon className="w-16 h-16 text-red-500" />
                            </div>
                            <h4 className="text-xl font-bold text-red-400 mb-2">Fallo de Comunicación</h4>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8">{error}</p>
                            <button onClick={fetchData} className="bg-white text-black font-black py-4 px-10 rounded-2xl uppercase text-xs tracking-widest flex items-center gap-3 hover:scale-105 transition-transform"><RefreshIcon className="w-4 h-4"/> Forzar Reconexión</button>
                        </div>
                    ) : !parlay?.exists ? (
                        <div className="text-center py-20 animate-fade-in">
                            <div className="bg-yellow-900/5 p-12 rounded-[3rem] border border-yellow-500/10 max-w-2xl mx-auto shadow-inner">
                                <div className="p-6 bg-yellow-500/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
                                    <WarningIcon className="w-12 h-12 text-yellow-500 opacity-60" />
                                </div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">DÍA DE ABSTENCIÓN ESTRATÉGICA</h4>
                                <p className="text-yellow-500/60 text-md leading-relaxed font-medium">
                                    El mercado actual no ofrece cuotas que justifiquen el riesgo (Bajo Valor detectado). 
                                    Nexus-9 prioriza la preservación de capital hoy.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-16 animate-fade-in">
                            {/* Summary Header */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                <div className="lg:col-span-8 bg-gray-900/30 p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl relative group transition-all">
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${parlay.status === 'OPTIMO' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                            STATUS: {parlay.status}
                                        </span>
                                        <span className="text-[10px] text-gray-600 font-mono font-bold tracking-widest">{parlay.date}</span>
                                    </div>
                                    <h3 className="text-white font-black text-2xl md:text-3xl leading-snug italic tracking-tighter border-l-4 border-brand-accent pl-8">
                                        "{parlay.reasoning}"
                                    </h3>
                                    <button 
                                        onClick={() => setShowGlobalAnalysis(!showGlobalAnalysis)}
                                        className="mt-8 text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 hover:text-brand-accent transition-colors"
                                    >
                                        {showGlobalAnalysis ? '▲ Ocultar Computo Global' : '▼ Ver Computo Global de Riesgo'}
                                    </button>
                                </div>
                                <div className="lg:col-span-4 flex flex-col gap-4">
                                    <div className="bg-black/60 p-8 rounded-[2rem] border border-gray-800 flex flex-col items-center justify-center text-center shadow-xl group hover:border-brand-accent/30 transition-all">
                                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2">Multiplicador Final</p>
                                        <p className="text-6xl font-black text-white font-mono tracking-tighter">@{parlay.totalOdds.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-brand-accent/5 p-6 rounded-[2rem] border border-brand-accent/10 flex justify-around items-center">
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Seguridad</p>
                                            <p className="text-xl font-black text-brand-accent">{parlay.globalSecurityIndex}%</p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-800"></div>
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Profitability</p>
                                            <p className="text-xl font-black text-blue-400">{parlay.profitabilityIndex}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Global Analysis Expanded */}
                            {showGlobalAnalysis && (
                                <div className="animate-fade-in border-t border-gray-800 pt-10">
                                    <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                        <TrendingUpIcon className="w-5 h-5 text-brand-accent"/> SÍNTESIS DEL CÓMPUTO GLOBAL
                                    </h4>
                                    <DetailedAnalysisDisplay analysis={parlay.analysis} />
                                </div>
                            )}

                            {/* Legs Detail */}
                            <div className="space-y-6">
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                                    <LayersIcon className="w-5 h-5 text-gray-500"/> COMPOSICIÓN DE SELECCIONES ({parlay.legs?.length || 0})
                                </h4>
                                <div className="space-y-4">
                                    {(parlay.legs || []).map((leg, i) => {
                                        const isExpanded = expandedLeg === i;
                                        const isRerolling = isRerollingLegIdx === i;
                                        
                                        return (
                                            <div key={i} className={`bg-gray-900/20 border transition-all duration-500 rounded-3xl overflow-hidden relative ${isExpanded ? 'border-brand-accent/40 shadow-2xl scale-[1.01]' : 'border-gray-800 hover:border-gray-700'}`}>
                                                {isRerolling && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                                        <LoadingSpinner />
                                                        <p className="mt-4 text-brand-accent font-mono text-[10px] tracking-widest uppercase animate-pulse">Buscando alternativa de élite...</p>
                                                    </div>
                                                )}
                                                
                                                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                                                    <div className="flex-grow min-w-0 text-center md:text-left cursor-pointer" onClick={() => setExpandedLeg(isExpanded ? null : i)}>
                                                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                                            <span className="bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{leg.sport}</span>
                                                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest truncate">{leg.match}</p>
                                                        </div>
                                                        <h5 className="text-white font-black text-2xl uppercase tracking-tighter transition-colors group-hover:text-brand-accent">{leg.market}</h5>
                                                        <p className="text-sm text-gray-500 mt-2 italic leading-relaxed max-w-lg">"{leg.reason}"</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-12 border-t md:border-t-0 md:border-l border-gray-800 pt-6 md:pt-0 md:pl-12">
                                                        <div className="text-center">
                                                            <p className="text-[9px] text-gray-600 font-black uppercase mb-2 tracking-widest">Fragilidad</p>
                                                            <FragilityBricks fragility={leg.fragility} />
                                                        </div>
                                                        
                                                        <div className="text-center">
                                                            <p className="text-[9px] text-gray-600 font-black uppercase mb-2 tracking-widest">Certeza</p>
                                                            <p className="text-lg font-black text-white">{leg.probability}%</p>
                                                        </div>
                                                        
                                                        <div className="text-right min-w-[100px]">
                                                            <p className="text-[9px] text-gray-600 font-black uppercase mb-1 tracking-widest">Cuota</p>
                                                            <p className="font-mono text-3xl font-black text-brand-accent">@{leg.odds.toFixed(2)}</p>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleRerollLeg(i)}
                                                                className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:text-brand-accent hover:bg-brand-accent/10 transition-all group"
                                                                title="Reroll: Generar alternativa para esta pierna"
                                                            >
                                                                <RefreshIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setExpandedLeg(isExpanded ? null : i)}
                                                                className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-brand-accent text-brand-primary' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                                                title="Ver análisis detallado"
                                                            >
                                                                <ActivityIcon className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-8 pt-0 border-t border-gray-800/50">
                                                        <DetailedAnalysisDisplay analysis={leg.justification} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Discarded Selections Section */}
                            {parlay.discardedLegs && parlay.discardedLegs.length > 0 && (
                                <div className="space-y-6 pt-12 border-t border-gray-800/50">
                                    <h4 className="text-gray-500 font-black text-xs uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                        <TrashIcon className="w-5 h-5 text-gray-600"/> BASURERO DE VARIANZA (DESCARTES)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {parlay.discardedLegs.map((disc, idx) => (
                                            <div key={idx} className="bg-red-950/10 border border-red-900/20 p-6 rounded-2xl flex flex-col justify-between opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{disc.match}</p>
                                                        <span className="font-mono font-bold text-gray-500 text-xs">@{disc.odds.toFixed(2)}</span>
                                                    </div>
                                                    <h5 className="text-gray-400 font-bold text-sm uppercase">{disc.market}</h5>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-red-900/10">
                                                    <p className="text-[10px] text-red-500/70 font-black uppercase mb-1">Motivo del Descarte:</p>
                                                    <p className="text-xs text-gray-500 italic">"{disc.discardReason}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extra Metrics Footer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-12">
                                <div className="bg-gray-900/20 p-8 rounded-[2rem] border border-gray-800/50 flex flex-col justify-center">
                                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <ActivityIcon className="w-5 h-5 text-blue-500" /> Auditoría de Varianza
                                    </h4>
                                    <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-gray-800">
                                        <span className="text-[10px] text-gray-500 font-black uppercase">Expectativa de Valor (EV+)</span>
                                        <span className="text-2xl font-black text-blue-400">+{parlay.profitabilityIndex}%</span>
                                    </div>
                                    {parlay.weakLink && (
                                        <div className="mt-6 p-5 bg-red-900/5 border border-red-500/10 rounded-2xl flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <WarningIcon className="w-5 h-5 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                <span className="text-[10px] text-red-500/70 font-black uppercase">Punto de mayor varianza:</span>
                                            </div>
                                            <span className="text-xs text-white font-black uppercase tracking-tighter truncate max-w-[200px]">{parlay.weakLink}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-brand-secondary p-8 rounded-[2rem] border border-gray-800 flex flex-col justify-center items-center text-center shadow-xl">
                                    <div className="p-4 bg-gray-900 rounded-full mb-4 border border-gray-800">
                                        <TargetIcon className="w-8 h-8 text-brand-accent" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-3">Protocolo de Operación</p>
                                    <p className="text-gray-400 text-sm leading-relaxed max-w-sm italic">
                                        Plan de stake sugerido: <span className="text-brand-accent font-bold">GESTIÓN LINEAL</span>. 
                                        Diseñada para la <span className="text-white font-bold uppercase underline decoration-brand-accent/50 underline-offset-4 tracking-tighter">preservación patrimonial</span> y victoria matemática.
                                    </p>
                                </div>
                            </div>

                            {/* Final Actions */}
                            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-gray-800/50">
                                <button onClick={fetchData} className="flex-1 bg-gray-800/50 hover:bg-gray-800 text-white font-black py-6 rounded-3xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-gray-700">
                                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /> Reevaluar Escenario
                                </button>
                                <button 
                                    onClick={addAllToSlip}
                                    className="flex-[2] bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-6 rounded-3xl text-md uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_rgba(0,245,160,0.2)] flex items-center justify-center gap-4 transform hover:translate-y-[-4px] active:translate-y-0"
                                >
                                    <LayersIcon className="w-6 h-6" /> INYECTAR "IRON VALUE" AL BOLETO
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-6 bg-black/60 text-center border-t border-gray-800/50">
                    <p className="text-[9px] text-gray-700 font-mono tracking-[0.5em] uppercase">© 2026 NEXUS-9 INTELLIGENCE UNIT // ANTI-MEDIOCRE VALUE ENGINE</p>
                </footer>
            </div>
        </div>
    );
};
