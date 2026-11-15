
import React, { useState, useRef, useEffect } from 'react';
import { executeSpecialOpsRequest } from '../services/geminiService';
import type { SpecialOpsResponse, SpecialOpsIntent, RoadmapStep, AllocationItem, BetSlipItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { BrainCircuitIcon, DollarSignIcon, ChartLineIcon, RefreshIcon, TargetIcon, LayersIcon, WarningIcon, ShieldCheckIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface SpecialOpsTerminalProps {
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
}

export const SpecialOpsTerminal: React.FC<SpecialOpsTerminalProps> = ({ onBack, onToggleBet }) => {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState<SpecialOpsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleExecute = async () => {
        if (!input.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResponse(null);
        try {
            const result = await executeSpecialOpsRequest(input, {});
            setResponse(result);
            setTimeout(() => canvasRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (e) {
            setError("Error en la matriz de despliegue. Los satélites no responden. Reintente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-xl border border-brand-accent/30 shadow-[0_0_15px_rgba(0,245,160,0.2)]">
                        <TargetIcon className="w-8 h-8 text-brand-accent animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Nexus-9: Special Ops</h2>
                        <p className="text-[10px] text-brand-accent font-mono tracking-[0.3em]">STRATEGIC DEPLOYMENT TERMINAL v4.2</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg border border-gray-700 transition-all uppercase text-xs tracking-widest">
                    &larr; Abortar Misión
                </button>
            </div>

            <div className="max-w-5xl mx-auto">
                {/* Terminal Input */}
                <div className="bg-black/40 border-2 border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl mb-12 group focus-within:border-brand-accent transition-all duration-500">
                    <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        <span className="text-brand-accent">●</span> Input Command
                    </div>
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ej: 'Tengo 50€ para el fin de semana, construye un plan de escalada de 3 pasos empezando por el Barça-Madrid...'"
                        className="w-full bg-transparent border-none text-white text-lg focus:ring-0 resize-none min-h-[120px] placeholder:text-gray-700 font-medium"
                    />
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
                        <div className="flex gap-4 text-[9px] text-gray-600 font-mono">
                            <span>MODE: ADAPTIVE</span>
                            <span>ENGINE: PRO-PREVIEW</span>
                            <span>GROUNDING: ON</span>
                        </div>
                        <button 
                            onClick={handleExecute}
                            disabled={isLoading || !input.trim()}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black px-10 py-3 rounded-2xl transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(0,245,160,0.3)]"
                        >
                            {isLoading ? <LoadingSpinner /> : <><BrainCircuitIcon className="w-5 h-5"/> EJECUTAR PROTOCOLO</>}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-2xl text-center animate-fade-in mb-12">
                        <WarningIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="text-red-400 font-bold">{error}</p>
                    </div>
                )}

                {/* The Canvas - Dynamic Response Renderer */}
                <div ref={canvasRef}>
                    {response && <ResponseRenderer response={response} onToggleBet={onToggleBet} />}
                </div>
            </div>
        </div>
    );
};

const ResponseRenderer: React.FC<{ response: SpecialOpsResponse, onToggleBet: (item: BetSlipItem) => void }> = ({ response, onToggleBet }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Verdict */}
            <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-blue-500 to-purple-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-grow">
                        <span className="bg-brand-accent/10 text-brand-accent px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-accent/20">Veredicto Estratégico</span>
                        <h3 className="text-4xl font-black text-white mt-4 uppercase tracking-tighter">{response.title}</h3>
                        <p className="text-brand-text-secondary text-lg mt-2 leading-relaxed italic">"{response.summary}"</p>
                    </div>
                    <div className="flex gap-6 bg-black/30 p-6 rounded-2xl border border-gray-800 min-w-[280px] justify-center">
                        <div className="text-center">
                            <FiabilityGauge score={response.reliabilityScore} size="large" />
                            <p className="text-[9px] text-gray-500 uppercase font-black mt-2">Fiabilidad</p>
                        </div>
                        <div className="w-px h-16 bg-gray-800"></div>
                        <div className="text-center">
                            <FiabilityGauge score={response.valueScore} size="large" />
                            <p className="text-[9px] text-gray-500 uppercase font-black mt-2">Valor (EV+)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Intent Specific Widgets */}
            {response.intent === 'ROADMAP' && response.data?.steps && <RoadmapWidget steps={response.data.steps} />}
            {response.intent === 'PARLAY' && response.data?.legs && <CustomParlayWidget legs={response.data.legs} onToggleBet={onToggleBet} />}
            {response.intent === 'ALLOCATION' && response.data?.items && <AllocationWidget items={response.data.items} />}
            
            {/* Structural Analysis */}
            <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-xl">
                 <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <BrainCircuitIcon className="text-brand-accent w-5 h-5"/> Análisis Forense Nexus-9
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <AnalysisSection title="Vector Cuantitativo" content={response.analysis?.vectorCuantitativo} color="text-blue-400" icon={ChartLineIcon} />
                        <AnalysisSection title="Vector Momentum" content={response.analysis?.vectorMomentum} color="text-purple-400" icon={RefreshIcon} />
                    </div>
                    <div className="space-y-6">
                        <AnalysisSection title="Vector Mercado" content={response.analysis?.vectorMercado} color="text-yellow-400" icon={DollarSignIcon} />
                        <AnalysisSection title="Simulación de Estrés" content={response.analysis?.simulacionEstres} color="text-red-400" icon={WarningIcon} />
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-800">
                     <AnalysisSection title="Veredicto Cuántico" content={response.analysis?.veredictoCuantico} color="text-brand-accent" icon={BrainCircuitIcon} />
                </div>
            </div>
        </div>
    );
};

const RoadmapWidget: React.FC<{ steps: RoadmapStep[] }> = ({ steps }) => (
    <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-xl">
        <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10">Ruta de Escalada Progresiva</h4>
        <div className="space-y-12 relative">
            <div className="absolute left-[20px] top-4 bottom-4 w-1 bg-gradient-to-b from-brand-accent to-gray-800"></div>
            {steps.map((step, idx) => (
                <div key={idx} className="relative pl-16 group">
                    <div className="absolute left-0 top-0 w-10 h-10 bg-black border-2 border-brand-accent rounded-full flex items-center justify-center font-black text-brand-accent shadow-[0_0_15px_rgba(0,245,160,0.4)] z-10 transition-transform group-hover:scale-110">
                        {step.order}
                    </div>
                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 group-hover:border-brand-accent/50 transition-all">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                            <div>
                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{step.time}</span>
                                <h5 className="text-xl font-black text-white uppercase">{step.match}</h5>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-500 uppercase block mb-1">Stake Invertido</span>
                                <span className="text-2xl font-black text-brand-accent font-mono">{step.stake}€</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl mb-4 border border-gray-800">
                            <div className="flex-grow">
                                <p className="text-xs text-gray-500 uppercase font-bold">Selección Objetivo</p>
                                <p className="text-white font-bold text-lg">{step.selection}</p>
                            </div>
                            <div className="text-center px-6 border-l border-gray-800">
                                <p className="text-[10px] text-gray-500 uppercase">Cuota</p>
                                <p className="text-xl font-black text-white font-mono">@{(Number(step.odds) || 0).toFixed(2)}</p>
                            </div>
                        </div>
                        <p className="text-xs text-brand-text-secondary leading-relaxed italic">"{step.reasoning}"</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CustomParlayWidget: React.FC<{ legs: any[], onToggleBet: any }> = ({ legs, onToggleBet }) => (
    <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-xl">
        <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Estructura de Combinada de Autor</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {legs.map((leg, idx) => (
                <div key={idx} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 group hover:border-blue-500 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">LEG #{idx+1}</span>
                        <span className="font-mono text-xl font-black text-white">@{(Number(leg.odds) || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 uppercase font-bold mb-1">{leg.teamA} vs {leg.teamB}</p>
                    <p className="text-lg font-black text-white uppercase mb-4">{leg.selection}</p>
                    <p className="text-xs text-brand-text-secondary leading-relaxed mb-6 italic">"{leg.reason}"</p>
                    <button 
                        onClick={() => onToggleBet({ matchIdentifier: `${leg.teamA} vs ${leg.teamB}`, marketName: leg.market, outcomeName: leg.selection, odds: leg.odds })}
                        className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-black py-2 rounded-xl text-[10px] uppercase transition-all"
                    >
                        Inyectar Pierna al Slip
                    </button>
                </div>
            ))}
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-between items-center">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-black">Multiplicador Final</p>
                <p className="text-4xl font-black text-brand-accent font-mono">@{legs.reduce((acc, l) => acc * (Number(l.odds) || 1), 1).toFixed(2)}</p>
            </div>
            <button className="bg-brand-accent text-brand-primary font-black px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-brand-accent/20">
                <LayersIcon className="w-5 h-5"/> AÑADIR COMBINADA COMPLETA
            </button>
        </div>
    </div>
);

const AllocationWidget: React.FC<{ items: AllocationItem[] }> = ({ items }) => (
    <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-xl">
        <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Despliegue de Portafolio Estratégico</h4>
        <div className="space-y-6">
            {items.map((item, idx) => (
                <div key={idx} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-8 items-center">
                    <div className="text-center min-w-[120px]">
                        <p className="text-4xl font-black text-brand-accent">{item.percentage}%</p>
                        <p className="text-[10px] text-gray-600 uppercase font-bold mt-1">Allocation</p>
                    </div>
                    <div className="flex-grow">
                        <h5 className="text-white font-black uppercase text-lg mb-2">{item.category}</h5>
                        <p className="text-sm text-brand-text-secondary leading-relaxed">{item.description}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                        <p className="text-2xl font-black text-white font-mono">{item.amount}€</p>
                        <p className="text-[10px] text-gray-600 uppercase font-bold mt-1">Monto Sugerido</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const AnalysisSection: React.FC<{ title: string, content: string | undefined, color: string, icon: any }> = ({ title, content, color, icon: Icon }) => (
    <div className="space-y-2">
        <h5 className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${color}`}>
            <Icon className="w-4 h-4" /> {title}
        </h5>
        <p className="text-sm text-brand-text-secondary leading-relaxed border-l border-gray-800 pl-4">{content || 'Datos no disponibles para este vector.'}</p>
    </div>
);
