import React, { useState } from 'react';
import { MarketExplorerParams, MarketExplorerResult, MarketExplorerPick, BetSlipItem } from '../types';
import { exploreMarket } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon, LayersIcon, ShieldCheckIcon, TargetIcon, CalendarIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface MarketExplorerDashboardProps {
    onBack: () => void;
    betSlip: BetSlipItem[];
    onToggleBet: (bet: BetSlipItem) => void;
}

const StructuredAnalysisDisplay: React.FC<{ analysis?: MarketExplorerPick['analysis'] }> = ({ analysis }) => {
    if (!analysis) return null;

    const sections = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];

    return (
        <div className="text-sm text-brand-text-secondary leading-relaxed space-y-3 mt-4 border-l-2 border-brand-accent/30 pl-4">
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

export const MarketExplorerDashboard: React.FC<MarketExplorerDashboardProps> = ({ onBack, betSlip, onToggleBet }) => {
    const [market, setMarket] = useState('');
    const [match, setMatch] = useState('');
    const [dateRange, setDateRange] = useState('');
    const [targetOdds, setTargetOdds] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MarketExplorerResult | null>(null);

    const handleSearch = async () => {
        if (!market.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const params: MarketExplorerParams = {
                market: market.trim(),
                match: match.trim() || undefined,
                dateRange: dateRange.trim() || undefined,
                targetOdds: targetOdds.trim() || undefined,
            };
            const data = await exploreMarket(params);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Error al explorar el mercado.");
        } finally {
            setIsLoading(false);
        }
    };

    const isAdded = (pick: MarketExplorerPick) => betSlip.some(b => b.matchIdentifier === pick.matchIdentifier && b.outcomeName === pick.outcomeName);

    const renderPickCard = (pick: MarketExplorerPick, index: number) => {
        const added = isAdded(pick);
        return (
            <div key={index} className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-brand-accent/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs text-brand-accent font-bold uppercase tracking-widest mb-1">{pick.sport}</p>
                        <h4 className="text-lg font-black text-white">{pick.matchIdentifier}</h4>
                        <p className="text-sm text-gray-400">{new Date(pick.matchDateTime).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Cuota</p>
                        <span className="text-2xl font-black text-white font-mono">@{pick.odds.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-black/30 rounded-xl p-4 mb-4 flex justify-between items-center border border-gray-800">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{pick.marketName}</p>
                        <p className="text-lg font-bold text-brand-accent">{pick.outcomeName}</p>
                        {pick.bookmaker && (
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                Verificado en: {pick.bookmaker}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Fiabilidad</span>
                            <FiabilityGauge score={pick.fiabilityScore} size="small" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Valor</span>
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-400">{pick.valueScore}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {pick.historicalHitRate && (
                    <div className="mb-4 bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-3">
                        <p className="text-xs text-brand-accent font-bold uppercase tracking-widest mb-1">Tasa de Acierto Histórica</p>
                        <p className="text-sm text-white">{pick.historicalHitRate}</p>
                    </div>
                )}

                <StructuredAnalysisDisplay analysis={pick.analysis} />

                <button
                    onClick={() => onToggleBet({
                        matchIdentifier: pick.matchIdentifier,
                        marketName: pick.marketName,
                        outcomeName: pick.outcomeName,
                        odds: pick.odds,
                        fiabilityScore: pick.fiabilityScore,
                        sport: pick.sport,
                        matchDateTime: pick.matchDateTime
                    })}
                    className={`w-full mt-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                        added 
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30' 
                        : 'bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 border border-brand-accent/30'
                    }`}
                >
                    {added ? 'Eliminar del Cupón' : 'Añadir al Cupón'}
                </button>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <SearchIcon className="w-8 h-8 text-brand-accent" />
                        Explorador de Mercados
                    </h2>
                    <p className="text-brand-text-secondary mt-2">Búsqueda avanzada y rigurosa de picks con verificación en casas de apuestas oficiales.</p>
                </div>
                <button onClick={onBack} className="text-brand-accent hover:text-brand-accent/80 font-bold uppercase tracking-widest text-sm">
                    Volver
                </button>
            </div>

            <div className="bg-brand-secondary rounded-3xl p-6 border border-gray-800 mb-8">
                <div className="flex gap-4 mb-4">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Ej: Más de 2.5 goles, Puntos de jugador, Córners..."
                            value={market}
                            onChange={(e) => setMarket(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={!market.trim() || isLoading}
                        className="bg-brand-accent text-brand-primary font-black px-8 rounded-xl hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {isLoading ? 'Buscando...' : 'Explorar'}
                    </button>
                </div>

                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                >
                    <LayersIcon className="w-4 h-4" />
                    {showFilters ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados (Opcional)'}
                </button>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 animate-fade-in border-t border-gray-800 pt-6">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <TargetIcon className="w-3 h-3" /> Partido Específico
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Real Madrid vs Barcelona"
                                value={match}
                                onChange={(e) => setMatch(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CalendarIcon className="w-3 h-3" /> Fecha / Rango
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Hoy, Fin de semana, 25 de Marzo"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ChartLineIcon className="w-3 h-3" /> Cuota Buscada
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Mayor a 2.00, Cerca de 1.50"
                                value={targetOdds}
                                onChange={(e) => setTargetOdds(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent"
                            />
                        </div>
                    </div>
                )}
            </div>

            {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center">
                    <LoadingSpinner />
                    <p className="mt-6 text-brand-accent font-mono text-sm uppercase tracking-[0.3em] animate-pulse">
                        Sintetizando vectores del mercado...
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                    <WarningIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Error en la exploración</h3>
                    <p className="text-red-400/80">{error}</p>
                </div>
            )}

            {result && !isLoading && (
                <div className="space-y-12 animate-fade-in">
                    {result.picks ? (
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                <TargetIcon className="w-6 h-6 text-brand-accent" />
                                Resultados Filtrados ({result.picks.length})
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {result.picks.map((pick, i) => renderPickCard(pick, i))}
                            </div>
                            {result.picks.length === 0 && (
                                <p className="text-gray-500 text-center py-10">No se encontraron picks que coincidan con los filtros aplicados.</p>
                            )}
                        </div>
                    ) : result.categories ? (
                        <>
                            <section>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                                    Opciones Seguras
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {result.categories.seguras.map((pick, i) => renderPickCard(pick, i))}
                                </div>
                            </section>
                            
                            <section>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <DollarSignIcon className="w-6 h-6 text-blue-400" />
                                    Opciones Rentables (Value)
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {result.categories.rentables.map((pick, i) => renderPickCard(pick, i))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <WarningIcon className="w-6 h-6 text-red-400" />
                                    Opciones de Alto Riesgo
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {result.categories.highRisk.map((pick, i) => renderPickCard(pick, i))}
                                </div>
                            </section>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};
