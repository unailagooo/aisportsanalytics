
import React from 'react';
import type { RecommendedBet } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { BrainCircuitIcon, StakeIcon } from './IconComponents';

interface RecommendedBetsProps {
    bets: RecommendedBet[];
    isLoading: boolean;
    error: string | null;
}

const StakeIndicator: React.FC<{ units: number }> = ({ units }) => {
    const maxUnits = 10;
    return (
        <div className="flex items-center gap-1" title={`Recommended Stake: ${units}/${maxUnits}`}>
            {Array.from({ length: maxUnits }).map((_, i) => (
                <div 
                    key={i} 
                    className={`h-4 w-2 rounded-sm ${i < units ? 'bg-brand-accent' : 'bg-gray-600'}`}
                />
            ))}
        </div>
    );
};

export const RecommendedBets: React.FC<RecommendedBetsProps> = ({ bets, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="bg-brand-secondary rounded-lg p-6 text-center mb-8">
                <LoadingSpinner />
                <p className="mt-4 text-brand-accent animate-pulse-fast">Searching for high-value bets...</p>
            </div>
        );
    }

    if (error) {
        return (
             <div className="bg-red-900/20 text-red-400 rounded-lg p-4 text-center mb-8">
                <p>{error}</p>
            </div>
        )
    }

    if (bets.length === 0) {
        return null; // Don't render anything if there are no recommendations
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <BrainCircuitIcon className="w-7 h-7 text-brand-accent"/>
                Top AI Picks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bets.map((bet, index) => (
                    <div key={index} className="bg-brand-secondary rounded-lg shadow-lg p-4 flex flex-col justify-between border border-gray-700 hover:border-brand-accent transition-colors">
                        <div>
                            <p className="text-xs text-brand-text-secondary">{bet.league}</p>
                            <p className="font-bold text-lg text-white">{bet.teamA} vs {bet.teamB}</p>
                            <div className="bg-gray-800/50 rounded-md p-3 my-3 text-center">
                                <p className="text-brand-accent font-bold text-xl">{bet.outcomeName}</p>
                                <p className="text-xs text-brand-text-secondary mb-1">({bet.marketName})</p>
                                <p className="font-mono text-lg font-bold text-white bg-brand-accent/20 px-3 py-1 rounded-md inline-block">@{bet.odds.toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-brand-text-secondary leading-relaxed italic border-l-2 border-brand-accent/50 pl-3">
                                "{bet.justification}"
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <StakeIcon className="w-5 h-5 text-brand-text-secondary" />
                                <span className="text-sm font-semibold">Stake: {bet.stakeUnits}/10</span>
                            </div>
                            <StakeIndicator units={bet.stakeUnits} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
