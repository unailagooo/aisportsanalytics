
import React, { useState } from 'react';
import type { AIAnalysisBet, BetSlipItem, QuantumVectorAnalysis } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { GemIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';
import { RadarChart } from './RadarChart';

interface ProphetsPickCardProps {
    pick: AIAnalysisBet | null;
    isLoading: boolean;
    error: string | null;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

const formatDate = (isoString: string) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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
        <div className="space-y-3">
            {sections.map(({ title, content, icon: Icon, color }) => (
                <div key={title}>
                    <h5 className={`font-bold text-xs uppercase flex items-center gap-1.5 ${color}`}><Icon className="w-4 h-4"/>{title}</h5>
                    <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line pl-2 border-l-2 border-gray-700 ml-2">{content}</p>
                </div>
            ))}
        </div>
    );
};

export const ProphetsPickCard: React.FC<ProphetsPickCardProps> = ({ pick, isLoading, error, onToggleBet, betSlip }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent animate-pulse-fast">Consultando al Profeta...</p>
                </div>
            );
        }
        if (error || !pick || (pick as any).error) {
            return (
                <div className="text-center text-yellow-400 p-8">
                    <p>{error || (pick as any).error}</p>
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
                odds: Number(pick.odds || 0),
                fiabilityScore: pick.fiabilityScore,
                matchDateTime: pick.matchDateTime,
                sport: pick.sport,
            });
        };

        return (
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    {/* Left side: Bet Info */}
                    <div>
                        <p className="text-sm text-brand-text-secondary">{pick.league}</p>
                        <p className="text-xl font-bold text-white">{pick.teamA} vs {pick.teamB}</p>
                        <p className="text-sm text-brand-text-secondary mt-1">{formatDate(pick.matchDateTime)}</p>
                        <div className="my-4 bg-gray-900/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-brand-accent">{pick.outcomeName}</p>
                            <p className="text-sm text-brand-text-secondary">{pick.marketName}</p>
                            <p className="font-mono text-3xl font-bold text-white mt-2">@{(Number(pick.odds) || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full bg-blue-600/50 hover:bg-blue-600/80 text-white font-semibold py-2 px-3 text-sm rounded transition-colors flex items-center justify-center gap-2"
                            >
                                <BrainCircuitIcon className="w-4 h-4"/> {isExpanded ? 'Ocultar Análisis' : 'Ver Análisis'}
                            </button>
                            <button 
                                onClick={handleToggle}
                                className={`w-full font-bold py-2 px-3 text-sm rounded transition-colors ${
                                    isInSlip 
                                    ? 'bg-red-800/70 hover:bg-red-700 text-white' 
                                    : 'bg-brand-accent/80 hover:bg-brand-accent text-brand-primary'
                                }`}
                            >
                                {isInSlip ? 'Quitar' : 'Añadir'}
                            </button>
                        </div>
                    </div>
                    {/* Right side: Gauges */}
                    <div className="flex justify-center items-center gap-4">
                        <div className="flex flex-col items-center">
                            <FiabilityGauge score={pick.fiabilityScore} size="large" />
                            <p className="text-sm font-bold text-brand-text-secondary mt-1">Fiability Score</p>
                        </div>
                        {pick.vectorInfluence && <RadarChart data={pick.vectorInfluence} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-700 animate-fade-in">
                        <StructuredAnalysisDisplay analysis={pick.justification} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mb-12 animate-fade-in">
             <div className="bg-brand-secondary rounded-xl shadow-2xl border-2 border-brand-accent/50 overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-brand-accent/30 via-brand-secondary to-brand-secondary">
                     <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                        <GemIcon className="w-7 h-7 text-brand-accent"/>
                        La Elección del Profeta
                    </h3>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};
