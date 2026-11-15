
import React, { useState, useEffect } from 'react';
import type { OddsAnalysisResult, OddsMovement, Sport } from '../types';
import { Sport as SportEnum } from '../types';
import { analyzeCustomOddsMovement, getTopOddsMovements, analyzeOddsMovement } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { WarningIcon, BrainCircuitIcon, SearchIcon, ActivityIcon, RefreshIcon, TrendingDownIcon, TrendingUpIcon } from './IconComponents';
import { OddsChart } from './OddsChart';
import { FiabilityGauge } from './FiabilityGauge';

const formatOdds = (odds: number | undefined | null) => (Number(odds) || 0).toFixed(2);

// --- SUB-COMPONENTS ---

const MovementCard: React.FC<{ movement: OddsMovement, onClick: () => void }> = ({ movement, onClick }) => {
    if (!movement) return null;
    
    const oldO = Number(movement.oldOdds) || 0;
    const newO = Number(movement.newOdds) || 0;
    const isDrop = newO < oldO;
    const diff = Math.abs(oldO - newO);
    const percentChange = oldO > 0 ? ((diff / oldO) * 100).toFixed(1) : '0.0';

    return (
        <div onClick={onClick} className="bg-brand-secondary border border-gray-700 hover:border-brand-accent p-4 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.01] shadow-lg group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-wider">{movement.league || 'Liga'}</span>
                    <h4 className="font-bold text-white text-md group-hover:text-brand-accent transition-colors truncate max-w-[200px]">{movement.match || 'Partido'}</h4>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${isDrop ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'}`}>
                    {isDrop ? <TrendingDownIcon className="w-3 h-3"/> : <TrendingUpIcon className="w-3 h-3"/>}
                    {percentChange}%
                </span>
            </div>
            
            <div className="flex items-center justify-between mt-3 bg-gray-800/50 p-3 rounded border border-gray-700/50">
                <div>
                    <p className="text-[10px] text-gray-400 mb-1">{movement.market || 'Mercado'}</p>
                    <p className="font-bold text-white text-sm">{movement.selection || 'Selección'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 line-through">@{formatOdds(movement.oldOdds)}</p>
                        <p className={`font-mono font-bold text-lg ${isDrop ? 'text-green-400' : 'text-red-400'}`}>
                            @{formatOdds(movement.newOdds)}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500">
                <span className="bg-gray-700/50 px-2 py-0.5 rounded">{movement.bookmaker || 'Market'}</span>
                <span>{movement.timestamp ? new Date(movement.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
            </div>
        </div>
    );
};

const AnalysisView: React.FC<{ analysis: OddsAnalysisResult, onBack: () => void }> = ({ analysis, onBack }) => {
    if (!analysis) return null;

    const { movement, verdict, analysis: details } = analysis;
    
    if (!movement || !verdict || !details) {
        return (
             <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in">
                <WarningIcon className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Error de Datos</h3>
                <p className="text-brand-text-secondary mb-6 text-center max-w-md">
                    La estructura del análisis recibido está incompleta. Esto puede ocurrir si la IA no pudo recuperar todos los detalles del mercado.
                </p>
                <button 
                    onClick={onBack} 
                    className="bg-brand-secondary hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors border border-gray-700"
                >
                    Volver
                </button>
             </div>
        );
    }

    const isDrop = (Number(movement.newOdds) || 0) < (Number(movement.oldOdds) || 0);

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="mb-6 bg-gray-800 hover:bg-gray-700 text-brand-text-secondary hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                &larr; Volver a la lista
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Verdict Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-brand-secondary rounded-xl p-1 border border-gray-700 shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-900 to-brand-secondary p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <BrainCircuitIcon className="w-8 h-8 text-brand-accent" />
                                <h2 className="text-2xl font-bold text-white">Análisis Forense de Mercado</h2>
                            </div>
                            
                            <div className="bg-gray-800/60 rounded-xl p-5 mb-6 flex flex-wrap gap-6 items-center justify-between border border-gray-700">
                                <div>
                                    <p className="text-xs text-brand-text-secondary uppercase tracking-wider mb-1">Movimiento Detectado</p>
                                    <p className="text-2xl font-bold text-white">{movement.selection}</p>
                                    <p className="text-sm text-gray-400">{movement.match} <span className="text-xs text-brand-accent">({movement.market})</span></p>
                                </div>
                                <div className="flex items-center gap-6 bg-gray-900/50 px-6 py-3 rounded-lg border border-gray-700">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Apertura</p>
                                        <span className="text-xl font-mono text-gray-400 line-through">@{formatOdds(movement.oldOdds)}</span>
                                    </div>
                                    <span className="text-2xl text-brand-accent">&rarr;</span>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Actual</p>
                                        <span className={`text-3xl font-mono font-bold ${isDrop ? 'text-green-400' : 'text-red-400'}`}>@{formatOdds(movement.newOdds)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Section */}
                            {movement.history && movement.history.length > 1 && (
                                <div className="bg-gray-900/40 rounded-xl p-4 mb-6 border border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Trayectoria de Cuota (24h)</h4>
                                    <OddsChart data={movement.history} />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="bg-brand-accent/10 p-5 rounded-lg border-l-4 border-brand-accent">
                                    <h4 className="font-bold text-brand-accent mb-2 uppercase text-sm tracking-wider">Veredicto de la IA</h4>
                                    <p className="text-white text-xl font-bold mb-2">{verdict.type || 'Análisis Pendiente'}</p>
                                    <p className="text-brand-text-secondary text-sm leading-relaxed">{verdict.summary || 'Sin resumen disponible.'}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                                        <p className="text-xs text-gray-400 uppercase mb-2 font-bold flex items-center gap-2"><SearchIcon className="w-3 h-3"/> Contexto</p>
                                        <p className="text-sm text-white">{details.context || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                                        <p className="text-xs text-gray-400 uppercase mb-2 font-bold flex items-center gap-2"><ActivityIcon className="w-3 h-3"/> Coherencia del Modelo</p>
                                        <p className="text-sm text-white">{details.modelCoherence || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-4">Métricas del Movimiento</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-400">Tipo</p>
                                <p className="font-bold text-white capitalize text-sm">{details.movementType || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-400">Velocidad</p>
                                <p className="font-bold text-white capitalize text-sm">{details.speed || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-400">Magnitud</p>
                                <p className="font-bold text-white text-sm">{details.magnitude || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-400">Recomendación</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                    verdict.recommendation === 'Follow' ? 'bg-green-600 text-white' :
                                    verdict.recommendation === 'Fade' ? 'bg-red-600 text-white' :
                                    'bg-yellow-600 text-white'
                                }`}>
                                    {verdict.recommendation || 'Wait'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-brand-secondary rounded-xl p-6 border border-gray-700 h-full flex flex-col items-center text-center">
                        <h3 className="text-lg font-bold text-white mb-6">Score de Fiabilidad</h3>
                        <div className="mb-6 transform scale-110">
                            <FiabilityGauge score={verdict.score || 50} size="large" />
                        </div>
                        <p className="text-sm text-gray-400 mb-8 px-4">Este score indica la probabilidad de que el movimiento esté respaldado por información real ("Smart Money") en lugar de ruido de mercado.</p>
                        
                        <div className="mt-auto w-full space-y-3">
                            <button className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 px-4 rounded transition-colors shadow-lg shadow-brand-accent/20">
                                Seguir Movimiento
                            </button>
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors">
                                Añadir a Watchlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const OddsMovementDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'manual'>('dashboard');
    const [analysis, setAnalysis] = useState<OddsAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Manual State
    const [manualSport, setManualSport] = useState('Football');
    const [match, setMatch] = useState('');
    const [market, setMarket] = useState('');
    const [selection, setSelection] = useState('');

    // Dashboard State
    const [dashboardSport, setDashboardSport] = useState<Sport>(SportEnum.Football);
    const [topMovements, setTopMovements] = useState<OddsMovement[]>([]);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);

    // Fetch dashboard movements on mount or sport change
    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadTopMovements();
        }
    }, [dashboardSport, activeTab]);

    const loadTopMovements = async () => {
        setIsDashboardLoading(true);
        setTopMovements([]);
        try {
            const data = await getTopOddsMovements(dashboardSport);
            if (Array.isArray(data)) {
                setTopMovements(data);
            } else {
                setTopMovements([]);
            }
        } catch (e) {
            console.error(e);
            setTopMovements([]);
        } finally {
            setIsDashboardLoading(false);
        }
    };

    const handleSelectMovement = async (movement: OddsMovement) => {
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await analyzeOddsMovement(movement);
            setAnalysis(result);
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualAnalyze = async () => {
        if (!match || !market || !selection) return;
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await analyzeCustomOddsMovement(manualSport, match, market, selection);
            setAnalysis(result);
        } catch (error) {
            console.error("Failed to analyze odds movement", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (analysis) {
        return <AnalysisView analysis={analysis} onBack={() => setAnalysis(null)} />;
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <LoadingSpinner />
                <p className="mt-6 text-xl font-bold text-white animate-pulse">Ejecutando Análisis Forense de Mercado...</p>
                <p className="text-brand-text-secondary mt-2">Reconstruyendo historial de cuotas y verificando volumen.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-lg">
                        <ActivityIcon className="w-8 h-8 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Odds Movement Scanner</h2>
                        <p className="text-brand-text-secondary">Detecta movimientos de dinero inteligente y cambios bruscos.</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-700">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'dashboard' ? 'border-brand-accent text-white bg-brand-accent/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Dashboard en Vivo
                </button>
                <button 
                    onClick={() => setActiveTab('manual')}
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'manual' ? 'border-brand-accent text-white bg-brand-accent/5' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <SearchIcon className="w-4 h-4"/> Análisis Manual
                </button>
            </div>

            {/* --- DASHBOARD VIEW --- */}
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in">
                    {/* Sport Selector */}
                    <div className="flex gap-3 mb-6 pb-2 overflow-x-auto no-scrollbar">
                        {Object.values(SportEnum).map(sport => (
                            <button
                                key={sport}
                                onClick={() => setDashboardSport(sport)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 border ${
                                    dashboardSport === sport 
                                    ? 'bg-brand-accent text-brand-primary border-brand-accent' 
                                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                }`}
                            >
                                {sport}
                            </button>
                        ))}
                    </div>

                    {isDashboardLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-text-secondary animate-pulse">Escaneando mercados globales (Handicaps, Over/Under, Props)...</p>
                        </div>
                    ) : topMovements.length === 0 ? (
                        <div className="text-center p-12 bg-brand-secondary rounded-xl border border-gray-700">
                            <WarningIcon className="w-12 h-12 mx-auto text-gray-600 mb-4"/>
                            <p className="text-brand-text-secondary text-lg">No se detectaron movimientos significativos recientes para {dashboardSport}.</p>
                            <p className="text-sm text-gray-500 mt-2">El mercado parece estable. Prueba con otro deporte o el análisis manual.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topMovements.map(move => (
                                <MovementCard 
                                    key={move.id} 
                                    movement={move} 
                                    onClick={() => handleSelectMovement(move)} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- MANUAL VIEW --- */}
            {activeTab === 'manual' && (
                <div className="max-w-2xl mx-auto bg-brand-secondary p-8 rounded-2xl border border-gray-800 shadow-xl animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4">Búsqueda Específica</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Deporte</label>
                            <select 
                                value={manualSport}
                                onChange={(e) => setManualSport(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                            >
                                <option value="Football">Football</option>
                                <option value="Basketball">Basketball</option>
                                <option value="Tennis">Tennis</option>
                                <option value="Baseball">Baseball</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Partido / Evento</label>
                            <input 
                                type="text" 
                                value={match}
                                onChange={(e) => setMatch(e.target.value)}
                                placeholder="Ej: Liverpool vs Chelsea"
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mercado</label>
                                <input 
                                    type="text" 
                                    value={market}
                                    onChange={(e) => setMarket(e.target.value)}
                                    placeholder="Ej: 1X2, Over/Under"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Selección</label>
                                <input 
                                    type="text" 
                                    value={selection}
                                    onChange={(e) => setSelection(e.target.value)}
                                    placeholder="Ej: Liverpool"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                />
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleManualAnalyze}
                            disabled={isLoading || !match || !market || !selection}
                            className="w-full mt-6 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <LoadingSpinner /> : <><RefreshIcon className="w-5 h-5"/> ANALIZAR MOVIMIENTO</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
