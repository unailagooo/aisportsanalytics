
import React, { useState, useMemo } from 'react';
import { generateSuperCuota } from '../services/geminiService';
import type { SuperCuota, SuperCuotaConfig, SuperCuotaAggressiveness, Sport, AIRecommendedParlayLeg, QuantumVectorAnalysis } from '../types';
import { Sport as SportEnum } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { FlameIcon, BrainCircuitIcon, DollarSignIcon, ChartLineIcon, WarningIcon, RefreshIcon, LayersIcon, ShieldCheckIcon, ActivityIcon, SearchIcon, ScaleIcon, LockIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface SuperCuotasDashboardProps {
    onBack: () => void;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
}

const formatMatchDate = (isoString: string | undefined) => {
    if (!isoString) return 'Fecha por confirmar';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Fecha inválida';
    }
};

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;
    const sections = [
        { title: 'VECTOR CUANTITATIVO (MONTE CARLO 50K)', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR MOMENTUM (FATIGA & PSI)', content: analysis.vectorMomentum, icon: ActivityIcon, color: 'text-purple-400' },
        { title: 'VECTOR MERCADO (SHARP FLOW)', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'VECTOR DE ESTRÉS (ADVERSE SCENARIOS)', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'FORENSIC EDGE VERDICT', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];
    return (
        <div className="space-y-4">
            {sections.map(s => s.content && s.content !== 'N/A' && (
                <div key={s.title} className="bg-gray-800/40 p-4 rounded-xl border-l-4 border-gray-700">
                    <h5 className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${s.color} mb-2`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.title}
                    </h5>
                    <div className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line border-l border-gray-800 pl-4 ml-1">
                        {s.content}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const SuperCuotasDashboard: React.FC<SuperCuotasDashboardProps> = ({ onBack, onAddParlayToSlip }) => {
    const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const [config, setConfig] = useState<SuperCuotaConfig>({
        targetOdds: 100,
        aggressiveness: 'Baja',
        days: 7,
        allowedSports: [SportEnum.Football],
        excludeToday: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [superCuota, setSuperCuota] = useState<SuperCuota | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeLegIndex, setActiveLegIndex] = useState<number | 'global' | 'planB'>('global');
    const [loadingMessage, setLoadingMessage] = useState('INICIANDO FASE DE INTERCEPCIÓN...');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setSuperCuota(null);
        
        const messages = [
            'TRIANGULANDO FUENTES (OPTA/FLASHSCORE)...',
            'EJECUTANDO IRON TARGET FILTER (SGP+)...',
            'MODELANDO ESCENARIOS ADVERSOS (NEXUS-9)...',
            'SINTETIZANDO CADENA DE ACUMULACIÓN...',
            'VERIFICANDO BLINDAJE DE SEGURIDAD...',
            'FORJANDO SUPERCUOTA DE ALTO IMPACTO...'
        ];
        
        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            setLoadingMessage(messages[msgIdx % messages.length]);
            msgIdx++;
        }, 2000);

        try {
            const result = await generateSuperCuota(config);
            if (!result || !result.legs || result.legs.length === 0) {
                throw new Error("NO HAY SUPERCUOTA SEGURA DISPONIBLE bajo estos parámetros.");
            }
            setSuperCuota(result);
            setActiveLegIndex('global');
        } catch (e) {
            setError(e instanceof Error ? e.message : "Fallo en la forja. El mercado es demasiado volátil hoy.");
        } finally {
            clearInterval(msgInterval);
            setIsLoading(false);
        }
    };

    const handleSportToggle = (sport: Sport) => {
        setConfig(prev => ({
            ...prev,
            allowedSports: prev.allowedSports.includes(sport)
                ? prev.allowedSports.filter(s => s !== sport)
                : [...prev.allowedSports, sport]
        }));
    };

    const actualOdds = useMemo(() => {
        if (!superCuota) return 0;
        return superCuota.legs.reduce((acc, l) => acc * (l.odds || 1), 1);
    }, [superCuota]);

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                        <FlameIcon className="w-8 h-8 text-orange-500 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">FORJA DE SUPERCUOTAS</h2>
                        <p className="text-[10px] text-orange-500 font-mono tracking-[0.3em] uppercase">Protocolo Iron-Target v2.0</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg border border-gray-700 transition-all uppercase text-xs tracking-widest">
                    &larr; Volver
                </button>
            </div>

            {!superCuota ? (
                <div className="max-w-4xl mx-auto bg-brand-secondary p-10 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FlameIcon className="w-48 h-48 text-orange-500" />
                    </div>
                    
                    <div className="text-center mb-10 border-b border-gray-800 pb-8">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Configuración de Despliegue</h3>
                        <p className="text-orange-500 font-mono text-[10px] uppercase tracking-widest">Sincronización: {todayLabel}</p>
                    </div>
                    
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex justify-between">
                                        <span>Multiplicador Objetivo</span>
                                        <span className="text-orange-500">MÍN: @15</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-700">@</span>
                                        <input 
                                            type="number" 
                                            value={config.targetOdds}
                                            onChange={e => setConfig({...config, targetOdds: parseInt(e.target.value) || 15})}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-6 pl-14 text-white text-5xl font-black font-mono text-center focus:border-orange-500 outline-none shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-black/20 rounded-2xl border border-gray-800">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Parámetros Temporales</label>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="14" 
                                        value={config.days} 
                                        onChange={e => setConfig({...config, days: parseInt(e.target.value)})}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-gray-600 mt-3 uppercase tracking-tighter">
                                        <span>Hoy</span>
                                        <span className="text-orange-500 text-lg font-black">{config.days} Días</span>
                                        <span>Futuro</span>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-gray-800">
                                        <button 
                                            onClick={() => setConfig({...config, excludeToday: !config.excludeToday})}
                                            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${config.excludeToday ? 'border-brand-accent bg-brand-accent/5 text-white' : 'border-gray-800 text-gray-500 grayscale'}`}
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-widest">Excluir Eventos de Hoy</span>
                                            <div className={`w-4 h-4 rounded-full border-2 ${config.excludeToday ? 'bg-brand-accent border-brand-accent' : 'border-gray-600'}`}></div>
                                        </button>
                                        <p className="text-[9px] text-gray-600 mt-2 text-center uppercase font-bold tracking-tighter">Útil para evitar varianza de última hora.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Nivel de Riesgo (Protocolo Estricto)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(['Baja', 'Recomendada', 'Alta'] as SuperCuotaAggressiveness[]).map(agg => (
                                            <button 
                                                key={agg}
                                                onClick={() => setConfig({...config, aggressiveness: agg})}
                                                className={`p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center ${config.aggressiveness === agg ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-800 bg-gray-900/50 opacity-40'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{agg === 'Baja' ? 'BLINDAJE TOTAL (@1.30 max/leg)' : agg === 'Recomendada' ? 'RECOMENDADO (@1.45 max/leg)' : 'AGRESIVO (@2.20 max/leg)'}</span>
                                                    <span className="text-[9px] text-gray-500">{agg === 'Baja' ? 'Probabilidad >98%' : agg === 'Recomendada' ? 'Probabilidad >94%' : 'Probabilidad >88%'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Activos Permitidos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(SportEnum).map(sport => (
                                            <button 
                                                key={sport}
                                                onClick={() => handleSportToggle(sport)}
                                                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${config.allowedSports.includes(sport) ? 'border-orange-500 bg-orange-500/10 text-white shadow-[0_0_10px_rgba(234,88,12,0.1)]' : 'border-gray-800 bg-gray-900/50 opacity-30 hover:opacity-50'}`}
                                            >
                                                {sport}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl text-center animate-fade-in mb-4">
                                <WarningIcon className="w-8 h-8 text-red-500 mx-auto mb-3" />
                                <p className="text-red-400 font-bold text-sm">{error}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || config.allowedSports.length === 0}
                                className="w-full bg-gradient-to-r from-orange-600 to-red-800 hover:from-orange-500 hover:to-red-700 text-white font-black py-6 rounded-2xl transition-all shadow-[0_0_40px_rgba(234,88,12,0.4)] uppercase tracking-[0.2em] text-xl flex items-center justify-center gap-4 disabled:opacity-30 transform active:scale-[0.98]"
                            >
                                {isLoading ? <LoadingSpinner /> : <><ActivityIcon className="w-6 h-6"/> INICIAR FORJA CUÁNTICA</>}
                            </button>
                            {isLoading && (
                                <div className="mt-8 text-center space-y-3 animate-pulse-fast">
                                    <p className="font-mono text-[11px] text-orange-500 tracking-[0.5em] uppercase font-black">{loadingMessage}</p>
                                    <div className="w-64 h-1 bg-gray-800 mx-auto rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 animate-[loading_4s_ease-in-out_infinite]"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
                    {/* Header Results */}
                    <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
                        <div className="flex-grow">
                            <span className="text-[10px] text-orange-500 font-black tracking-[0.3em] uppercase block mb-2">PROTOCOLO IRON-TARGET FINALIZADO</span>
                            <h3 className="text-5xl font-black text-white uppercase tracking-tighter italic">@{actualOdds.toFixed(2)}</h3>
                            <p className="text-brand-text-secondary text-sm mt-3 leading-relaxed border-l-2 border-orange-500/30 pl-4">
                                {superCuota.decomposition.reasoning}
                            </p>
                        </div>
                        <div className="flex gap-8 bg-black/30 p-6 rounded-2xl border border-gray-800 min-w-[320px] justify-center items-center">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Ladrillos (Legs)</p>
                                <p className="text-4xl font-black text-white font-mono">{superCuota.legs.length}</p>
                            </div>
                            <div className="w-px h-12 bg-gray-800"></div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Certeza Global</p>
                                <FiabilityGauge score={superCuota.overallViabilityScore} size="large" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-brand-secondary rounded-2xl border border-gray-800 p-6 shadow-2xl">
                                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <LayersIcon className="w-4 h-4 text-orange-500" /> Arquitectura de la Combinada
                                </h4>
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    <button 
                                        onClick={() => setActiveLegIndex('global')}
                                        className={`w-full p-4 rounded-xl text-left border-2 transition-all ${activeLegIndex === 'global' ? 'border-orange-500 bg-orange-500/5' : 'border-transparent bg-gray-900/50'}`}
                                    >
                                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Resumen Forense Global</p>
                                    </button>
                                    {superCuota.legs.map((leg, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setActiveLegIndex(i)}
                                            className={`w-full p-4 rounded-xl text-left border-2 transition-all group ${activeLegIndex === i ? 'border-orange-500 bg-orange-500/5' : 'border-transparent bg-gray-900/50 hover:border-gray-700'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 pr-4">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{leg.teamA} vs {leg.teamB}</p>
                                                    <p className="text-white font-bold text-sm truncate">{leg.outcomeName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-black text-brand-accent block">@{leg.odds.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => onAddParlayToSlip(superCuota.legs)}
                                    className="w-full mt-8 bg-orange-500 text-brand-primary font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02]"
                                >
                                    <LayersIcon className="w-5 h-5"/> INYECTAR SUPERCUOTA
                                </button>
                                <button onClick={() => setSuperCuota(null)} className="w-full mt-3 bg-gray-800 text-white font-bold py-2 rounded-lg text-xs uppercase transition-all">Nueva Configuración</button>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-brand-secondary rounded-2xl border border-gray-800 p-8 shadow-2xl h-full">
                                {activeLegIndex === 'global' ? (
                                    <div className="animate-fade-in space-y-8">
                                        <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-6">
                                            <ShieldCheckIcon className="w-8 h-8 text-orange-500" />
                                            <div>
                                                <h4 className="text-white font-black text-xl uppercase tracking-tighter">Certificado de Certeza Sistémica</h4>
                                                <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Iron-Target Security Report</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="bg-black/30 p-5 rounded-2xl border border-gray-800">
                                                <h5 className="text-orange-500 font-black text-[10px] uppercase mb-4">Reality Check (Nexus-9 Audit)</h5>
                                                <p className="text-sm text-brand-text-secondary italic leading-relaxed">"{superCuota.realityCheck.warning}"</p>
                                                {superCuota.realityCheck.suggestedAlternative && (
                                                    <div className="mt-4 p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-xl text-[11px] text-brand-accent">
                                                        <span className="font-black uppercase block mb-1">Optimización sugerida:</span>
                                                        {superCuota.realityCheck.suggestedAlternative}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-black/30 p-5 rounded-2xl border border-gray-800">
                                                <h5 className="text-orange-500 font-black text-[10px] uppercase mb-4">Métricas de la Fragua</h5>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-[10px] text-gray-500 uppercase">Cuota Media / Pierna</span> <span className="font-mono font-bold">@{superCuota.decomposition.averageOddsPerLeg.toFixed(2)}</span></div>
                                                    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-[10px] text-gray-500 uppercase">Configuración SGP</span> <span className="text-brand-accent font-bold uppercase">Habilitado</span></div>
                                                    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-[10px] text-gray-500 uppercase">Filtro de Varianza</span> <span className="text-green-500 font-bold uppercase">NIVEL MÁXIMO</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        <StructuredAnalysisDisplay analysis={superCuota.globalAnalysis} />
                                    </div>
                                ) : (
                                    <div className="animate-fade-in">
                                        <div className="flex justify-between items-start mb-8 bg-gray-900/50 p-8 rounded-3xl border border-gray-800">
                                            <div>
                                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{superCuota.legs[activeLegIndex as number].teamA} vs {superCuota.legs[activeLegIndex as number].teamB}</h4>
                                                <p className="text-lg font-bold text-orange-500 uppercase tracking-widest">{superCuota.legs[activeLegIndex as number].outcomeName}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-2 uppercase">{superCuota.legs[activeLegIndex as number].league} // {superCuota.legs[activeLegIndex as number].marketName}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-5xl font-black text-white font-mono block">@{superCuota.legs[activeLegIndex as number].odds.toFixed(2)}</span>
                                                <span className="text-xs text-green-500 font-black uppercase mt-2 block tracking-widest">CERTEZA: {superCuota.legs[activeLegIndex as number].fiabilityScore}%</span>
                                            </div>
                                        </div>
                                        <StructuredAnalysisDisplay analysis={superCuota.legs[activeLegIndex as number].justification} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
