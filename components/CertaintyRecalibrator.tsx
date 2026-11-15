
import React, { useState } from 'react';
import type { RecalibratorResult, BetSlipItem } from '../types';
import { getCertaintyRecalibration, getTextFromImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { BrainCircuitIcon, RefreshIcon, WarningIcon, ShieldCheckIcon, ChartLineIcon, TargetIcon, ActivityIcon, TicketIcon, DollarSignIcon, SearchIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface CertaintyRecalibratorProps {
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

const BellCurveChart: React.FC<{ dataOriginal: number[], dataRecal: number[] }> = ({ dataOriginal, dataRecal }) => {
    if (!dataOriginal || !dataRecal || dataOriginal.length === 0 || dataRecal.length === 0) return null;
    
    const width = 400;
    const height = 150;
    const pointsOriginal = dataOriginal.map((y, x) => `${(x / (dataOriginal.length - 1)) * width},${height - (y / Math.max(...dataOriginal, ...dataRecal)) * height}`).join(' ');
    const pointsRecal = dataRecal.map((y, x) => `${(x / (dataRecal.length - 1)) * width},${height - (y / Math.max(...dataOriginal, ...dataRecal)) * height}`).join(' ');

    return (
        <div className="w-full bg-black/40 p-4 rounded-xl border border-gray-800 relative">
            <div className="absolute top-2 left-4 text-[8px] font-black text-gray-600 uppercase tracking-widest">Simulación de Varianza (Monte Carlo)</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
                <path d={`M 0,${height} L ${pointsOriginal} L ${width},${height}`} fill="rgba(239, 68, 68, 0.1)" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 2" />
                <path d={`M 0,${height} L ${pointsRecal} L ${width},${height}`} fill="rgba(0, 245, 160, 0.2)" stroke="#00F5A0" strokeWidth="3" />
            </svg>
            <div className="flex justify-between mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-red-500 border-dashed"></div> <span className="text-[9px] text-gray-500 uppercase">Original</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-accent"></div> <span className="text-[9px] text-brand-accent uppercase">Nexus-9</span></div>
            </div>
        </div>
    );
};

export const CertaintyRecalibrator: React.FC<CertaintyRecalibratorProps> = ({ onBack, onToggleBet, betSlip }) => {
    const [input, setInput] = useState('');
    const [image, setImage] = useState<{ base64: string, mime: string, preview: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [result, setResult] = useState<RecalibratorResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage({ base64: (reader.result as string).split(',')[1], mime: file.type, preview: URL.createObjectURL(file) });
                setInput('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRecalibrate = async () => {
        if (!input.trim() && !image) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            let textToAnalyze = input;
            if (image) {
                setLoadingMsg('ESCANEANDO CAPTURA DE PANTALLA...');
                textToAnalyze = await getTextFromImage(image.base64, image.mime);
            }
            setLoadingMsg('EJECUTANDO ARBITRAJE DE PROBABILIDADES...');
            const res = await getCertaintyRecalibration(textToAnalyze);
            if (!res || !res.originalBet || !res.recalibratedBet) {
                throw new Error("La IA no pudo estructurar el análisis correctamente.");
            }
            setResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Fallo crítico en el motor de arbitraje. Reintente sincronización.");
        } finally {
            setIsLoading(false);
        }
    };

    const isInSlip = (bet: any) => {
        if (!bet) return false;
        return betSlip.some(s => s.outcomeName === bet.selection && s.matchIdentifier === bet.match);
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-xl border border-brand-accent/30 shadow-[0_0_15px_rgba(0,245,160,0.2)]">
                        <ActivityIcon className="w-8 h-8 text-brand-accent animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Certainty Re-Calibrator</h2>
                        <p className="text-[10px] text-brand-accent font-mono tracking-[0.3em] uppercase">Probability Asymmetric Arbitrage Engine</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg border border-gray-700 transition-all uppercase text-xs">
                    &larr; Volver
                </button>
            </div>

            {!result && (
                <div className="max-w-4xl mx-auto bg-brand-secondary p-10 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ChartLineIcon className="w-32 h-32 text-brand-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-white text-center mb-8 uppercase tracking-widest">Inyectar Evidencia de Apuesta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Input de Texto Forense</label>
                            <textarea 
                                value={input}
                                onChange={e => { setInput(e.target.value); setImage(null); }}
                                placeholder="Ej: Gana Nadal @1.90 en Roland Garros..."
                                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-5 text-white focus:outline-none focus:border-brand-accent resize-none h-40 font-medium"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Escaneo de Captura (OCR)</label>
                            <label className="flex-grow cursor-pointer group">
                                <div className="h-full border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-gray-800/30 hover:border-brand-accent transition-all group">
                                    {image ? (
                                        <img src={image.preview} className="max-h-32 rounded-lg shadow-xl" />
                                    ) : (
                                        <>
                                            <TicketIcon className="w-10 h-10 text-gray-600 mb-3 group-hover:text-brand-accent" />
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Subir ticket de apuesta</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                    <button 
                        onClick={handleRecalibrate}
                        disabled={isLoading || (!input && !image)}
                        className="w-full mt-10 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(0,245,160,0.3)] text-xl flex items-center justify-center gap-4 disabled:opacity-30"
                    >
                        {isLoading ? <LoadingSpinner /> : <><RefreshIcon className="w-6 h-6"/> RE-CALIBRAR CERTEZA</>}
                    </button>
                    {isLoading && <p className="text-center mt-4 text-brand-accent font-mono text-[9px] animate-pulse tracking-[0.5em] uppercase">{loadingMsg}</p>}
                    {error && <p className="text-center mt-4 text-red-500 text-xs font-bold bg-red-900/20 p-4 rounded-xl">{error}</p>}
                </div>
            )}

            {result && result.originalBet && result.recalibratedBet && (
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* ORIGINAL VIEW */}
                        <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-xl opacity-60 grayscale-[0.5] relative overflow-hidden">
                            <div className="absolute top-4 right-6 text-[10px] font-black text-red-500/50 uppercase tracking-widest border border-red-500/20 px-2 py-1 rounded">Varianza Elevada</div>
                            <h4 className="text-gray-500 font-black text-xs uppercase tracking-widest mb-8">Tu Apuesta Detectada</h4>
                            <div className="mb-8">
                                <p className="text-xs text-gray-600 font-bold uppercase mb-1">{result.originalBet.match}</p>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{result.originalBet.selection}</h3>
                                <p className="text-3xl font-mono font-bold text-gray-500 mt-2">@{Number(result.originalBet.odds || 0).toFixed(2)}</p>
                            </div>
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2"><WarningIcon className="w-3 h-3"/> Puntos de Fallo Identificados</h5>
                                {result.originalBet.failurePoints?.map((p, i) => (
                                    <div key={i} className="text-xs text-gray-500 border-l border-gray-800 pl-4 py-1 italic">"{p}"</div>
                                ))}
                            </div>
                        </div>

                        {/* RECALIBRATED VIEW */}
                        <div className="bg-gradient-to-br from-gray-900 via-brand-secondary to-gray-900 rounded-3xl border-2 border-brand-accent p-8 shadow-[0_0_50px_rgba(0,245,160,0.15)] relative overflow-hidden">
                            <div className="absolute -right-12 -top-12 w-40 h-40 bg-brand-accent/5 rounded-full blur-3xl"></div>
                            <div className="absolute top-4 right-6 bg-brand-accent text-brand-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-lg animate-pulse">Certeza Superior</div>
                            <h4 className="text-brand-accent font-black text-xs uppercase tracking-widest mb-8">Sustitución Nexus-9 Recomendada</h4>
                            <div className="mb-8">
                                <p className="text-xs text-brand-accent font-bold uppercase mb-1 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-3 h-3"/> {result.recalibratedBet.match}
                                </p>
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{result.recalibratedBet.selection}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase mt-2">{result.recalibratedBet.market}</p>
                                <div className="flex items-center gap-6 mt-6">
                                    <span className="text-5xl font-mono font-black text-white">@{Number(result.recalibratedBet.odds || 0).toFixed(2)}</span>
                                    <div className="h-10 w-px bg-gray-800"></div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-black">Prob. Calculada</p>
                                        <p className="text-2xl font-black text-brand-accent">{result.recalibratedBet.probability}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-2"><ShieldCheckIcon className="w-3 h-3"/> Factores de Blindaje</h5>
                                {result.recalibratedBet.shieldFactors?.map((p, i) => (
                                    <div key={i} className="text-xs text-white bg-brand-accent/5 border border-brand-accent/20 rounded-lg px-4 py-2 font-bold uppercase tracking-tight">{p}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Simulation & Evidence Footer */}
                    <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-2xl overflow-hidden relative">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><TargetIcon className="w-4 h-4 text-brand-accent"/> Comparativa de Balística de Riesgo</h4>
                                <BellCurveChart dataOriginal={result.simulation?.originalCurve || []} dataRecal={result.simulation?.recalibratedCurve || []} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><SearchIcon className="w-4 h-4 text-brand-accent"/> Evidencia Forense Contrastada</h4>
                                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-sm text-brand-text-secondary leading-relaxed italic border-l-4 border-brand-accent">
                                    "{result.recalibratedBet.evidence}"
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase">
                                    <span>Substitution Type: {result.recalibratedBet.substitutionType}</span>
                                    <span>Audit ID: {result.auditId}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                         <button 
                            onClick={() => setResult(null)}
                            className="bg-gray-800 hover:bg-gray-700 text-white font-black py-5 px-10 rounded-2xl text-sm uppercase tracking-widest transition-all"
                        >
                            Analizar Otro Pick
                        </button>
                        <button 
                            onClick={() => onToggleBet({
                                matchIdentifier: result.recalibratedBet.match,
                                marketName: result.recalibratedBet.market,
                                outcomeName: result.recalibratedBet.selection,
                                odds: result.recalibratedBet.odds,
                                sport: result.recalibratedBet.sport
                            })}
                            disabled={isInSlip(result.recalibratedBet)}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-5 px-12 rounded-2xl text-xl uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(0,245,160,0.3)] transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            {isInSlip(result.recalibratedBet) ? 'INYECTADO EN BOLETO' : 'AUTORIZAR SUSTITUCIÓN'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
