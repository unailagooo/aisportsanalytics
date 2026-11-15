
import React, { useState, useEffect, useCallback } from 'react';
import type { AIAnalysisBet, BetSlipItem, QuantumVectorAnalysis } from '../types';
import { getProphetsPick } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { GemIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';
import { RadarChart } from './RadarChart';

interface ProphetsPickModalProps {
  onClose: () => void;
  onToggleBet: (item: BetSlipItem) => void;
  betSlip: BetSlipItem[];
}

const formatDate = (isoString: string) => {
  if (!isoString) return "Hoy";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('es-ES', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  } catch (error) {
    return 'N/A';
  }
};

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
            {sections.map(({ title, content, icon: Icon, color }) => {
                if (!content || content === "N/A" || content === "Error") return null;
                return (
                    <div key={title} className="bg-gray-900/40 p-3 rounded-lg border-l-2 border-gray-700">
                        <h5 className={`font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 ${color} mb-1`}><Icon className="w-3 h-3"/>{title}</h5>
                        <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line">{content}</p>
                    </div>
                );
            })}
        </div>
    );
};


export const ProphetsPickModal: React.FC<ProphetsPickModalProps> = ({ onClose, onToggleBet, betSlip }) => {
    const [pick, setPick] = useState<AIAnalysisBet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const fetchPick = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getProphetsPick();
            if (!result || !result.teamA || !result.odds) {
                throw new Error("Respuesta de IA incompleta.");
            }
            setPick(result);
        } catch (err) {
            console.error(err);
            setError("La terminal Nexus-9 está recalibrando sus sensores. Por favor, intenta de nuevo en unos segundos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPick();
    }, [fetchPick]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-900/20">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent font-mono text-sm animate-pulse tracking-widest">SINCRONIZANDO CON EL PROFETA...</p>
                </div>
            );
        }
        if (error || !pick) {
            return (
                <div className="text-center text-yellow-400 p-12 flex flex-col items-center gap-4">
                    <WarningIcon className="w-12 h-12" />
                    <p className="font-bold text-lg">{error || 'No hay pronósticos disponibles.'}</p>
                    <button 
                        onClick={(e) => { e.preventDefault(); fetchPick(); }} 
                        className="bg-gray-800 px-6 py-2 rounded-lg text-white font-bold hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshIcon className="w-4 h-4"/> Recargar Terminal
                    </button>
                </div>
            );
        }

        const matchIdentifier = `${pick.teamA} vs ${pick.teamB}`;
        const isInSlip = betSlip.some(item => 
            item.matchIdentifier === matchIdentifier &&
            item.marketName === pick.marketName &&
            item.outcomeName === pick.outcomeName
        );

        const handleToggle = () => {
            onToggleBet({
                matchIdentifier: matchIdentifier,
                marketName: pick.marketName,
                outcomeName: pick.outcomeName,
                odds: pick.odds || 0,
                fiabilityScore: pick.fiabilityScore,
                matchDateTime: pick.matchDateTime,
                sport: pick.sport,
            });
        };

        return (
            <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{pick.sport}</span>
                             <span className="text-xs text-brand-text-secondary truncate font-mono">{pick.league}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase">{pick.teamA} vs {pick.teamB}</h2>
                        <p className="text-sm text-brand-text-secondary mt-1 font-mono">{formatDate(pick.matchDateTime)}</p>
                        
                        <div className="my-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-center border border-gray-700 shadow-2xl group transition-all duration-500 hover:border-brand-accent/50">
                            <p className="text-xs text-gray-500 uppercase tracking-[0.3em] mb-2">Selección Maestra</p>
                            <p className="text-3xl font-black text-brand-accent uppercase tracking-tighter">{pick.outcomeName}</p>
                            <p className="text-sm text-gray-400 mt-1 uppercase font-bold">{pick.marketName}</p>
                            <div className="inline-block mt-6 px-8 py-3 bg-brand-accent/10 border border-brand-accent/30 rounded-xl">
                                <p className="font-mono text-4xl font-black text-white">@{Number(pick.odds || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-500/30"
                            >
                                <BrainCircuitIcon className="w-5 h-5"/> {isExpanded ? 'Ocultar' : 'Auditar'}
                            </button>
                            <button 
                                onClick={handleToggle}
                                className={`w-full font-black py-3 px-4 rounded-xl transition-all shadow-lg transform hover:scale-[1.02] active:scale-95 ${
                                    isInSlip 
                                    ? 'bg-red-800 text-white border border-red-500/50' 
                                    : 'bg-brand-accent text-brand-primary'
                                }`}
                            >
                                {isInSlip ? 'QUITAR' : 'AÑADIR AL BOLETO'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-12 bg-gray-900/30 p-8 rounded-3xl border border-gray-800 shadow-inner">
                        <div className="flex flex-col items-center">
                            <FiabilityGauge score={pick.fiabilityScore} size="large" />
                            <p className="text-xs font-black text-brand-text-secondary mt-4 uppercase tracking-widest">Nexus Reliability</p>
                        </div>
                        <div className="w-px h-24 bg-gray-800 hidden md:block"></div>
                        {pick.vectorInfluence && <RadarChart data={pick.vectorInfluence} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="mt-12 pt-8 border-t border-gray-800 animate-fade-in space-y-6">
                        <h4 className="text-white font-black text-lg uppercase tracking-wider flex items-center gap-2">
                             <ChartLineIcon className="text-brand-accent" />
                             Desglose Forense Nexus-9
                        </h4>
                        <StructuredAnalysisDisplay analysis={pick.justification} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0A0A0A] rounded-3xl shadow-[0_0_50px_rgba(0,245,160,0.15)] w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-accent/20 rounded-2xl">
                             <GemIcon className="w-8 h-8 text-brand-accent"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">La Elección del Profeta</h3>
                            <p className="text-[10px] text-brand-accent font-mono tracking-widest uppercase">NEXUS-9 QUANTUM ADVISORY</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">&times;</button>
                </header>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
