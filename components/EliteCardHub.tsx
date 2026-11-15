
import React, { useState, useRef, useEffect } from 'react';
import type { BetSlipItem, EliteCardData } from '../types';
import { getEliteCardContent } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { BriefcaseIcon, RefreshIcon, ShieldCheckIcon, WarningIcon } from './IconComponents';

interface EliteCardHubProps {
    betSlip: BetSlipItem[];
    onBack: () => void;
}

const EliteCardDesign: React.FC<{ data: EliteCardData }> = ({ data }) => {
    if (!data || !data.thesis) return null;

    return (
        <div id="elite-card-render" className="w-full max-w-2xl bg-[#050505] p-8 border border-gray-800 font-mono text-gray-400 relative overflow-hidden shadow-2xl animate-fade-in">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="flex justify-between items-start border-b border-gray-800 pb-6 relative z-10">
                <div>
                    <p className="text-[10px] text-brand-accent font-bold tracking-[0.3em] uppercase mb-1">NEXUS-9 QUANTITATIVE PROTOCOL</p>
                    <h2 className="text-white text-2xl font-bold tracking-tight">{data.event}</h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase">{data.league} // TERMINAL ADVISORY</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-600 mb-1">AUDIT ID: {data.cardId || 'UNA-000'}</p>
                    <p className="text-xs text-white">{data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}</p>
                </div>
            </div>

            <div className="my-10 bg-[#0A0A0A] border border-gray-800 p-8 relative z-10 group transition-all duration-500 hover:border-brand-accent/50">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Institutional Verdict</p>
                        <h3 className="text-white text-3xl font-black tracking-tighter uppercase">{data.selection}</h3>
                        <p className="text-brand-accent text-sm font-bold mt-1">@{Number(data.odds || 0).toFixed(2)} // MARKET MISPRICING DETECTED</p>
                    </div>
                    <div className="text-center border-l border-gray-800 pl-8">
                        <p className="text-[10px] text-gray-600 mb-1">CONFIDENCE</p>
                        <p className="text-brand-accent text-4xl font-black">{data.confidenceGrade || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-8">
                <div className="space-y-2">
                    <h4 className="text-[10px] text-brand-accent font-bold uppercase border-b border-gray-800 pb-1">QUANT STRUCTURE</h4>
                    <p className="text-[11px] leading-relaxed italic">"{data.thesis.quantitative || 'No data'}"</p>
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] text-brand-accent font-bold uppercase border-b border-gray-700/50 pb-1">FLOW ANALYSIS</h4>
                    <p className="text-[11px] leading-relaxed italic">"{data.thesis.marketFlow || 'No data'}"</p>
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] text-brand-accent font-bold uppercase border-b border-gray-700/50 pb-1">RISK PROFILE</h4>
                    <p className="text-[11px] leading-relaxed italic">"{data.thesis.riskMitigation || 'No data'}"</p>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-gray-800 flex items-center justify-center p-2 opacity-50">
                         <ShieldCheckIcon className="text-brand-accent" />
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-600 uppercase">Verification Code</p>
                        <p className="text-[10px] text-white font-bold">{data.verificationCode || 'AUTH-000'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Grade: Institutional Class</p>
                    <p className="text-[8px] text-gray-700 mt-1 italic">NEXUS-9 Proprietary Data // Do not redistribute</p>
                </div>
            </div>
            
            <div className="absolute bottom-0 right-0 p-1">
                <p className="text-[6px] text-gray-900 font-bold">TERMINAL v4.0</p>
            </div>
        </div>
    );
};

export const EliteCardHub: React.FC<EliteCardHubProps> = ({ betSlip, onBack }) => {
    const [selectedPick, setSelectedPick] = useState<BetSlipItem | null>(betSlip[0] || null);
    const [cardData, setCardData] = useState<EliteCardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!selectedPick) return;
        setIsLoading(true);
        setError(null);
        setCardData(null);
        try {
            const data = await getEliteCardContent(selectedPick);
            if (!data || !data.thesis) {
                throw new Error("Respuesta incompleta de la terminal.");
            }
            setCardData(data);
        } catch (e) {
            setError("La terminal Nexus-9 ha detectado una anomalía en la red de datos. Reintentando sincronización...");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-lg">
                        <BriefcaseIcon className="w-8 h-8 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Elite Card Hub</h2>
                        <p className="text-brand-text-secondary">Generador de Informes Institucionales</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-secondary p-6 rounded-xl border border-gray-700">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">Selecciona un Pick</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {betSlip.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">Añade picks al boleto primero para generar informes.</p>
                            ) : betSlip.map((pick, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setSelectedPick(pick)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedPick === pick ? 'bg-brand-accent/10 border-brand-accent' : 'bg-gray-800 border-transparent hover:bg-gray-700'}`}
                                >
                                    <p className="text-sm font-bold text-white truncate">{pick.outcomeName}</p>
                                    <p className="text-xs text-gray-500 truncate">{pick.matchIdentifier}</p>
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={!selectedPick || isLoading}
                            className="w-full mt-6 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner /> : <><RefreshIcon className="w-5 h-5"/> Generar Informe de Élite</>}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-[500px] bg-brand-secondary/30 rounded-xl border border-dashed border-gray-800">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-accent font-mono text-sm animate-pulse">SINCROZINANDO TERMINAL CUÁNTICA...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center h-[500px] bg-red-900/10 rounded-xl border border-red-900/30 text-center p-8">
                             <WarningIcon className="w-12 h-12 text-red-500 mb-4" />
                             <p className="text-red-400 font-bold max-w-sm">{error}</p>
                             <button onClick={handleGenerate} className="mt-4 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all">Reintentar</button>
                        </div>
                    )}

                    {cardData && !isLoading && !error && (
                        <div className="space-y-6 flex flex-col items-center">
                            <EliteCardDesign data={cardData} />
                            <div className="flex flex-col items-center gap-3">
                                <button 
                                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-lg transition-colors border border-gray-700 shadow-xl"
                                    onClick={() => window.print()}
                                >
                                    Guardar PDF / Imprimir
                                </button>
                                <p className="text-[10px] text-gray-500 text-center max-w-xs italic">
                                    Diseño optimizado para capturas de pantalla de alta resolución en Telegram/Discord.
                                </p>
                            </div>
                        </div>
                    )}

                    {!cardData && !isLoading && !error && (
                        <div className="flex flex-col items-center justify-center h-[500px] bg-brand-secondary/30 rounded-xl border border-dashed border-gray-800 text-center p-8">
                             <BriefcaseIcon className="w-16 h-16 text-gray-700 mb-4" />
                             <p className="text-gray-500 max-w-xs">Selecciona una oportunidad de mercado de la izquierda para desplegar el reporte técnico de grado institucional.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
