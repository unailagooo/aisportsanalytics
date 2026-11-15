
import React, { useState, useMemo } from 'react';
import type { Fixture, Player, PlayerMatchupAnalysis } from '../types';
import { getPlayerMatchupAnalysis } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { UsersIcon } from './IconComponents';

interface ComparisonModalProps {
    fixture: Fixture;
    playersA: Player[];
    playersB: Player[];
    onClose: () => void;
}

const RadarChart: React.FC<{ dataA: Record<string, number>, dataB: Record<string, number> }> = ({ dataA, dataB }) => {
    const labels = Object.keys(dataA);
    const numLabels = labels.length;
    const angleSlice = (Math.PI * 2) / numLabels;
    const radius = 80;
    const center = 100;

    const pointsA = labels.map((label, i) => {
        const value = Math.min(dataA[label] / 100, 1) * radius;
        const x = center + value * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + value * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    const pointsB = labels.map((label, i) => {
        const value = Math.min(dataB[label] / 100, 1) * radius;
        const x = center + value * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + value * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    const axisPoints = labels.map((_, i) => {
        const x = center + radius * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + radius * Math.sin(angleSlice * i - Math.PI / 2);
        return {x, y};
    });

    const labelPoints = labels.map((label, i) => {
        const x = center + (radius + 15) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + (radius + 15) * Math.sin(angleSlice * i - Math.PI / 2);
        return {x, y, label};
    });

    return (
        <svg viewBox="0 0 200 200" width="200" height="200">
            {/* Axes and Labels */}
            {axisPoints.map((p, i) => (
                <line key={`axis-${i}`} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#4A5568" strokeWidth="0.5" />
            ))}
            {labelPoints.map((p, i) => (
                 <text key={`label-${i}`} x={p.x} y={p.y} fill="#A0AEC0" fontSize="8" textAnchor="middle" dominantBaseline="middle">{p.label}</text>
            ))}
            {/* Data Polygons */}
            <polygon points={pointsA} fill="rgba(0, 245, 160, 0.4)" stroke="#00F5A0" strokeWidth="1" />
            <polygon points={pointsB} fill="rgba(59, 130, 246, 0.4)" stroke="#3B82F6" strokeWidth="1" />
        </svg>
    );
};


export const ComparisonModal: React.FC<ComparisonModalProps> = ({ fixture, playersA, playersB, onClose }) => {
    const [playerA, setPlayerA] = useState<Player | null>(playersA[0] || null);
    const [playerB, setPlayerB] = useState<Player | null>(playersB[0] || null);
    const [analysis, setAnalysis] = useState<PlayerMatchupAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!playerA || !playerB || isLoading) return;
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await getPlayerMatchupAnalysis(playerA, playerB, fixture);
            setAnalysis(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!analysis) return null;
        const statsA = Object.fromEntries(
            Object.entries(analysis.playerA.stats)
                .map(([key, value]): [string, number] => [key, Number(value)])
                .filter(([, value]) => !isNaN(value))
        );
        const statsB = Object.fromEntries(
            Object.entries(analysis.playerB.stats)
                .map(([key, value]): [string, number] => [key, Number(value)])
                .filter(([, value]) => !isNaN(value))
        );
        
        // Normalize and get common stats
        const commonKeys = Object.keys(statsA).filter(key => key in statsB);
        if (commonKeys.length < 3) return null; // Need at least 3 points for a radar chart
        
        const dataA: Record<string, number> = {};
        const dataB: Record<string, number> = {};
        commonKeys.forEach(key => {
            dataA[key] = statsA[key];
            dataB[key] = statsB[key];
        });
        return { dataA, dataB };
    }, [analysis]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div className="bg-brand-secondary rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-brand-accent flex items-center gap-2"><UsersIcon />Player vs. Player Analysis</h3>
                        <p className="text-sm text-brand-text-secondary">{fixture.teamA} vs {fixture.teamB}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                </header>
                <div className="p-4 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <select onChange={(e) => setPlayerA(playersA.find(p => p.name === e.target.value) || null)} className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="">Select Player from {fixture.teamA}</option>
                            {playersA.map(p => <option key={p.name} value={p.name}>{p.name} ({p.position})</option>)}
                        </select>
                         <select onChange={(e) => setPlayerB(playersB.find(p => p.name === e.target.value) || null)} className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="">Select Player from {fixture.teamB}</option>
                            {playersB.map(p => <option key={p.name} value={p.name}>{p.name} ({p.position})</option>)}
                        </select>
                    </div>
                     <button onClick={handleAnalyze} disabled={!playerA || !playerB || isLoading} className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
                        {isLoading ? 'Analyzing...' : 'Analyze Matchup'}
                    </button>

                    {isLoading && <div className="flex justify-center mt-6"><LoadingSpinner/></div>}

                    {analysis && (
                        <div className="mt-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="text-center p-3">
                                    <p className="font-bold text-lg text-brand-accent">{analysis.playerA.name}</p>
                                    <p className="text-xs text-brand-text-secondary">{analysis.playerA.position}</p>
                                    <div className="text-left text-xs mt-2 space-y-1">
                                        {/* Added String conversion to fix unknown assignment to ReactNode error */}
                                        {Object.entries(analysis.playerA.stats).map(([key, value]) => <p key={key}><span className="font-semibold">{key}:</span> {String(value)}</p>)}
                                    </div>
                                </div>
                                <div className="text-center p-3">
                                    <p className="font-bold text-lg text-blue-400">{analysis.playerB.name}</p>
                                    <p className="text-xs text-brand-text-secondary">{analysis.playerB.position}</p>
                                     <div className="text-left text-xs mt-2 space-y-1">
                                        {/* Added String conversion to fix unknown assignment to ReactNode error */}
                                        {Object.entries(analysis.playerB.stats).map(([key, value]) => <p key={key}><span className="font-semibold">{key}:</span> {String(value)}</p>)}
                                    </div>
                                </div>
                            </div>
                             {chartData && (
                                <div className="flex justify-center my-4">
                                    <RadarChart dataA={chartData.dataA} dataB={chartData.dataB} />
                                </div>
                            )}
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                                <p className="font-bold text-white">Verdict: <span className={`${analysis.advantage === 'playerA' ? 'text-brand-accent' : analysis.advantage === 'playerB' ? 'text-blue-400' : ''}`}>{analysis.keyComparison}</span></p>
                                <p className="text-sm text-brand-text-secondary mt-2">{analysis.verdict}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
