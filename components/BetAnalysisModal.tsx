import React from 'react';
import type { BetAnalysis, QuantumVectorAnalysis } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { FiabilityGauge } from './FiabilityGauge';
import { BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon } from './IconComponents';

interface BetAnalysisModalProps {
    bet: { marketName: string; outcomeName: string };
    analysisResult: BetAnalysis | null;
    isLoading: boolean;
    onClose: () => void;
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
        <div className="text-sm text-brand-text-secondary text-left w-full leading-relaxed mt-2 space-y-4">
            {sections.map(section => {
                 if (!section.content) return null;
                 const Icon = section.icon;
                 return (
                    <div key={section.title} className="bg-gray-900/40 p-3 rounded-lg border-l-4 border-gray-700">
                        <div className={`flex items-center gap-2 font-bold mb-1 ${section.color}`}>
                            <Icon className="w-5 h-5" />
                            {section.title}
                        </div>
                        <p className="whitespace-pre-line">{section.content}</p>
                    </div>
                );
            })}
        </div>
    );
};


export const BetAnalysisModal: React.FC<BetAnalysisModalProps> = ({ bet, analysisResult, isLoading, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60]"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 border border-brand-accent/30 rounded-xl shadow-2xl w-full max-w-md m-4"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-brand-accent">AI Bet Analysis</h3>
                    <p className="text-sm text-brand-text-secondary truncate">
                        {bet.outcomeName} <span className="text-xs">({bet.marketName})</span>
                    </p>
                </header>
                <div className="p-6">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-40">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-text-secondary animate-pulse-fast">Analyzing selection...</p>
                        </div>
                    )}
                    {!isLoading && analysisResult && (
                        <div className="flex flex-col items-center text-center gap-4 animate-fade-in">
                             <p className="text-sm text-brand-text-secondary">Fiability Score for this specific bet:</p>
                             <FiabilityGauge score={analysisResult.fiabilityScore} />
                             <StructuredAnalysisDisplay analysis={analysisResult.structuredAnalysis} />
                        </div>
                    )}
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