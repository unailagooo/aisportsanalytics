import React, { useState } from 'react';
import type { LiveMatch, LiveInsight, BetSlipItem, Sport } from '../types';
import { auditLiveSelection } from '../services/geminiService';
import { DefaultTeamIcon, WarningIcon, DollarSignIcon, BrainCircuitIcon, TrendingUpIcon, TargetIcon, CornerIcon, EditIcon, ShieldCheckIcon, ActivityIcon, RefreshIcon } from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { FiabilityGauge } from './FiabilityGauge';

/**
 * SafeAIValue renders AI responses safely even if they are objects instead of strings.
 * Prevents "React Error #31: Objects are not valid as a React child".
 */
const SafeAIValue: React.FC<{ value: any, className?: string }> = ({ value, className }) => {
    if (!value) return null;
    if (typeof value === 'string') return <span className={className}>{value}</span>;
    if (typeof value === 'object') {
        return (
            <div className={`${className} space-y-2 text-[11px]`}>
                {Object.entries(value).map(([key, val]) => (
                    <div key={key} className="border-l border-brand-accent/30 pl-2">
                        <span className="font-black text-brand-accent uppercase text-[9px] block mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-brand-text-secondary leading-relaxed">{String(val)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return <span className={className}>{String(value)}</span>;
};

const StatsDisplay: React.FC<{ stats: LiveInsight['stats'], teamA: string, teamB: string }> = ({ stats, teamA, teamB }) => {
    if (!stats) return <p className="text-xs text-center text-brand-text-secondary py-8">Awaiting stats from AI...</p>;
    
    const statItems = [
        { label: 'Possession', valueA: stats.possessionA, valueB: stats.possessionB, suffix: '%', Icon: TrendingUpIcon },
        { label: 'Shots', valueA: stats.shotsA, valueB: stats.shotsB, Icon: TargetIcon },
        { label: 'On Target', valueA: stats.shotsOnTargetA, valueB: stats.shotsOnTargetB, Icon: TargetIcon },
        { label: 'Corners', valueA: stats.cornersA, valueB: stats.cornersB, Icon: CornerIcon },
    ];

    return (
        <div className="space-y-3 text-xs">
            {statItems.map(({ label, valueA, valueB, suffix, Icon }) => {
                const valA = Number(valueA) || 0;
                const valB = Number(valueB) || 0;
                const total = valA + valB;
                const percentageA = total > 0 ? (valA / total) * 100 : 50;
                return (
                    <div key={label}>
                        <div className="flex justify-between items-center mb-1 px-1">
                            <span className="font-bold text-white">{valA}{suffix}</span>
                            <span className="text-brand-text-secondary flex items-center gap-1"><Icon className="w-3 h-3"/>{label}</span>
                            <span className="font-bold text-white">{valB}{suffix}</span>
                        </div>
                        <div className="flex w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="bg-brand-accent" style={{ width: `${percentageA}%` }}></div>
                            <div className="bg-blue-500" style={{ width: `${100 - percentageA}%` }}></div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};


export const LiveMatchCommandCard: React.FC<{
    match: LiveMatch;
    insight: LiveInsight | null;
    isLoadingInsight: boolean;
    onToggleBet: (item: BetSlipItem) => void;
    onCorrectAnalysis: (correction: string) => void;
}> = ({ match, insight, isLoadingInsight, onToggleBet, onCorrectAnalysis }) => {
    const [correction, setCorrection] = useState('');
    const [userAuditSelection, setUserAuditSelection] = useState('');
    const [userAuditOdds, setUserAuditOdds] = useState('');
    const [auditResult, setAuditResult] = useState<any | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    const handleToggleBet = (bet: any) => {
        const finalOdds = Number(bet.odds);
        if (isNaN(finalOdds)) return;

        onToggleBet({
            matchIdentifier: `${match.teamA} vs ${match.teamB}`,
            marketName: bet.marketName || "Live Audit",
            outcomeName: bet.outcomeName || bet.selection || "Selection",
            odds: finalOdds,
            sport: match.sport,
            matchDateTime: match.matchDateTime,
        });
    };

    const submitCorrection = () => {
        if (!correction.trim()) return;
        onCorrectAnalysis(correction);
        setCorrection('');
    };

    const runLiveAudit = async () => {
        const oddsVal = parseFloat(userAuditOdds);
        if (!userAuditSelection.trim() || isNaN(oddsVal)) return;
        setIsAuditing(true);
        setAuditResult(null);
        try {
            const result = await auditLiveSelection(match, userAuditSelection, oddsVal);
            if (result) {
                setAuditResult({
                    ...result,
                    reliabilityScore: Number(result.reliabilityScore) || 0,
                    valueScore: Number(result.valueScore) || 0
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAuditing(false);
        }
    };

    return (
        <div className="bg-brand-secondary rounded-lg shadow-lg border border-gray-700 flex flex-col relative overflow-hidden">
            {(isLoadingInsight || isAuditing) && (
                <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent font-mono text-xs animate-pulse tracking-widest uppercase">Sincronizando con Satélites...</p>
                </div>
            )}

            <div className="p-4 border-b border-gray-700 bg-gray-900/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                                    <ActivityIcon className="w-4 h-4 text-brand-accent" /> Telemetría de Campo
                                </h4>
                                {insight?.reliabilityScore && (
                                    <span className="text-brand-accent font-mono text-[10px] bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20">Confianza: {insight.reliabilityScore}%</span>
                                )}
                            </div>
                            <StatsDisplay stats={insight?.stats} teamA={match.teamA} teamB={match.teamB} />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700/50">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <EditIcon className="w-3 h-3" /> Reportar Anomalía / Corrección
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={correction}
                                    onChange={(e) => setCorrection(e.target.value)}
                                    placeholder="Ej: Marcador es 2-1..."
                                    className="flex-grow bg-black/40 border border-gray-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-accent"
                                />
                                <button onClick={submitCorrection} className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black px-3 py-2 rounded-lg text-[10px] uppercase">Corregir</button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700/50 bg-brand-accent/5 p-4 rounded-xl border border-brand-accent/10">
                            <label className="block text-[10px] font-black text-brand-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                                <TargetIcon className="w-3 h-3" /> Audit Terminal (Consulta Live)
                            </label>
                            <div className="space-y-2">
                                <input 
                                    type="text" 
                                    value={userAuditSelection}
                                    onChange={(e) => setUserAuditSelection(e.target.value)}
                                    placeholder="¿Qué quieres apostar? Ej: Over 2.5..."
                                    className="w-full bg-black/40 border border-gray-700 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-brand-accent outline-none"
                                />
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        value={userAuditOdds}
                                        onChange={(e) => setUserAuditOdds(e.target.value)}
                                        placeholder="Cuota @..."
                                        className="w-1/3 bg-black/40 border border-gray-700 rounded-lg py-2 px-3 text-xs text-white font-mono"
                                    />
                                    <button 
                                        onClick={runLiveAudit}
                                        disabled={!userAuditSelection || !userAuditOdds}
                                        className="flex-grow bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-2 rounded-lg text-[10px] uppercase transition-all shadow-lg active:scale-95 disabled:opacity-30"
                                    >
                                        EJECUTAR AUDITORÍA LIVE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                        {auditResult ? (
                            <div className="bg-brand-secondary border-2 border-brand-accent rounded-xl p-5 animate-fade-in shadow-[0_0_20px_rgba(0,245,160,0.1)]">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-black text-brand-accent text-xs uppercase tracking-widest flex items-center gap-2">
                                        <BrainCircuitIcon className="w-4 h-4" /> Informe de Auditoría
                                    </h4>
                                    <button onClick={() => setAuditResult(null)} className="text-gray-500 hover:text-white text-xs font-bold uppercase">X</button>
                                </div>
                                <div className="flex gap-4 mb-4">
                                    <div className="text-center bg-black/30 p-2 rounded-lg flex-1">
                                        <p className="text-[9px] text-gray-500 uppercase">Fiabilidad</p>
                                        <p className="text-lg font-black text-white">{auditResult.reliabilityScore}%</p>
                                    </div>
                                    <div className="text-center bg-black/30 p-2 rounded-lg flex-1">
                                        <p className="text-[9px] text-gray-500 uppercase">Valor (EV+)</p>
                                        <p className="text-lg font-black text-yellow-400">{auditResult.valueScore}%</p>
                                    </div>
                                    <div className={`text-center p-2 rounded-lg flex-1 font-black ${auditResult.verdict === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                        <p className="text-[9px] uppercase opacity-70">Veredicto</p>
                                        <p className="text-sm">{auditResult.verdict}</p>
                                    </div>
                                </div>
                                <div className="mb-4 p-3 bg-black/20 rounded-lg italic">
                                    <SafeAIValue value={auditResult.detailedAnalysis} className="text-xs text-brand-text-secondary leading-relaxed" />
                                </div>
                                <button 
                                    onClick={() => handleToggleBet({ selection: userAuditSelection, odds: userAuditOdds })}
                                    className="w-full bg-brand-accent text-brand-primary font-black py-2 rounded-lg text-[10px] uppercase shadow-xl"
                                >
                                    Confirmar y Añadir a Boleto
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                                        <DollarSignIcon className="w-4 h-4 text-yellow-400" /> Brechas Detectadas
                                    </h4>
                                    {insight?.valueScore && (
                                        <span className="text-yellow-400 font-mono text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">Value: {insight.valueScore}%</span>
                                    )}
                                </div>
                                
                                <div className="space-y-2 flex-grow overflow-y-auto custom-scrollbar max-h-[300px]">
                                    {insight?.suggestedLiveBets && insight.suggestedLiveBets.length > 0 ? (
                                        insight.suggestedLiveBets.map((bet, index) => (
                                            <button key={index} onClick={() => handleToggleBet(bet)} className="w-full text-left bg-gray-800/40 hover:bg-gray-700/60 p-3 rounded-xl border border-gray-700/50 transition-all group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs font-black text-brand-accent uppercase truncate">{bet.outcomeName}</p>
                                                    <p className="font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded text-[10px]">@{Number(bet.odds).toFixed(2)}</p>
                                                </div>
                                                <div className="text-[10px] text-gray-400 leading-relaxed italic group-hover:text-gray-200">
                                                    <SafeAIValue value={bet.justification} />
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-32 bg-black/10 rounded-xl border border-dashed border-gray-800">
                                            <p className="text-[10px] text-gray-600 uppercase font-bold">Sin oportunidades automáticas</p>
                                        </div>
                                    )}
                                </div>

                                {insight?.smallAnalysis && (
                                    <div className="mt-4 p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-xl">
                                        <div className="text-[10px] text-brand-text-secondary leading-relaxed">
                                            <span className="text-brand-accent font-black mr-1 uppercase block mb-1">Analista Táctico:</span>
                                            <SafeAIValue value={insight.smallAnalysis} />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-3 bg-black/40 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-600 uppercase font-bold tracking-[0.1em]">Verification Level: Forensic</span>
                 </div>
                 <span className="text-[9px] text-gray-700 font-mono">FEED SOURCE: NEXUS-9 LIVE</span>
            </div>
        </div>
    );
};