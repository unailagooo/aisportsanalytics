

import React, { useState } from 'react';
import { runMatchSimulation } from '../services/geminiService';
import type { MatchSimulation, Sport } from '../types';
import { Sport as SportEnum } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { GamepadIcon, ChartLineIcon, TargetIcon, RefreshIcon, FootballIcon, CardIcon, CornerIcon } from './IconComponents';

interface SimulationDashboardProps {
    onBack: () => void;
}

const StatBar: React.FC<{ label: string, valueA: number, valueB: number, max?: number, colorA?: string, colorB?: string }> = ({ 
    label, valueA, valueB, max, colorA = 'bg-blue-500', colorB = 'bg-red-500' 
}) => {
    const total = valueA + valueB;
    const safeTotal = total === 0 ? 1 : total;
    const pctA = (valueA / safeTotal) * 100;
    const pctB = (valueB / safeTotal) * 100;

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1 px-1">
                <span className="font-bold text-white">{valueA}</span>
                <span className="uppercase tracking-wider">{label}</span>
                <span className="font-bold text-white">{valueB}</span>
            </div>
            <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={`${colorA}`} style={{ width: `${pctA}%` }}></div>
                <div className={`${colorB}`} style={{ width: `${pctB}%` }}></div>
            </div>
        </div>
    );
};

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ onBack }) => {
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [sport, setSport] = useState<Sport>(SportEnum.Football);
    const [simulation, setSimulation] = useState<MatchSimulation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSimulate = async () => {
        if (!teamA.trim() || !teamB.trim()) return;
        setIsLoading(true);
        setSimulation(null);
        setProgress(0);

        // Fake progress for effect
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 500);

        try {
            const result = await runMatchSimulation(teamA, teamB, sport);
            setSimulation(result);
            setProgress(100);
        } catch (error) {
            console.error(error);
            alert("Error running simulation. Please try again.");
        } finally {
            clearInterval(interval);
            setIsLoading(false);
        }
    };

    const renderResults = () => {
        if (!simulation) return null;

        return (
            <div className="animate-fade-in space-y-8">
                {/* Scoreboard */}
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
                    <div className="text-center mb-2">
                        <span className="text-xs font-mono text-green-400 uppercase tracking-widest animate-pulse">● SIMULATION COMPLETE</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="text-center w-1/3">
                            <h3 className="text-xl md:text-2xl font-bold text-white truncate">{simulation.teamA}</h3>
                            <div className="text-6xl font-bold text-blue-500 mt-2">{simulation.simulatedScore?.A ?? '-'}</div>
                        </div>
                        <div className="text-center w-1/3 flex flex-col items-center">
                            <span className="text-4xl text-gray-600 font-thin">VS</span>
                            <div className="mt-4 bg-gray-800 px-3 py-1 rounded text-xs text-gray-400">Probabilidad de Victoria</div>
                            <div className="flex gap-2 mt-1 text-xs font-bold justify-center">
                                <span className="text-blue-400" title={`${simulation.teamA} Win`}>{simulation.winProbabilities?.teamA ?? 0}%</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-gray-400" title="Draw">{simulation.winProbabilities?.draw ?? 0}%</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-red-400" title={`${simulation.teamB} Win`}>{simulation.winProbabilities?.teamB ?? 0}%</span>
                            </div>
                        </div>
                        <div className="text-center w-1/3">
                            <h3 className="text-xl md:text-2xl font-bold text-white truncate">{simulation.teamB}</h3>
                            <div className="text-6xl font-bold text-red-500 mt-2">{simulation.simulatedScore?.B ?? '-'}</div>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gray-400 mt-6 italic">"{simulation.narrative}"</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Detailed Stats */}
                    <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700">
                        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <ChartLineIcon className="w-5 h-5 text-brand-accent" /> Estadísticas Detalladas
                        </h4>
                        <StatBar label="Posesión" valueA={simulation.stats?.possession?.A || 0} valueB={simulation.stats?.possession?.B || 0} />
                        <StatBar label="Tiros Totales" valueA={simulation.stats?.shots?.A || 0} valueB={simulation.stats?.shots?.B || 0} />
                        <StatBar label="Tiros a Puerta" valueA={simulation.stats?.shotsOnTarget?.A || 0} valueB={simulation.stats?.shotsOnTarget?.B || 0} />
                        <StatBar label="Corners" valueA={simulation.stats?.corners?.A || 0} valueB={simulation.stats?.corners?.B || 0} />
                        <StatBar label="Faltas" valueA={simulation.stats?.fouls?.A || 0} valueB={simulation.stats?.fouls?.B || 0} />
                        <StatBar label="Tarjetas Amarillas" valueA={simulation.stats?.yellowCards?.A || 0} valueB={simulation.stats?.yellowCards?.B || 0} />
                        <StatBar label="Fueras de Juego" valueA={simulation.stats?.offsides?.A || 0} valueB={simulation.stats?.offsides?.B || 0} />
                        <StatBar label="Tiros Libres" valueA={simulation.stats?.freeKicks?.A || 0} valueB={simulation.stats?.freeKicks?.B || 0} />
                        <StatBar label="Duelos Aéreos Ganados" valueA={simulation.stats?.headersWon?.A || 0} valueB={simulation.stats?.headersWon?.B || 0} />
                    </div>

                    <div className="space-y-8">
                        {/* Timeline */}
                        <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700 max-h-[400px] overflow-y-auto">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <RefreshIcon className="w-5 h-5 text-brand-accent" /> Timeline de Eventos
                            </h4>
                            <div className="space-y-4 relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
                                {simulation.timeline?.map((event, idx) => (
                                    <div key={idx} className="relative pl-10">
                                        <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-gray-900 ${event.team === 'A' ? 'bg-blue-500' : 'bg-red-500'} z-10`}></div>
                                        <div className="bg-gray-800/50 p-3 rounded-lg border-l-2 border-gray-700">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-mono text-brand-accent font-bold">{event.minute}'</span>
                                                <span className="text-xs uppercase tracking-wider text-gray-500">{event.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-300">{event.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!simulation.timeline || simulation.timeline.length === 0) && (
                                    <p className="text-sm text-gray-500 italic pl-10">No events generated.</p>
                                )}
                            </div>
                        </div>

                        {/* Exact Score Probabilities */}
                        <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TargetIcon className="w-5 h-5 text-brand-accent" /> Probabilidades Resultado Exacto
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {simulation.exactScoreProbabilities?.map((score, idx) => (
                                    <div key={idx} className="bg-gray-800 p-3 rounded text-center border border-gray-700 hover:border-brand-accent transition-colors">
                                        <div className="text-xl font-bold text-white">{score.score}</div>
                                        <div className="text-sm text-brand-accent">{score.probability}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <GamepadIcon className="w-8 h-8 text-brand-accent" />
                    <div>
                        <h2 className="text-3xl font-bold text-white">Simulador Cuántico Nexus-9</h2>
                        <p className="text-brand-text-secondary">Simula cualquier enfrentamiento con precisión milimétrica.</p>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    &larr; Volver
                </button>
            </div>

            {/* Input Form */}
            <div className="bg-brand-secondary rounded-xl p-6 shadow-lg border border-gray-700 mb-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Competidor A (Local)</label>
                        <input 
                            type="text" 
                            value={teamA} 
                            onChange={(e) => setTeamA(e.target.value)}
                            placeholder="Ej: Manchester City"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                    </div>
                    <div className="text-center hidden md:block pb-4">
                        <span className="text-2xl font-bold text-gray-600">VS</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Competidor B (Visitante)</label>
                        <input 
                            type="text" 
                            value={teamB} 
                            onChange={(e) => setTeamB(e.target.value)}
                            placeholder="Ej: Real Madrid"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
                    <select 
                        value={sport} 
                        onChange={(e) => setSport(e.target.value as Sport)} 
                        className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent w-full sm:w-auto"
                    >
                        {Object.values(SportEnum).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button 
                        onClick={handleSimulate}
                        disabled={isLoading || !teamA || !teamB}
                        className="flex-grow w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner /> : <><GamepadIcon className="w-5 h-5"/> Ejecutar Simulación (10,000 Iteraciones)</>}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700">
                        <div 
                            className="bg-brand-accent h-full transition-all duration-300 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-center text-brand-accent mt-2 font-mono text-sm animate-pulse">
                        Procesando vectores de datos... {Math.round(progress)}%
                    </p>
                </div>
            )}

            {renderResults()}
        </div>
    );
};
