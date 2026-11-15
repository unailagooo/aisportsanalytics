import React from 'react';
import type { BetPostMortemAnalysis, CompletedBet } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { BrainCircuitIcon } from './IconComponents';

interface BetReviewModalProps {
    bet: CompletedBet;
    analysis: BetPostMortemAnalysis | null;
    isLoading: boolean;
    onClose: () => void;
}

export const BetReviewModal: React.FC<BetReviewModalProps> = ({ bet, analysis, isLoading, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[70]" onClick={onClose}>
            <div className="bg-gray-800 border border-brand-accent/30 rounded-xl shadow-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-brand-accent flex items-center gap-2"><BrainCircuitIcon /> AI Bet Review</h3>
                    <p className="text-sm text-brand-text-secondary truncate">{bet.outcomeName} ({bet.marketName})</p>
                    <p className="text-xs text-gray-400 truncate">{bet.matchIdentifier}</p>
                </header>
                <div className="p-6 min-h-[200px] flex items-center justify-center">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-text-secondary animate-pulse-fast">AI is reviewing the match outcome...</p>
                        </div>
                    )}
                    {!isLoading && analysis && (
                        <div className="w-full text-sm space-y-4 animate-fade-in">
                             <div className="text-center">
                                <p className="text-brand-text-secondary">Final Score</p>
                                <p className="text-2xl font-bold text-white">{analysis.finalScore}</p>
                            </div>
                            <div>
                                <p className="font-bold text-white">Key Factor:</p>
                                <p className="text-brand-text-secondary italic">"{analysis.keyFactor}"</p>
                            </div>
                            <div>
                                <p className="font-bold text-white">Analysis:</p>
                                <p className="text-brand-text-secondary leading-relaxed">{analysis.analysis}</p>
                            </div>
                        </div>
                    )}
                </div>
                <footer className="p-3 bg-gray-900/50 text-right">
                    <button onClick={onClose} className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-4 rounded transition-colors">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};