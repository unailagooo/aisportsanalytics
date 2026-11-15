
import React, { useState } from 'react';
import { getEdgeAnalysis } from '../services/geminiService';
import type { EdgeAnalysisResult, Sport } from '../types';
import { Sport as SportEnum } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ScaleIcon, ActivityIcon, TargetIcon, BrainCircuitIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface EdgeFinderProps {
    onBack: () => void;
}

const formatNum = (val: number | undefined | null, decimals: number = 1) => (Number(val) || 0).toFixed(decimals);

export const EdgeFinder: React.FC<EdgeFinderProps> = ({ onBack }) => {
    const [match, setMatch] = useState('');
    const [market, setMarket] = useState('');
    const [selection, setSelection] = useState('');
    const [bookieOdds, setBookieOdds] = useState('2.0');
    const [sport, setSport] = useState<Sport>(SportEnum.Football);
    const [analysis, setAnalysis] = useState<EdgeAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!match || !market || !selection) return;
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await getEdgeAnalysis(sport, match, market, selection, parseFloat(bookieOdds));
            setAnalysis(result);
        } catch (e) {
            alert("No se pudo conectar con el motor de simulaciones. Revisa tu conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-lg">
                        <ScaleIcon className="w-8 h-8 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">The Edge Finder</h2>
                        <p className="text-brand-text-secondary">Comparador de Probabilidad Real vs. Mercado</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700">
                        <h3 className="text-white font-bold mb-4">Datos del Mercado Actual</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Deporte</label>
                                <select 
                                    value={sport}
                                    onChange={(e) => setSport(e.target.value as Sport)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-brand-accent outline-none"
                                >
                                    {Object.values(SportEnum).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Evento</label>
                                <input 
                                    type="text" 
                                    value={match}
                                    onChange={(e) => setMatch(e.target.value)}
                                    placeholder="Ej: Liverpool vs Real Madrid"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-brand-accent outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Mercado</label>
                                    <input 
                                        type="text" 
                                        value={market}
                                        onChange={(e) => setMarket(e.target.value)}
                                        placeholder="Gana Local"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Cuota Casa</label>
                                    <input 
                                        type="number" 
                                        value={bookieOdds}
                                        onChange={(e) => setBookieOdds(e.target.value)}
                                        step="0.01"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white font-mono outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Selección Exacta</label>
                                <input 
                                    type="text" 
                                    value={selection}
                                    onChange={(e) => setSelection(e.target.value)}
                                    placeholder="Liverpool"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleAnalyze}
                            disabled={isLoading || !match || !market || !selection}
                            className="w-full mt-6 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner /> : <><TargetIcon className="w-5 h-5"/> Calcular Ventaja (Edge)</>}
                        </button>
                    </div>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-2">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-accent font-mono text-sm animate-pulse">EJECUTANDO 20,000 SIMULACIONES DE MONTE CARLO...</p>
                        </div>
                    )}

                    {analysis && !isLoading && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Value Rating Card */}
                            <div className="bg-brand-secondary rounded-xl p-6 border border-gray-700 shadow-xl overflow-hidden relative">
                                <div className={`absolute top-0 right-0 p-3 text-xs font-bold uppercase tracking-widest ${
                                    (analysis.edgePercentage || 0) > 10 ? 'bg-green-600 text-white' : (analysis.edgePercentage || 0) > 5 ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'
                                }`}>
                                    {analysis.valueRating || 'N/A'}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Veredicto de Ventaja</p>
                                        <div className={`text-6xl font-black ${(analysis.edgePercentage || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(analysis.edgePercentage || 0) > 0 ? '+' : ''}{formatNum(analysis.edgePercentage, 1)}%
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2 font-mono">MATHEMATICAL EDGE</p>
                                    </div>
                                    <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
                                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                            <p className="text-[10px] text-gray-500 uppercase">Cuota Justa</p>
                                            <p className="text-xl font-bold text-brand-accent">@{formatNum(analysis.fairOdds, 2)}</p>
                                        </div>
                                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                            <p className="text-[10px] text-gray-500 uppercase">Prob. Real</p>
                                            <p className="text-xl font-bold text-white">{formatNum((analysis.trueProbability || 0) * 100, 1)}%</p>
                                        </div>
                                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                            <p className="text-[10px] text-gray-500 uppercase">Prob. Mercado</p>
                                            <p className="text-xl font-bold text-gray-400">{formatNum((analysis.impliedProbability || 0) * 100, 1)}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700">
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2"><ActivityIcon className="text-brand-accent"/> Análisis de Valor</h4>
                                    <p className="text-sm text-gray-400 leading-relaxed italic">"{analysis.analysis || 'Sin análisis disponible.'}"</p>
                                    <div className="mt-6 pt-6 border-t border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500">Kelly Criterion Refinado:</p>
                                            <p className="text-lg font-bold text-brand-accent">Stake {analysis.kellyStake || 0}/10</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
                                    <h4 className="text-white font-bold mb-4">Escudo de Varianza</h4>
                                    <FiabilityGauge score={(analysis.trueProbability || 0) * 100} size="large" />
                                    <p className="text-[10px] text-gray-500 mt-4 text-center">
                                        Basado en {(analysis.simulationData?.iterations || 0).toLocaleString()} simulaciones independientes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!analysis && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-brand-secondary/30 rounded-xl border border-dashed border-gray-800 text-center p-8">
                             <ScaleIcon className="w-16 h-16 text-gray-700 mb-4" />
                             <p className="text-gray-500 max-w-xs uppercase text-xs font-bold tracking-widest">Awaiting Market Data</p>
                             <p className="text-[11px] text-gray-600 mt-2">Introduce los datos de tu casa de apuestas para escanear ineficiencias matemáticas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
