
import React, { useState } from 'react';
import type { CustomPredictionAnalysis, QuantumVectorAnalysis, BetSlipItem, Nexus9AuditData } from '../types';
import { getTextFromImage, getCustomPredictionAnalysis } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { FiabilityGauge } from './FiabilityGauge';
import { BrainCircuitIcon, ClipboardListIcon, DollarSignIcon, ChartLineIcon, RefreshIcon, WarningIcon, TicketIcon, ShieldCheckIcon, TargetIcon, ActivityIcon, ScaleIcon } from './IconComponents';

interface PredictionAnalyzerDashboardProps {
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

interface SelectedImage {
    base64: string;
    mimeType: string;
    preview: string;
}

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;
    const sections = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400', border: 'border-blue-500/30' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400', border: 'border-purple-500/30' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400', border: 'border-yellow-500/30' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400', border: 'border-red-500/30' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent', border: 'border-brand-accent/30' },
    ];

    return (
        <div className="space-y-6">
            {sections.map(({ title, content, icon: Icon, color, border }) => {
                const displayContent = content || "Datos insuficientes para generar este vector en este momento.";
                return (
                    <div key={title} className={`bg-gray-900/40 p-5 rounded-lg border-l-4 ${border} shadow-sm`}>
                        <h4 className={`font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wider ${color}`}>
                            <Icon className="w-5 h-5" />{title}
                        </h4>
                        <div className="text-sm text-gray-300 leading-7 font-light whitespace-pre-wrap">
                            {displayContent}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const AuditWidget: React.FC<{ audit: Nexus9AuditData }> = ({ audit }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Market Alignment Section */}
            <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4 text-blue-400" /> Market Alignment (Smart Money)
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest">ID: {audit.auditCertificateId}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex flex-col items-center">
                         <div className="relative w-32 h-16 overflow-hidden">
                            <div className="absolute inset-0 bg-gray-700 rounded-t-full"></div>
                            <div className="absolute inset-0 bg-brand-accent rounded-t-full transition-all duration-1000 origin-bottom" style={{ transform: `rotate(${(audit.marketAlignment / 100) * 180 - 180}deg)` }}></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-14 bg-gray-900 rounded-t-full flex flex-col items-center justify-end pb-2">
                                <span className="text-2xl font-black text-white">{audit.marketAlignment}%</span>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-black mt-2">Institutional Alignment</p>
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm text-brand-text-secondary leading-relaxed italic">
                            {audit.marketAlignment > 70 
                                ? "La liquidez institucional apoya masivamente esta dirección. Estás operando con el 'Smart Money'."
                                : audit.marketAlignment > 40
                                ? "Equilibrio detectado. El mercado minorista y profesional están divididos en esta línea."
                                : "ALERTA: Estás operando contra la tendencia de los Market Makers Sharp. Riesgo de trampa detectado."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Black Swan Engine */}
            <div className="bg-brand-secondary p-6 rounded-2xl border border-gray-700">
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <WarningIcon className="w-4 h-4 text-red-500" /> Nexus-9 Black Swan Engine (Puntos de Fallo)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audit.blackSwanRisks.map((risk, i) => (
                        <div key={i} className="bg-black/30 p-4 rounded-xl border border-red-900/30 flex justify-between items-center gap-4">
                            <div className="flex-grow">
                                <p className="text-xs font-bold text-white uppercase tracking-tighter mb-1">{risk.scenario}</p>
                                <p className="text-[10px] text-gray-500 leading-tight">{risk.impact === 'HIGH' ? 'IMPACTO CRÍTICO: Liquidación total de probabilidad.' : 'IMPACTO MODERADO: Varianza aumentada.'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-red-500 font-mono font-black text-lg">{risk.probability}%</p>
                                <p className="text-[8px] text-gray-600 uppercase font-black">Prob. Ocurrencia</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hedge Optimizer */}
            <div className="bg-gradient-to-br from-gray-900 to-brand-secondary p-6 rounded-2xl border border-brand-accent/20">
                <h4 className="text-brand-accent font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4" /> Nexus-9 Hedge Optimizer (Plan de Evacuación)
                </h4>
                <div className="space-y-4">
                    {audit.hedgeOptimizer.map((hedge, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0 text-brand-accent font-black text-xs border border-brand-accent/30">{i+1}</div>
                            <div className="bg-black/40 p-4 rounded-xl border border-gray-800 flex-grow">
                                <p className="text-[10px] text-brand-accent font-black uppercase tracking-widest mb-1">TRIGGER: {hedge.trigger}</p>
                                <p className="text-sm text-white font-bold mb-2">{hedge.action}</p>
                                <p className="text-[9px] text-gray-500 italic">Objetivo de protección: {hedge.protectionLevel}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {audit.correlationAudit && (
                <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/30">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ScaleIcon className="w-3 h-3"/> Auditoría de Correlación Invisible
                    </p>
                    <p className="text-xs text-brand-text-secondary italic">"{audit.correlationAudit}"</p>
                </div>
            )}
        </div>
    );
};

export const PredictionAnalyzerDashboard: React.FC<PredictionAnalyzerDashboardProps> = ({ onBack, onToggleBet, betSlip }) => {
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
    const [analysisResult, setAnalysisResult] = useState<CustomPredictionAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                setError('La imagen es demasiado pesada (Máx 4MB).');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setSelectedImage({
                    base64: base64String,
                    mimeType: file.type,
                    preview: URL.createObjectURL(file),
                });
                setInputText('');
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!inputText && !selectedImage) {
            setError('Por favor, introduce un pronóstico o sube una imagen.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            let predictionText = inputText;
            if (selectedImage) {
                setLoadingMessage('EXTRAYENDO DATOS DEL BOLETO...');
                predictionText = await getTextFromImage(selectedImage.base64, selectedImage.mimeType);
            }
            
            setLoadingMessage('EJECUTANDO NEXUS-9 AUDIT SUITE...');
            const result = await getCustomPredictionAnalysis(predictionText);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado durante la auditoría.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const isBetInSlip = (bet: BetSlipItem | undefined) => {
        if (!bet) return false;
        return betSlip.some(item => 
            item.matchIdentifier === bet.matchIdentifier && 
            item.outcomeName === bet.outcomeName &&
            item.marketName === bet.marketName
        );
    };

    const renderResult = () => {
        if (!analysisResult) return null;

        if (analysisResult.error || !analysisResult.isValidPrediction) {
            return (
                <div className="text-center text-yellow-400 bg-yellow-900/20 p-8 rounded-2xl my-4 border border-yellow-500/30">
                    <WarningIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-bold text-lg">No se pudo auditar el pronóstico</p>
                    <p className="text-sm mt-2">{analysisResult.error || "Nexus-9 no ha identificado un evento real correspondiente a tu entrada."}</p>
                </div>
            );
        }

        const isInSlip = isBetInSlip(analysisResult.structuredBet as any);

        return (
            <div className="mt-8 space-y-12 animate-fade-in">
                {/* Header Section */}
                <div className="bg-brand-secondary rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-accent/20 to-transparent p-8 border-b border-gray-800 flex flex-wrap justify-between items-center gap-6">
                        <div className="flex-grow">
                            <span className="text-[10px] text-brand-accent font-black tracking-[0.3em] uppercase block mb-2">AUDITORÍA FORENSE INSTITUCIONAL</span>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">"{analysisResult.originalPrediction}"</h3>
                            {analysisResult.matchContext && (
                                <p className="text-brand-text-secondary mt-2 font-bold uppercase text-xs">{analysisResult.matchContext.teamA} vs {analysisResult.matchContext.teamB} // {analysisResult.matchContext.league}</p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center bg-black/40 p-4 rounded-2xl border border-gray-700">
                                <FiabilityGauge score={analysisResult.fiabilityScore} size="large" />
                                <p className="text-[9px] text-gray-500 font-black uppercase mt-2">Reliability</p>
                            </div>
                            <div className="text-center bg-black/40 p-4 rounded-2xl border border-gray-700">
                                <FiabilityGauge score={analysisResult.valueScore} size="large" />
                                <p className="text-[9px] text-gray-500 font-black uppercase mt-2">Value EV+</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-8">
                        {/* LEFT: Structural Analysis */}
                        <div className="space-y-8">
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <BrainCircuitIcon className="w-5 h-5 text-brand-accent"/> Tesis Forense de 5 Vectores
                            </h4>
                            <StructuredAnalysisDisplay analysis={analysisResult.analysis} />
                        </div>

                        {/* RIGHT: Nexus-9 Audit Suite Widgets */}
                        <div className="space-y-8">
                             <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <TargetIcon className="w-5 h-5 text-red-500 animate-pulse"/> Terminal de Stress-Test Nexus-9
                            </h4>
                            {analysisResult.nexus9Audit ? (
                                <AuditWidget audit={analysisResult.nexus9Audit} />
                            ) : (
                                <div className="bg-gray-800/30 p-8 rounded-2xl border border-dashed border-gray-700 text-center flex flex-col items-center">
                                    <LoadingSpinner />
                                    <p className="mt-4 text-xs text-gray-500 uppercase font-black tracking-widest">Ejecutando simulaciones Nexus-9...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="bg-gray-900/50 p-6 border-t border-gray-800 flex justify-center">
                        <button 
                            onClick={() => analysisResult.structuredBet && onToggleBet(analysisResult.structuredBet as any)}
                            className={`w-full md:w-auto font-black py-4 px-12 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-4 text-lg transform hover:scale-[1.02] ${
                                isInSlip ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-brand-accent hover:bg-brand-accent-dark text-brand-primary'
                            }`}
                        >
                            <TicketIcon className="w-6 h-6" />
                            {isInSlip ? 'QUITAR DEL BOLETO' : 'INYECTAR AUDITORÍA AL BOLETO'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-xl border border-brand-accent/30">
                         <ClipboardListIcon className="w-8 h-8 text-brand-accent"/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Nexus-9: Audit Suite</h2>
                        <p className="text-brand-text-secondary text-[10px] font-mono tracking-widest uppercase">Institutional Stress-Test Terminal</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg transition-colors border border-gray-700 uppercase text-xs">
                    &larr; Volver
                </button>
            </div>

            <div className="bg-brand-secondary rounded-3xl p-8 max-w-5xl mx-auto shadow-2xl border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BrainCircuitIcon className="w-32 h-32 text-brand-accent"/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    <div>
                        <label htmlFor="prediction-text" className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Input de Pronóstico Manual</label>
                        <textarea 
                            id="prediction-text"
                            rows={5}
                            value={inputText}
                            onChange={(e) => { setInputText(e.target.value); setSelectedImage(null); }}
                            placeholder="Ej: Liverpool vs Chelsea - Over 2.5 @1.90..."
                            className="w-full bg-black/40 border border-gray-700 rounded-2xl p-5 text-white focus:outline-none focus:border-brand-accent resize-none shadow-inner text-lg font-medium"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                         <label htmlFor="image-upload" className="w-full cursor-pointer group">
                            <div className="border-2 border-dashed border-gray-600 rounded-3xl p-10 text-center hover:border-brand-accent hover:bg-gray-800/30 transition-all duration-300 flex flex-col items-center">
                                {selectedImage ? (
                                    <div className="relative">
                                        <img src={selectedImage.preview} alt="Vista previa" className="max-h-40 mx-auto rounded-xl shadow-2xl" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                            <p className="text-white text-[10px] font-black uppercase tracking-tighter">Cambiar Captura</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-gray-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                            <TicketIcon className="w-8 h-8 text-gray-500 group-hover:text-brand-accent"/>
                                        </div>
                                        <p className="text-brand-text font-black text-xs uppercase tracking-widest">Captura de Boleto</p>
                                        <p className="text-[10px] text-gray-500 mt-2 italic">OCR forense para casas de apuestas</p>
                                    </>
                                )}
                            </div>
                        </label>
                        <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} />
                    </div>
                </div>
                 <div className="mt-10">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || (!inputText && !selectedImage)}
                        className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-5 px-6 rounded-2xl transition-all shadow-[0_0_40px_rgba(0,245,160,0.25)] flex items-center justify-center gap-4 text-xl disabled:opacity-30 transform active:scale-[0.98]"
                    >
                        {isLoading ? <LoadingSpinner /> : <><BrainCircuitIcon className="w-6 h-6" /> INICIAR AUDITORÍA NEXUS-9</>}
                    </button>
                    {isLoading && (
                        <p className="text-center mt-4 text-brand-accent font-mono text-[10px] animate-pulse tracking-[0.4em] uppercase">{loadingMessage}</p>
                    )}
                 </div>
            </div>
            
            {error && <div className="text-center text-red-400 bg-red-900/10 border border-red-500/30 p-6 rounded-xl my-8 max-w-5xl mx-auto animate-fade-in font-bold">{error}</div>}

            <div className="max-w-7xl mx-auto">
                {renderResult()}
            </div>
        </div>
    );
};
