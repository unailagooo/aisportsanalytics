import React, { useState } from 'react';
import type { StakingStrategy, CompletedBet, UserPreferences, BankrollCoachingAdvice } from '../types';
import { getBankrollCoachingAdvice } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { StakeIcon, BrainCircuitIcon } from './IconComponents';

interface BankrollManagerProps {
    bankroll: number;
    setBankroll: (value: number) => void;
    strategy: StakingStrategy;
    setStrategy: (value: StakingStrategy) => void;
    percentage: number;
    setPercentage: (value: number) => void;
    betHistory: CompletedBet[];
    userPreferences: UserPreferences;
}

export const BankrollManager: React.FC<BankrollManagerProps> = ({
    bankroll, setBankroll, strategy, setStrategy, percentage, setPercentage, betHistory, userPreferences
}) => {
    const [isCoaching, setIsCoaching] = useState(false);
    const [coachingAdvice, setCoachingAdvice] = useState<BankrollCoachingAdvice | null>(null);

    const handleGetCoaching = async () => {
        setIsCoaching(true);
        setCoachingAdvice(null);
        try {
            const advice = await getBankrollCoachingAdvice(betHistory, userPreferences);
            setCoachingAdvice(advice);
        } catch (e) {
            console.error(e);
            setCoachingAdvice({
                advice: "Could not retrieve coaching advice at this time. Please try again later.",
                positiveHabits: [],
                areasForImprovement: []
            });
        } finally {
            setIsCoaching(false);
        }
    };

    return (
        <div className="p-4 space-y-6 text-brand-text">
            <div className="text-center">
                <StakeIcon className="w-12 h-12 mx-auto text-brand-accent" />
                <h3 className="text-lg font-bold mt-2">Bankroll & Staking</h3>
                <p className="text-xs text-brand-text-secondary">Manage your virtual bankroll to see suggested stakes on your bets.</p>
            </div>

            <div>
                <label htmlFor="bankroll" className="block text-sm font-medium mb-1">
                    Current Bankroll ($)
                </label>
                <input 
                    type="number"
                    id="bankroll"
                    value={bankroll}
                    onChange={(e) => setBankroll(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-accent text-lg font-mono"
                />
            </div>

            <div>
                 <label className="block text-sm font-medium mb-2">Staking Strategy</label>
                 <div className="grid grid-cols-3 gap-2">
                    {(['Level', 'Percentage', 'Kelly'] as StakingStrategy[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setStrategy(s)}
                            className={`px-2 py-2 text-sm font-semibold rounded-lg transition-colors ${strategy === s ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {s}
                        </button>
                    ))}
                 </div>
                 <div className="text-xs text-brand-text-secondary mt-2 p-2 bg-gray-800/50 rounded-md min-h-[64px] flex items-center">
                    {strategy === 'Level' && 'Bet the same fixed amount on every selection, based on a percentage of your total bankroll.'}
                    {strategy === 'Percentage' && 'Bet a variable amount based on a percentage of your bankroll, adjusted by the AI\'s confidence score.'}
                    {strategy === 'Kelly' && 'An advanced strategy that calculates the optimal stake based on odds and perceived value (your edge). Aims to maximize long-term growth.'}
                 </div>
            </div>

            {(strategy === 'Level' || strategy === 'Percentage') && (
                 <div>
                    <label htmlFor="percentage" className="block text-sm font-medium mb-1">
                        Base Stake Percentage (%)
                    </label>
                    <div className="flex items-center gap-2">
                         <input 
                            type="range"
                            id="percentage"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={percentage}
                            onChange={(e) => setPercentage(parseFloat(e.target.value))}
                            className="w-full accent-brand-accent"
                        />
                        <span className="font-mono bg-gray-700 px-2 py-1 rounded-md text-sm">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2"><BrainCircuitIcon className="w-6 h-6 text-brand-accent"/>AI Bankroll Coach</h3>
                <p className="text-xs text-brand-text-secondary text-center mb-4">Get personalized feedback on your betting history.</p>
                <button
                    onClick={handleGetCoaching}
                    disabled={isCoaching || betHistory.length === 0}
                    className="w-full bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                    {isCoaching ? 'Analyzing...' : 'Get My Analysis'}
                </button>
                {betHistory.length === 0 && <p className="text-xs text-center text-yellow-400/80 mt-2">You need some bets in your history first.</p>}

                {isCoaching && <div className="flex justify-center mt-4"><LoadingSpinner/></div>}

                {coachingAdvice && (
                    <div className="mt-4 space-y-3 text-sm animate-fade-in bg-gray-800/50 p-3 rounded-lg">
                        <p className="italic text-brand-text-secondary">"{coachingAdvice.advice}"</p>
                        {coachingAdvice.positiveHabits.length > 0 && (
                            <div className="bg-green-900/20 p-2 rounded">
                                <p className="font-bold text-green-400">Positive Habits:</p>
                                <ul className="list-disc list-inside text-brand-text-secondary text-xs">
                                    {coachingAdvice.positiveHabits.map((habit, i) => <li key={i}>{habit}</li>)}
                                </ul>
                            </div>
                        )}
                        {coachingAdvice.areasForImprovement.length > 0 && (
                            <div className="bg-red-900/20 p-2 rounded">
                                <p className="font-bold text-red-400">Areas for Improvement:</p>
                                <ul className="list-disc list-inside text-brand-text-secondary text-xs">
                                    {coachingAdvice.areasForImprovement.map((area, i) => <li key={i}>{area}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};