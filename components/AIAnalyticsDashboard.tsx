import React, { useState, useEffect, useCallback } from 'react';
import type { Sport, SportAnalyticsDashboardData, Fixture, BetSlipItem, AIRecommendedParlayLeg, LiveMatch } from '../types';
import { getFixturesForSportLive } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { FixtureList } from './FixtureList';
import { BetCard } from './BetCard';
import { ParlayCard } from './ParlayCard';
import { LiveMatchCard } from './LiveMatchCard';
import { LiveIcon, DollarSignIcon, LayersIcon, ShieldIcon, RefreshIcon, TestTubeIcon, UsersIcon, WarningIcon, SearchIcon } from './IconComponents';
import { DateRangeFilter } from './DateRangeFilter';

interface AIAnalyticsDashboardProps {
    sport: Sport;
    analyticsData: SportAnalyticsDashboardData | null;
    isAnalyticsLoading: boolean;
    analyticsError: string | null;
    fixtureError: string | null;
    fixtures: Fixture[];
    leagues: string[];
    selectedLeagues: string[];
    onSelectLeague: (leagues: string[]) => void;
    onSelectFixture: (fixture: Fixture) => void;
    onLoadMoreFixtures: () => void;
    isFixturesLoading: boolean;
    hasMoreFixtures: boolean;
    betSlip: BetSlipItem[];
    onToggleBet: (item: BetSlipItem) => void;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
    onSelectLiveMatch: (match: LiveMatch) => void;
    isSearching: boolean;
    searchTerm: string;
    onAnalyticsDateSearch: (range: { startDate: string; endDate: string }) => void;
}

export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = (props) => {
    const {
        sport, analyticsData, isAnalyticsLoading, analyticsError, fixtureError,
        fixtures, leagues, selectedLeagues, onSelectLeague, onSelectFixture,
        onLoadMoreFixtures, isFixturesLoading, hasMoreFixtures,
        betSlip, onToggleBet, onAddParlayToSlip, onSelectLiveMatch,
        isSearching, searchTerm, onAnalyticsDateSearch
    } = props;
    const [activeTab, setActiveTab] = useState('dashboard');
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
    const [isLiveLoading, setIsLiveLoading] = useState(false);

    const handleFetchLiveMatches = useCallback(async () => {
        setIsLiveLoading(true);
        try {
            const matches = await getFixturesForSportLive(sport);
            setLiveMatches(Array.isArray(matches) ? matches : []);
        } catch (error) {
            console.error("Failed to fetch live matches", error);
            setLiveMatches([]);
        } finally {
            setIsLiveLoading(false);
        }
    }, [sport]);


    useEffect(() => {
        if (activeTab === 'live') {
            handleFetchLiveMatches();
        }
    }, [activeTab, handleFetchLiveMatches]);

    const renderDashboardContent = () => {
        if (isAnalyticsLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-24 bg-brand-secondary/30 rounded-2xl border border-dashed border-gray-800 mt-8">
                    <LoadingSpinner />
                    <p className="mt-6 text-brand-accent font-mono text-sm animate-pulse tracking-widest">EJECUTANDO VECTORES DE ANÁLISIS PARA {sport.toUpperCase()}...</p>
                    <p className="text-xs text-gray-500 mt-2 italic">Nexus-9 está consultando 45,000 fuentes de datos en tiempo real.</p>
                </div>
            );
        }
        
        if (analyticsError) {
            return (
                <div className="bg-red-900/10 text-red-400 border border-red-500/20 rounded-2xl p-12 text-center my-8 flex flex-col items-center gap-4">
                    <WarningIcon className="w-12 h-12" />
                    <div>
                        <p className="text-lg font-bold">Error de Conexión Cuántica</p>
                        <p className="text-sm opacity-70 mt-1">{analyticsError}</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-red-500/20 px-6 py-2 rounded-lg text-red-400 font-bold hover:bg-red-500/30 transition-all border border-red-500/30">Reintentar Sincronización</button>
                </div>
            );
        }

        const safestBets = Array.isArray(analyticsData?.safestBets) ? analyticsData.safestBets : [];
        const valueBets = Array.isArray(analyticsData?.valueBets) ? analyticsData.valueBets : [];
        const highRiskBets = Array.isArray(analyticsData?.highRiskBets) ? analyticsData.highRiskBets : [];
        const playerPropBets = Array.isArray(analyticsData?.playerPropBets) ? analyticsData.playerPropBets : [];
        const recommendedParlays = Array.isArray(analyticsData?.recommendedParlays) ? analyticsData.recommendedParlays : [];

        const noData = !analyticsData || (
            safestBets.length === 0 &&
            valueBets.length === 0 &&
            highRiskBets.length === 0 &&
            playerPropBets.length === 0 &&
            recommendedParlays.length === 0
        );

        if (noData) {
            return (
                <div className="text-center text-brand-text-secondary bg-brand-secondary p-12 rounded-2xl mt-8 border border-gray-800 flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-800/50 rounded-full">
                        <SearchIcon className="w-12 h-12 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-white uppercase tracking-tighter">Sin Oportunidades Detectadas</p>
                        <p className="text-sm mt-2 max-w-md mx-auto leading-relaxed">El motor de IA no ha encontrado brechas de mercado que cumplan con los estándares de fiabilidad institucional para {sport} en estas fechas.</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-16 animate-fade-in mt-8">
                {safestBets.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-8 bg-green-400 rounded-full"></div>
                            Safest Bets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {safestBets.map((bet, index) => <BetCard key={`safe-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                )}

                 {valueBets.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-8 bg-yellow-400 rounded-full"></div>
                            Top Value Bets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {valueBets.map((bet, index) => <BetCard key={`value-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                 )}

                {highRiskBets.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-8 bg-purple-400 rounded-full"></div>
                            High-Risk Bets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {highRiskBets.map((bet, index) => <BetCard key={`hr-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                )}

                {playerPropBets.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-8 bg-orange-400 rounded-full"></div>
                            Player Prop Picks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {playerPropBets.map((bet, index) => <BetCard key={`pp-${index}`} bet={bet} betSlip={betSlip} onToggleBet={onToggleBet} />)}
                        </div>
                    </section>
                )}

                {recommendedParlays.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-8 bg-blue-400 rounded-full"></div>
                            AI Recommended Parlays
                        </h2>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {recommendedParlays.map((parlay, index) => <ParlayCard key={`parlay-${index}`} parlay={parlay} onAddParlayToSlip={onAddParlayToSlip} />)}
                        </div>
                    </section>
                )}
            </div>
        )
    }
    
    const renderLiveContent = () => {
        return (
            <div className="animate-fade-in mt-8">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">In-Play Monitoring</h3>
                    <button 
                        onClick={handleFetchLiveMatches} 
                        disabled={isLiveLoading}
                        className="flex items-center gap-2 text-sm bg-brand-accent/10 text-brand-accent font-bold px-6 py-2 rounded-xl hover:bg-brand-accent/20 transition-all disabled:opacity-50 border border-brand-accent/20"
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLiveLoading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>

                {isLiveLoading ? (
                    <div className="flex flex-col items-center justify-center text-center py-24 bg-brand-secondary/30 rounded-2xl border border-dashed border-gray-800">
                        <LoadingSpinner />
                        <p className="mt-4 text-brand-accent font-mono text-xs animate-pulse tracking-[0.2em]">SYNCHRONIZING LIVE FEED...</p>
                    </div>
                ) : (!Array.isArray(liveMatches) || liveMatches.length === 0) ? (
                    <div className="text-center text-brand-text-secondary bg-brand-secondary p-16 rounded-2xl border border-gray-800">
                        <LiveIcon className="w-12 h-12 mx-auto text-gray-700 mb-4 opacity-30" />
                        <p className="text-xl font-bold text-white uppercase tracking-tighter">Sin Eventos en Vivo</p>
                        <p className="mt-2">No hay partidos de {sport} jugándose en este instante.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {liveMatches.map((match, idx) => (
                            <LiveMatchCard key={`${match.teamA}-${match.teamB}-${idx}`} match={match} onSelect={onSelectLiveMatch} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const renderFixturesContent = () => {
        if (isSearching) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-24">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent animate-pulse font-mono uppercase tracking-widest text-xs">Escaneando base de datos...</p>
                </div>
            );
        }
        if (isFixturesLoading && (!Array.isArray(fixtures) || fixtures.length === 0)) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-24">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent font-mono uppercase tracking-widest text-xs">Cargando fixture oficial...</p>
                </div>
            );
        }
        if (fixtureError && (!Array.isArray(fixtures) || fixtures.length === 0)) {
            return (
                 <div className="text-center text-brand-text-secondary bg-brand-secondary p-16 rounded-2xl border border-gray-800 mt-8">
                    <p className="text-lg font-bold text-white mb-2 uppercase">Fixture no disponible</p>
                    <p>{fixtureError}</p>
                </div>
            );
        }
        
        return (
            <FixtureList 
                fixtures={Array.isArray(fixtures) ? fixtures : []}
                leagues={Array.isArray(leagues) ? leagues : []}
                selectedLeagues={Array.isArray(selectedLeagues) ? selectedLeagues : []}
                onSelectLeague={onSelectLeague}
                onSelectFixture={onSelectFixture}
                onLoadMore={onLoadMoreFixtures}
                isLoading={isFixturesLoading}
                hasMorePages={hasMoreFixtures}
            />
        );
    }

    return (
        <div className="pb-12">
            <div className="mb-8 border-b border-gray-800 flex flex-wrap justify-between items-center gap-y-4">
                <div className="flex">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`py-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'text-brand-accent border-b-4 border-brand-accent bg-brand-accent/5' : 'text-gray-500 hover:text-white'}`}
                    >
                        AI Insights
                    </button>
                    <button 
                        onClick={() => setActiveTab('fixtures')}
                        className={`py-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'fixtures' ? 'text-brand-accent border-b-4 border-brand-accent bg-brand-accent/5' : 'text-gray-500 hover:text-white'}`}
                    >
                        Market List
                    </button>
                    <button 
                        onClick={() => setActiveTab('live')}
                        className={`py-4 px-6 text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'live' ? 'text-brand-accent border-b-4 border-brand-accent bg-brand-accent/5' : 'text-gray-500 hover:text-white'}`}
                    >
                        <div className="relative flex h-2 w-2 mr-1">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${activeTab === 'live' ? '' : 'hidden'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTab === 'live' ? 'bg-red-500' : 'bg-gray-600'}`}></span>
                        </div>
                        Live Command
                    </button>
                </div>
                {activeTab === 'dashboard' && (
                    <div className="mb-2">
                         <DateRangeFilter onSearch={onAnalyticsDateSearch} isLoading={isAnalyticsLoading} />
                    </div>
                )}
            </div>

            {activeTab === 'dashboard' && renderDashboardContent()}
            
            {activeTab === 'live' && renderLiveContent()}

            {activeTab === 'fixtures' && <div className="animate-fade-in">{renderFixturesContent()}</div>}
        </div>
    );
};