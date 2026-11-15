import React, { useState } from 'react';
import type { BetSlipItem, CategorizedBestBets } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { BetCard } from './BetCard';
import { BrainCircuitIcon, ShieldIcon, DollarSignIcon, TestTubeIcon, SearchIcon } from './IconComponents';

interface BestBetsDashboardProps {
    onBack: () => void;
    betSlip: BetSlipItem[];
    onToggleBet: (item: BetSlipItem) => void;
    bestBets: CategorizedBestBets | null;
    isLoading: boolean;
    error: string | null;
    onSearch: (filters: { dateRange?: { startDate: string, endDate: string }, sport?: string, match?: string }) => void;
}

export const BestBetsDashboard: React.FC<BestBetsDashboardProps> = ({ onBack, betSlip, onToggleBet, bestBets, isLoading, error, onSearch }) => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(nextWeek.toISOString().split('T')[0]);
    const [sport, setSport] = useState('');
    const [match, setMatch] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearchClick = () => {
        setHasSearched(true);
        onSearch({
            dateRange: startDate && endDate ? { startDate, endDate } : undefined,
            sport: sport.trim() || undefined,
            match: match.trim() || undefined
        });
    };

    const renderContent = () => {
        if (!hasSearched && !bestBets && !isLoading) {
            return (
                <div className="text-center text-brand-text-secondary bg-brand-secondary p-12 rounded-xl mt-8 border border-gray-800">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-xl font-bold text-white mb-2">Listo para escanear el mercado</p>
                    <p className="text-sm">Configura tus filtros y haz clic en buscar para que la IA encuentre las mejores oportunidades.</p>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent animate-pulse-fast">AI is scanning all markets for elite opportunities...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg my-4">{error}</div>
            );
        }
        
        const noBetsFound = !bestBets || (
            (!bestBets.safestBets || bestBets.safestBets.length === 0) &&
            (!bestBets.valueBets || bestBets.valueBets.length === 0) &&
            (!bestBets.highRiskBets || bestBets.highRiskBets.length === 0)
        );
        
        if (noBetsFound) {
            return (
                 <div className="text-center text-brand-text-secondary bg-brand-secondary p-8 rounded-lg mt-8">
                    <p className="text-lg">No High-Conviction Bets Found</p>
                    <p className="text-sm mt-2">The AI has scanned the markets but did not find any bets that meet its strict criteria for the selected filters. Please try adjusting your search or check back later.</p>
                </div>
            )
        }

        return (
            <div className="space-y-12 animate-fade-in">
                {bestBets.safestBets?.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <ShieldIcon className="w-7 h-7 text-green-400"/>
                            Safest Bets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bestBets.safestBets.map((bet, index) => <BetCard key={`safe-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                )}

                 {bestBets.valueBets?.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <DollarSignIcon className="w-7 h-7 text-yellow-400"/>
                            Top Value Bets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bestBets.valueBets.map((bet, index) => <BetCard key={`value-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                 )}

                {bestBets.highRiskBets?.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <TestTubeIcon className="w-7 h-7 text-purple-400"/>
                            High-Risk Bets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bestBets.highRiskBets.map((bet, index) => <BetCard key={`hr-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <BrainCircuitIcon className="w-8 h-8 text-brand-accent"/>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">AI's Top Picks of the Day</h2>
                        <p className="text-brand-text-secondary">The highest-rated bets across all sports.</p>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    &larr; All Sports
                </button>
            </div>

            <div className="bg-brand-secondary rounded-xl p-4 mb-8 border border-gray-800 flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Deporte</label>
                    <input
                        type="text"
                        placeholder="Ej: Football, Basketball..."
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent"
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Partido Específico</label>
                    <input
                        type="text"
                        placeholder="Ej: Real Madrid vs Barcelona"
                        value={match}
                        onChange={(e) => setMatch(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent"
                    />
                </div>
                <div className="flex-1 min-w-[250px]">
                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Rango de Fechas</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent w-full"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent w-full"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSearchClick}
                    disabled={isLoading}
                    className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[38px] w-[48px]"
                    aria-label="Search"
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
            </div>

            {renderContent()}
        </div>
    );
};