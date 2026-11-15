
import React, { useState, useCallback } from 'react';
import type { LiveMatch, LiveInsight, BetSlipItem } from '../types';
import { searchLiveMatch, getLiveInsight, getCorrectedLiveInsight } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { LiveMatchCommandCard } from './LiveMatchCommandCard';
import { LiveIcon, SearchIcon, RefreshIcon, BrainCircuitIcon, WarningIcon } from './IconComponents';

export const LiveCommandCenterDashboard: React.FC<{
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
}> = ({ onBack, onToggleBet }) => {
    const [query, setQuery] = useState('');
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
    const [insights, setInsights] = useState<Record<string, LiveInsight | null>>({});
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [loadingOmega, setLoadingOmega] = useState<Record<string, boolean>>({});
    const [omegaErrors, setOmegaErrors] = useState<Record<string, string>>({}); // New state for Omega errors
    const [lastUpdate, setLastUpdate] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);

    const getMatchId = (match: LiveMatch) => `${match.teamA}-${match.teamB}-${match.league}`;

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoadingMatches(true);
        setError(null);
        setLiveMatches([]);
        setInsights({});
        setOmegaErrors({});
        
        try {
            const results = await searchLiveMatch(query);
            if (results.length === 0) {
                setError("No se detectaron transmisiones activas para este equipo.");
            } else {
                setLiveMatches(results);
                const now = Date.now();
                const newUpdates: Record<string, number> = {};
                results.forEach(m => newUpdates[getMatchId(m)] = now);
                setLastUpdate(newUpdates);
            }
        } catch (e) {
            setError("Error al interceptar el feed. Reintente.");
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleActivateOmega = async (match: LiveMatch) => {
        const id = getMatchId(match);
        setLoadingOmega(prev => ({ ...prev, [id]: true }));
        setOmegaErrors(prev => ({ ...prev, [id]: '' })); // Clear previous errors
        
        try {
            const insight = await getLiveInsight(match);
            if (!insight) throw new Error("Datos de IA no disponibles.");
            setInsights(prev => ({ ...prev, [id]: insight }));
        } catch (e) {
            console.error(e);
            setOmegaErrors(prev => ({ ...prev, [id]: 'Error al conectar con Nexus-9. Intente nuevamente.' }));
        } finally {
            setLoadingOmega(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleCorrectAnalysis = async (match: LiveMatch, correction: string) => {
        const id = getMatchId(match);
        setLoadingOmega(prev => ({ ...prev, [id]: true }));
        try {
            const correctedInsight = await getCorrectedLiveInsight(match, correction);
            setInsights(prev => ({ ...prev, [id]: correctedInsight }));
            setLastUpdate(prev => ({ ...prev, [id]: Date.now() }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOmega(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleUpdateTelemetry = async (match: LiveMatch) => {
        const id = getMatchId(match);
        setLoadingOmega(prev => ({ ...prev, [id]: true }));
        try {
            const results = await searchLiveMatch(`${match.teamA} vs ${match.teamB}`);
            if (results.length > 0) {
                const updatedMatch = results[0];
                setLiveMatches(prev => prev.map(m => getMatchId(m) === id ? updatedMatch : m));
                setLastUpdate(prev => ({ ...prev, [id]: Date.now() }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOmega(prev => ({ ...prev, [id]: false }));
        }
    };

    const getTimeSinceUpdate = (id: string) => {
        const last = lastUpdate[id];
        if (!last) return "N/A";
        const seconds = Math.floor((Date.now() - last) / 1000);
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m`;
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                        <LiveIcon className="w-8 h-8 text-red-500 animate-pulse"/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Void Terminal</h2>
                        <p className="text-xs text-brand-text-secondary font-mono tracking-widest">ESTADO: STANDBY - CONSUMO: 0.0%</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg border border-gray-700 transition-all">
                    &larr; CERRAR SESIÓN
                </button>
            </div>

            {liveMatches.length === 0 && !loadingMatches && (
                <div className="max-w-3xl mx-auto py-20 text-center animate-fade-in">
                    <div className="mb-10 opacity-20">
                         <BrainCircuitIcon className="w-24 h-24 mx-auto text-gray-500"/>
                         <p className="font-mono text-xs mt-4 tracking-[0.5em]">NEXUS-9 LIVE INTERCEPTOR v2.0</p>
                    </div>
                    <form onSubmit={handleSearch} className="relative group">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Introduce el nombre de un equipo para interceptar su feed en vivo..."
                            className="w-full bg-black/40 border-2 border-gray-800 rounded-2xl py-6 pl-16 pr-6 text-xl text-white focus:outline-none focus:border-brand-accent transition-all shadow-2xl backdrop-blur-xl"
                        />
                    </form>
                    <p className="text-[10px] text-gray-600 mt-6 font-mono uppercase tracking-[0.3em]">Solo consume créditos al detectar una transmisión activa.</p>
                </div>
            )}

            {loadingMatches && (
                <div className="flex flex-col items-center justify-center py-20">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent font-mono text-xs animate-pulse tracking-[0.2em]">ESCANEANDO SATÉLITES... INTERCEPTANDO FEED</p>
                </div>
            )}

            {error && (
                <div className="max-w-md mx-auto bg-red-900/10 border border-red-500/30 p-6 rounded-xl text-center animate-fade-in">
                    <WarningIcon className="w-8 h-8 text-red-500 mx-auto mb-3"/>
                    <p className="text-red-400 font-bold">{error}</p>
                    <button onClick={() => setLiveMatches([])} className="mt-4 text-xs text-gray-500 underline">Volver al Standby</button>
                </div>
            )}

            {liveMatches.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center bg-brand-secondary p-4 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-ping"></span>
                            <span className="text-xs font-black text-white uppercase tracking-widest">{liveMatches.length} FEED(S) ACTIVOS</span>
                        </div>
                        <button onClick={() => setLiveMatches([])} className="text-xs text-gray-500 hover:text-red-500 transition-colors uppercase font-bold tracking-tighter">Limpiar Terminal</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {liveMatches.map(match => {
                            const id = getMatchId(match);
                            const insight = insights[id];
                            const isOmegaLoading = loadingOmega[id];
                            const errorMessage = omegaErrors[id];

                            return (
                                <div key={id} className="bg-brand-secondary rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col group hover:border-gray-600 transition-all">
                                    <div className="p-6 border-b border-gray-800 bg-black/20">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{match.league}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-600 font-mono">LATENCIA: {getTimeSinceUpdate(id)}</span>
                                                <button 
                                                    onClick={() => handleUpdateTelemetry(match)}
                                                    className="p-1 hover:text-brand-accent transition-colors"
                                                    title="Update Telemetry"
                                                >
                                                    <RefreshIcon className={`w-4 h-4 ${isOmegaLoading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center px-4">
                                            <div className="text-center w-1/3">
                                                <p className="text-white font-black text-sm uppercase truncate">{match.teamA}</p>
                                            </div>
                                            <div className="text-center w-1/3">
                                                <span className="text-4xl font-black text-white font-mono">{match.scoreA} - {match.scoreB}</span>
                                                <p className={`text-xs font-black animate-pulse mt-1 ${match.status === 'live' ? 'text-red-500' : 'text-gray-500'}`}>
                                                    {match.status === 'live' ? `${match.minute}'` : match.status.toUpperCase()}
                                                </p>
                                            </div>
                                            <div className="text-center w-1/3">
                                                <p className="text-white font-black text-sm uppercase truncate">{match.teamB}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-grow flex flex-col">
                                        {!insight ? (
                                            <div className="flex flex-col items-center justify-center py-10">
                                                <button 
                                                    onClick={() => handleActivateOmega(match)}
                                                    disabled={isOmegaLoading}
                                                    className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-4 px-10 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-brand-accent/20"
                                                >
                                                    {isOmegaLoading ? <LoadingSpinner /> : <><BrainCircuitIcon className="w-6 h-6"/> ACTIVAR OMEGA</>}
                                                </button>
                                                <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-bold">Inyectar IA Forense (Sofascore/Flashscore Data)</p>
                                                {errorMessage && (
                                                    <p className="text-red-400 text-xs mt-3 bg-red-900/10 p-2 rounded border border-red-500/20">{errorMessage}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in space-y-6">
                                                <LiveMatchCommandCard 
                                                    match={match}
                                                    insight={insight}
                                                    isLoadingInsight={isOmegaLoading}
                                                    onToggleBet={onToggleBet}
                                                    onCorrectAnalysis={(correction) => handleCorrectAnalysis(match, correction)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
