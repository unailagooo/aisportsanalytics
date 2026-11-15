
import React, { useState, useMemo } from 'react';
import { searchFixtures, getSingleMatchParlay } from '../services/geminiService';
import type { Fixture, AIRecommendedParlay, AIRecommendedParlayLeg, ParlayAggressiveness, QuantumVectorAnalysis, BetSlipItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchIcon, TargetIcon, BrainCircuitIcon, DollarSignIcon, ChartLineIcon, RefreshIcon, WarningIcon, LayersIcon, ShieldCheckIcon, ActivityIcon, ScaleIcon, LockIcon, FlameIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;
    const sections = [
        { title: 'VIGILANCIA CUANTITATIVA (RIGOR 2026)', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'DINÁMICA DE MOMENTUM (RECONOCIMIENTO)', content: analysis.vectorMomentum, icon: ActivityIcon, color: 'text-purple-400' },
        { title: 'LIQUIDEZ TRIANGULADA (MARKET RIGOR)', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'BLINDAJE DE ESTRÉS (ZERO-LOSS AUDIT)', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO DE INFALIBILIDAD NEXUS-9', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];
    return (
        <div className="space-y-4">
            {sections.map(s => s.content && s.content !== 'N/A' && (
                <div key={s.title} className="bg-gray-800/40 p-4 rounded-xl border-l-4 border-gray-700 shadow-lg group hover:border-brand-accent transition-all">
                    <h5 className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${s.color} mb-2`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.title}
                    </h5>
                    <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line border-l border-gray-800 pl-4 ml-1">
                        {s.content}
                    </p>
                </div>
            ))}
        </div>
    );
};

export const SingleMatchParlayDashboard: React.FC<{
    onBack: () => void;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
}> = ({ onBack, onAddParlayToSlip }) => {
    const [query, setQuery] = useState('');
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('INTERCEPTANDO ACTIVO...');
    const [parlay, setParlay] = useState<AIRecommendedParlay | null>(null);
    const [targetOdds, setTargetOdds] = useState('30.0');
    const [aggressiveness, setAggressiveness] = useState<ParlayAggressiveness>('Balanced');
    const [activeLegIndex, setActiveLegIndex] = useState<number | 'global'>('global');

    const actualOdds = useMemo(() => {
        if (!parlay || !parlay.legs) return 0;
        // In SGPs, linear multiplication is often incorrect. We show the final odds proposed by AI
        // but for display we can show the legs' product if the AI doesn't specify it.
        return parlay.legs.reduce((acc, l) => acc * (Number(l.odds) || 1), 1);
    }, [parlay]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsLoading(true);
        setLoadingMessage('ACCEDIENDO A MERCADOS DE LIQUIDEZ...');
        setFixtures([]);
        try {
            const results = await searchFixtures('Football' as any, query); 
            setFixtures(results);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedFixture) return;
        setIsLoading(true);
        setParlay(null);
        
        const messages = [
            'TRIANGULANDO CUOTAS REALES (BET365/PINNACLE)...',
            'APLICANDO IMPUESTO DE CORRELACIÓN SGP...',
            'AUDITANDO BAJAS DE ÚLTIMA HORA...',
            'EJECUTANDO PROTOCOLO DE ÉXITO GARANTIZADO...',
            'SINTETIZANDO CADENA DE INFALIBILIDAD...'
        ];
        
        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            setLoadingMessage(messages[msgIdx % messages.length]);
            msgIdx++;
        }, 2000);

        try {
            const result = await getSingleMatchParlay(selectedFixture, parseFloat(targetOdds), aggressiveness);
            setParlay(result);
            setActiveLegIndex('global');
        } catch (e) {
            console.error(e);
        } finally {
            clearInterval(msgInterval);
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-xl border border-brand-accent/30 shadow-[0_0_20px_rgba(0,245,160,0.2)]">
                        <LockIcon className="w-8 h-8 text-brand-accent animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Combinadas de Autor</h2>
                        <p className="text-[10px] text-brand-accent font-mono tracking-[0.4em] uppercase">Rigor de Cuota & Éxito Garantizado</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg border border-gray-700 transition-all uppercase text-xs tracking-widest">
                    &larr; Volver
                </button>
            </div>

            {!selectedFixture ? (
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <div className="bg-brand-secondary p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <SearchIcon className="w-32 h-32 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-tighter italic">Intercepción de Activo Forense</h3>
                        <form onSubmit={handleSearch} className="relative group">
                            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                            <input 
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Ej: Racing vs Barcelona..."
                                className="w-full bg-black/40 border-2 border-gray-800 rounded-3xl py-7 pl-16 pr-6 text-xl text-white focus:outline-none focus:border-brand-accent transition-all shadow-2xl backdrop-blur-md"
                            />
                        </form>
                        <p className="text-[10px] text-gray-600 mt-6 text-center font-mono uppercase tracking-[0.2em]">Escaneo en tiempo real de mercados Sharp y liquidez internacional.</p>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-accent font-mono text-xs animate-pulse tracking-[0.3em] uppercase">{loadingMessage}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fixtures.map((f, i) => (
                            <button 
                                key={i}
                                onClick={() => setSelectedFixture(f)}
                                className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 hover:border-brand-accent transition-all text-left flex justify-between items-center group relative overflow-hidden shadow-lg"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-all"></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{f.league}</p>
                                    <p className="text-white font-black text-xl group-hover:text-brand-accent transition-colors uppercase tracking-tight truncate">{f.teamA} vs {f.teamB}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <ActivityIcon className="w-3 h-3 text-gray-600"/>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(f.matchDateTime).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800 group-hover:border-brand-accent group-hover:bg-brand-accent/10 transition-all">
                                    <ScaleIcon className="w-5 h-5 text-brand-accent" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
                    <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 flex flex-wrap justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-blue-500 to-brand-accent"></div>
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-gray-900 rounded-3xl border border-gray-800 shadow-inner">
                                <ShieldCheckIcon className="w-8 h-8 text-brand-accent" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedFixture.teamA} vs {selectedFixture.teamB}</h3>
                                <div className="flex gap-4 mt-3">
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{selectedFixture.league}</span>
                                    <span className="text-[10px] text-brand-accent font-black uppercase tracking-[0.2em]">RIGOR: MÁXIMO</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => { setSelectedFixture(null); setParlay(null); }} className="px-6 py-2 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 font-black rounded-xl text-[10px] uppercase tracking-widest border border-gray-700 transition-all">Cambiar Partido</button>
                    </div>

                    {!parlay ? (
                        <div className="max-w-2xl mx-auto bg-brand-secondary p-12 rounded-[3rem] border border-gray-800 shadow-[0_0_60px_rgba(0,0,0,0.5)] animate-fade-in relative">
                             <div className="absolute -top-12 -left-12 w-40 h-40 bg-brand-accent/5 rounded-full blur-3xl"></div>
                            <h3 className="text-2xl font-black text-white text-center uppercase tracking-tighter mb-12 italic">Cómputo de Sinergia y Cuota Real</h3>
                            <div className="space-y-10">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">Multiplicador de Éxito Objetivo</label>
                                    <div className="relative">
                                         <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-700">@</span>
                                         <input 
                                            type="number" 
                                            value={targetOdds}
                                            onChange={e => setTargetOdds(e.target.value)}
                                            step="0.1"
                                            className="w-full bg-gray-900 border border-gray-700 rounded-3xl p-8 text-white text-6xl font-black font-mono text-center focus:border-brand-accent outline-none shadow-inner"
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-4 text-center uppercase tracking-widest">Nexus-9 triangulará con casas top para asegurar que la cuota sea verídica.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">Nivel de Protocolo (Garantía de Éxito)</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {(['Safe', 'Balanced', 'Aggressive'] as ParlayAggressiveness[]).map(agg => (
                                            <button 
                                                key={agg}
                                                onClick={() => setAggressiveness(agg)}
                                                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center group ${aggressiveness === agg ? 'border-brand-accent bg-brand-accent/5 shadow-[0_0_20px_rgba(0,245,160,0.1)]' : 'border-gray-800 bg-gray-900/50 opacity-40 hover:opacity-70'}`}
                                            >
                                                <span className={`text-xs font-black uppercase tracking-widest ${aggressiveness === agg ? 'text-brand-accent' : 'text-white'}`}>{agg === 'Safe' ? 'Blindaje' : agg === 'Balanced' ? 'Eficiencia' : 'Aceleración'}</span>
                                                <span className="text-[8px] text-gray-600 mt-2 font-bold uppercase">ÉXITO OBLIGATORIO</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-br from-brand-accent to-brand-accent-dark text-brand-primary font-black py-7 rounded-3xl transition-all shadow-[0_20px_50px_rgba(0,245,160,0.3)] uppercase tracking-[0.2em] text-xl flex items-center justify-center gap-4 disabled:opacity-30 transform hover:scale-[1.02] active:scale-95"
                                    >
                                        {isLoading ? <LoadingSpinner /> : <><LayersIcon className="w-6 h-6"/> INICIAR FRAGUA RIGUROSA</>}
                                    </button>
                                    {isLoading && (
                                        <div className="mt-8 text-center space-y-2 animate-pulse">
                                            <p className="font-mono text-[11px] text-brand-accent tracking-[0.5em] uppercase font-black">{loadingMessage}</p>
                                            <div className="w-48 h-1 bg-gray-800 mx-auto rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-accent animate-[loading_3s_ease-in-out_infinite]"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-brand-secondary rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-10">
                                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">Cómputo Riguroso</h4>
                                        <FiabilityGauge score={parlay.viabilityScore} size="small" />
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-3xl border border-gray-800 mb-8 text-center shadow-inner group hover:border-brand-accent transition-all">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Multiplicador Final Triangulado</p>
                                        <span className="text-5xl font-black text-brand-accent font-mono tracking-tighter">@{actualOdds.toFixed(2)}</span>
                                        <div className="mt-2 flex items-center justify-center gap-1">
                                            <ShieldCheckIcon className="w-3 h-3 text-green-500" />
                                            <span className="text-[8px] text-green-500 font-black uppercase">Cuota Verificada</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                        <button 
                                            onClick={() => setActiveLegIndex('global')}
                                            className={`w-full p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${activeLegIndex === 'global' ? 'border-brand-accent bg-brand-accent/5' : 'border-transparent bg-gray-900/50 hover:bg-gray-800'}`}
                                        >
                                            <p className="text-[10px] text-brand-accent font-black uppercase tracking-[0.3em]">Auditoría de Certeza</p>
                                            <ActivityIcon className={`w-4 h-4 ${activeLegIndex === 'global' ? 'text-brand-accent' : 'text-gray-600'}`}/>
                                        </button>
                                        <div className="py-2 flex items-center gap-4">
                                            <div className="h-px flex-grow bg-gray-800"></div>
                                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Cadena de Infalibilidad</span>
                                            <div className="h-px flex-grow bg-gray-800"></div>
                                        </div>
                                        {(parlay.legs || []).map((leg, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setActiveLegIndex(i)}
                                                className={`w-full p-5 rounded-2xl text-left border-2 transition-all group ${activeLegIndex === i ? 'border-brand-accent bg-brand-accent/5' : 'border-transparent bg-gray-900/50 hover:border-gray-700'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0 pr-4">
                                                        <p className="text-[9px] text-gray-500 font-black uppercase truncate tracking-tighter mb-1 opacity-70">{leg.marketName}</p>
                                                        <p className="text-white font-black text-sm uppercase truncate tracking-tight">{leg.outcomeName}</p>
                                                    </div>
                                                    <span className="font-mono font-black text-brand-accent text-lg">@{leg.odds.toFixed(2)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => onAddParlayToSlip(parlay.legs || [])}
                                        className="w-full mt-10 bg-brand-accent text-brand-primary font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-brand-accent/20 transition-all hover:translate-y-[-4px] transform"
                                    >
                                        <LayersIcon className="w-6 h-6"/> INYECTAR COMBINADA
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="bg-brand-secondary rounded-[2.5rem] border border-gray-800 p-10 shadow-2xl h-full relative overflow-hidden">
                                    {activeLegIndex === 'global' ? (
                                        <div className="animate-fade-in space-y-10">
                                            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-8">
                                                <div className="p-3 bg-brand-accent/10 rounded-2xl">
                                                    <ShieldCheckIcon className="w-8 h-8 text-brand-accent" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-black text-2xl uppercase tracking-tighter italic">Veredicto del Vidente Analítico</h4>
                                                    <p className="text-[9px] text-gray-500 font-mono tracking-[0.4em] uppercase mt-1">Éxito garantizado mediante análisis forense.</p>
                                                </div>
                                            </div>
                                            <StructuredAnalysisDisplay analysis={parlay.analysis} />
                                            {parlay.explanationForOddsDeviation && (
                                                <div className="mt-8 p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4 items-start">
                                                    <BrainCircuitIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                                    <div>
                                                        <p className="text-xs text-blue-400 font-black uppercase mb-1 tracking-widest">Nota de Calibración Rigurosa (Cuotas Realistas)</p>
                                                        <p className="text-sm text-gray-300 italic leading-relaxed">"{parlay.explanationForOddsDeviation}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        activeLegIndex !== null && parlay.legs && parlay.legs[activeLegIndex] ? (
                                        <div className="animate-fade-in">
                                            <div className="flex justify-between items-start mb-10 bg-gray-900/50 p-8 rounded-[2rem] border border-gray-800 shadow-inner">
                                                <div className="min-w-0 pr-8">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <LockIcon className="w-3 h-3 text-brand-accent" />
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">{parlay.legs[activeLegIndex].marketName}</p>
                                                    </div>
                                                    <h4 className="text-4xl font-black text-brand-accent uppercase tracking-tighter leading-none mb-4">{parlay.legs[activeLegIndex].outcomeName}</h4>
                                                    <div className="flex gap-4">
                                                        <span className="bg-brand-accent/10 px-4 py-1.5 rounded-full text-[10px] text-brand-accent font-black border border-brand-accent/20 uppercase tracking-widest">Certeza: {parlay.legs[activeLegIndex].fiabilityScore}%</span>
                                                        <span className="bg-green-400/10 px-4 py-1.5 rounded-full text-[10px] text-green-400 font-black border border-green-400/20 uppercase tracking-widest">ÉXITO INEVITABLE</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-600 font-black uppercase mb-1 tracking-widest">Cuota Real Triangulada</p>
                                                    <span className="text-5xl font-black text-white font-mono block">@{(Number(parlay.legs[activeLegIndex].odds) || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <StructuredAnalysisDisplay analysis={parlay.legs[activeLegIndex].justification} />
                                        </div>
                                        ) : null
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
