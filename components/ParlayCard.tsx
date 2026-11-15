
import React, { useMemo } from 'react';
import type { AIRecommendedParlay, AIRecommendedParlayLeg, QuantumVectorAnalysis } from '../types';
import { LayersIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface ParlayCardProps {
    parlay: AIRecommendedParlay;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
}

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;

    const sections: { title: string; content: string; icon: React.FC<{className?: string}>; color: string }[] = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];

    return (
        <div className="text-sm text-brand-text-secondary leading-relaxed space-y-3 mt-2 border-l-2 border-blue-400/50 pl-3">
            {sections.map((section) => {
                if (!section.content) return null;
                 const Icon = section.icon;
                return (
                    <div key={section.title}>
                        <p className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${section.color}`}>
                           <Icon className="w-3.5 h-3.5" /> {section.title}
                        </p>
                        <p className="text-xs mt-1 whitespace-pre-line">{section.content.replace(/^- /gm, '• ')}</p>
                    </div>
                );
            })}
        </div>
    );
};

export const ParlayCard: React.FC<ParlayCardProps> = ({ parlay, onAddParlayToSlip }) => {
    const displayOdds = useMemo(() => {
        if (!parlay?.legs?.length) return 0;
        return parlay.legs.reduce((acc, leg) => acc * (Number(leg.odds) || 1), 1);
    }, [parlay]);

    if (!parlay) return null;

    return (
        <div className="bg-brand-secondary rounded-lg shadow-lg p-4 flex flex-col justify-between border border-gray-700 hover:border-blue-400/50 transition-colors duration-300">
            <div>
                <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-white">{parlay.parlayType}</h3>
                </div>

                <div className="flex flex-col items-center mb-4">
                    <p className="text-xs text-brand-text-secondary mb-1">Viability Score</p>
                    <FiabilityGauge score={parlay.viabilityScore} size="large" />
                </div>
                
                <div className="flex justify-around items-center mb-4 text-center border-y border-gray-700 py-3">
                     <div>
                        <p className="text-xs text-brand-text-secondary">Selections</p>
                        <p className="font-mono text-xl font-bold text-white">{parlay.legs?.length || 0}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary">Total Odds</p>
                        <p className="font-mono text-xl font-bold text-brand-accent">@{displayOdds.toFixed(2)}</p>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    {(parlay.legs || []).map((leg, index) => (
                        <div key={index} className="bg-gray-800/50 rounded p-2 text-sm">
                            <p className="font-bold text-white truncate">{leg.outcomeName} <span className="font-mono text-brand-accent">@{(Number(leg.odds) || 0).toFixed(2)}</span></p>
                            <p className="text-xs text-brand-text-secondary truncate">{leg.teamA} vs {leg.teamB}</p>
                        </div>
                    ))}
                </div>

                <StructuredAnalysisDisplay analysis={parlay.analysis} />
            </div>
             <div className="mt-4">
                <button 
                    onClick={() => onAddParlayToSlip(parlay.legs || [])}
                    className="w-full bg-blue-500/80 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <LayersIcon className="w-5 h-5" />
                    Add Parlay to Slip
                </button>
            </div>
        </div>
    );
};
