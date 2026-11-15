
import React, { useState, useMemo } from 'react';
import type { AIRecommendedParlayLeg, QuantumVectorAnalysis, Sport, Fixture, BetSlipItem, ParlayAggressiveness } from '../types';
import { getParlayResearchData, getFeedbackResponseForLeg, getPredictionForFixture } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
// Added SearchIcon to imports
import { TestTubeIcon, LayersIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon, TrashIcon, FootballIcon, BasketballIcon, TennisIcon, AmericanFootballIcon, BaseballIcon, IceHockeyIcon, EsportsIcon, Formula1Icon, ShieldCheckIcon, TargetIcon, SearchIcon } from './IconComponents';
import { Sport as SportEnum } from '../types';
import { FiabilityGauge } from './FiabilityGauge';
import { BetCard } from './BetCard';
import { FixtureListItem } from './FixtureListItem';
import { MatchDetailModal } from './MatchDetailModal';

// --- COMPONENTES AUXILIARES (Definidos primero para evitar ReferenceErrors) ---

const SportIcon: React.FC<{ sport: Sport, className?: string }> = ({ sport, className }) => {
    const icons = {
        [SportEnum.Football]: FootballIcon,
        [SportEnum.Basketball]: BasketballIcon,
        [SportEnum.Tennis]: TennisIcon,
        [SportEnum.AmericanFootball]: AmericanFootballIcon,
        [SportEnum.Baseball]: BaseballIcon,
        [SportEnum.IceHockey]: IceHockeyIcon,
        [SportEnum.Esports]: EsportsIcon,
        [SportEnum.Formula1]: Formula1Icon,
    };
    const IconComponent = icons[sport] || FootballIcon;
    return <IconComponent className={className} />;
};

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return <div className="text-center p-8 text-brand-text-secondary">Selecciona un pronóstico de la lista para ver su análisis detallado.</div>;
    const sections = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];

    return (
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            {sections.map(section => {
                if (!section.content || section.content === "N/A") return null;
                const Icon = section.icon;
                return (
                    <div key={section.title} className="bg-gray-800/50 p-3 rounded-lg border-l-4 border-gray-700">
                        <h4 className={`font-bold text-sm mb-2 flex items-center gap-2 ${section.color}`}><Icon className="w-5 h-5" />{section.title}</h4>
                        <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                );
            })}
        </div>
    );
};

const LegCard: React.FC<{ 
    leg: AIRecommendedParlayLeg, 
    isSelected: boolean, 
    onSelect: () => void, 
    onRemove: () => void, 
    onFeedback: () => void 
}> = ({ leg, isSelected, onSelect, onRemove, onFeedback }) => (
    <div className={`bg-gray-800/50 rounded-lg border-2 p-3 transition-all ${isSelected ? 'border-brand-accent' : 'border-transparent'}`}>
        <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={onSelect}>
             <div className="flex items-start gap-3 min-w-0">
                <SportIcon sport={leg.sport} className="w-6 h-6 text-brand-accent flex-shrink-0 mt-1"/>
                <div className="min-w-0">
                    <p className="font-bold text-white truncate leading-tight">{leg.outcomeName}</p>
                    <p className="text-sm text-brand-text-secondary truncate">{leg.teamA} vs {leg.teamB}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-mono font-bold text-lg text-white">@{(leg.odds || 0).toFixed(2)}</span>
            </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center justify-end gap-2">
            <button onClick={onFeedback} title="Enviar feedback a la IA" className="p-1 hover:bg-blue-500/20 rounded transition-colors"><RefreshIcon className="w-4 h-4 text-blue-400"/></button>
            <button onClick={onRemove} title="Eliminar" className="p-1 hover:bg-red-500/20 rounded transition-colors"><TrashIcon className="w-4 h-4 text-red-500"/></button>
        </div>
    </div>
);

const FeedbackModal: React.FC<{
    leg: AIRecommendedParlayLeg;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
    isSubmitting: boolean;
}> = ({ leg, onClose, onSubmit, isSubmitting }) => {
    const [feedback, setFeedback] = useState('');
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={onClose}>
            <div className="bg-brand-secondary rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-brand-accent">Enviar Feedback/Corrección</h3>
                    <p className="text-sm text-brand-text-secondary truncate">{leg.outcomeName} en {leg.teamA} vs {leg.teamB}</p>
                </header>
                <div className="p-6 space-y-3">
                    <label htmlFor="feedback-text" className="text-sm font-medium text-brand-text">Tu comentario:</label>
                    <textarea
                        id="feedback-text"
                        rows={4}
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Ej: 'La cuota ha cambiado a 1.95' o 'Creo que el equipo visitante tiene más posibilidades por la lesión...'"
                        className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                </div>
                <footer className="p-3 bg-gray-900/50 flex justify-end gap-2">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">Cancelar</button>
                    <button
                        onClick={() => onSubmit(feedback)}
                        disabled={isSubmitting || !feedback.trim()}
                        className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? <LoadingSpinner /> : 'Enviar a la IA'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

interface ParlayLabDashboardProps {
    onBack: () => void;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
}

interface ParlaySettings {
    sport: Sport;
    targetOdds: number;
    dateRange: { startDate: string; endDate: string; };
    aggressiveness: ParlayAggressiveness;
}

export const ParlayLabDashboard: React.FC<ParlayLabDashboardProps> = ({ onBack, onAddParlayToSlip }) => {
    const [step, setStep] = useState<'setup' | 'research' | 'builder'>('setup');
    const [settings, setSettings] = useState<ParlaySettings | null>(null);
    const [researchData, setResearchData] = useState<{ topRecommendations: AIRecommendedParlayLeg[], fullFixtureList: Fixture[] } | null>(null);
    const [builtLegs, setBuiltLegs] = useState<AIRecommendedParlayLeg[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFixtureForModal, setSelectedFixtureForModal] = useState<Fixture | null>(null);
    const [selectedLegForAnalysis, setSelectedLegForAnalysis] = useState<AIRecommendedParlayLeg | null>(null);
    const [legForFeedback, setLegForFeedback] = useState<{ leg: AIRecommendedParlayLeg, index: number } | null>(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const handleStartResearch = async (newSettings: ParlaySettings) => {
        setSettings(newSettings);
        setStep('research');
        setIsLoading(true);
        setError(null);
        try {
            const data = await getParlayResearchData(newSettings.sport, newSettings.dateRange, newSettings.targetOdds, newSettings.aggressiveness);
            setResearchData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch research data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddLeg = (leg: AIRecommendedParlayLeg) => {
        if (!builtLegs.some(l => l.outcomeName === leg.outcomeName && l.teamA === leg.teamA)) {
             setBuiltLegs(prev => [...prev, leg]);
        }
        setStep('builder');
        setSelectedLegForAnalysis(leg);
    };

    const handleAddLegFromModal = async (item: BetSlipItem) => {
        if (!selectedFixtureForModal) return;
        setIsLoading(true);
        try {
            const prediction = await getPredictionForFixture(selectedFixtureForModal);
            const allBets = [prediction.mainPrediction, ...(prediction.safestBets || []), ...(prediction.valueBets || []), ...(prediction.highRiskBets || [])];
            const fullBetData = allBets.find(b => b.outcomeName === item.outcomeName);
            if (fullBetData) {
                handleAddLeg({ ...fullBetData, sport: selectedFixtureForModal.sport, teamA: selectedFixtureForModal.teamA, teamB: selectedFixtureForModal.teamB, league: selectedFixtureForModal.league, matchDateTime: selectedFixtureForModal.matchDateTime });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setSelectedFixtureForModal(null);
        }
    };

    // Added handleRemoveLeg function
    const handleRemoveLeg = (index: number) => {
        const legToRemove = builtLegs[index];
        setBuiltLegs(prev => prev.filter((_, i) => i !== index));
        if (selectedLegForAnalysis === legToRemove) {
            setSelectedLegForAnalysis(null);
        }
    };

    const handleFeedbackSubmit = async (feedback: string) => {
        if (!legForFeedback) return;
        setIsSubmittingFeedback(true);
        try {
            const updatedLeg = await getFeedbackResponseForLeg(legForFeedback.leg, feedback);
            const newLegs = [...builtLegs];
            newLegs[legForFeedback.index] = updatedLeg;
            setBuiltLegs(newLegs);
            setSelectedLegForAnalysis(updatedLeg);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmittingFeedback(false);
            setLegForFeedback(null);
        }
    };

    const totalOdds = useMemo(() => builtLegs.reduce((acc, leg) => acc * (leg.odds || 1), 1), [builtLegs]);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <TestTubeIcon className="w-8 h-8 text-brand-accent"/>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Parlay Lab</h2>
                        <p className="text-brand-text-secondary text-xs font-mono uppercase tracking-widest">Advanced Betting Research Center</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-6 rounded-lg border border-gray-700 transition-all">
                    &larr; Volver
                </button>
            </div>

            {step === 'setup' && <SetupView onStartResearch={handleStartResearch} />}
            
            {step === 'research' && (
                <div className="animate-fade-in space-y-8">
                    <div className="flex justify-between items-center bg-brand-secondary p-4 rounded-xl border border-gray-800">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                             <SearchIcon className="w-4 h-4 text-brand-accent" /> Mesa de Investigación: {settings?.sport}
                        </h3>
                        <button onClick={() => setStep('builder')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg text-xs uppercase transition-all shadow-lg">
                            Ver Constructor ({builtLegs.length})
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-brand-secondary/30 rounded-2xl border border-dashed border-gray-800">
                            <LoadingSpinner />
                            <p className="mt-4 text-brand-accent font-mono text-xs animate-pulse tracking-[0.2em]">CONSULTANDO VECTORES ESTRATÉGICOS...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/10 border border-red-500/30 p-8 rounded-xl text-center">
                            <WarningIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-400 font-bold">{error}</p>
                            <button onClick={() => setStep('setup')} className="mt-4 text-xs text-gray-500 underline">Reiniciar Configuración</button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <section>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <BrainCircuitIcon className="text-brand-accent" /> Selecciones de Élite Recomendadas
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(researchData?.topRecommendations || []).map((leg, i) => (
                                        <BetCard key={i} bet={leg} onToggleBet={() => handleAddLeg(leg)} betSlip={[]} />
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Todos los Partidos en el Rango</h4>
                                <div className="bg-brand-secondary rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-900/50 text-[10px] text-gray-500 uppercase tracking-widest font-black">
                                            <tr>
                                                <th className="px-6 py-4">Fecha</th>
                                                <th className="px-6 py-4">Evento</th>
                                                <th className="px-6 py-4">Liga</th>
                                                <th className="px-6 py-4 text-right">Análisis</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {(researchData?.fullFixtureList || []).map((f, i) => (
                                                <FixtureListItem key={i} fixture={f} onSelect={setSelectedFixtureForModal} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            )}

            {step === 'builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-brand-secondary rounded-2xl border border-gray-800 p-6 shadow-2xl">
                             <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6">Constructor de Combinada</h3>
                             <div className="bg-gray-900/80 rounded-xl p-4 border border-gray-800 mb-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 uppercase">Picks</span>
                                    <span className="text-xl font-bold text-white">{builtLegs.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 uppercase">Cuota Total</span>
                                    <span className="text-3xl font-black text-brand-accent font-mono">@{totalOdds.toFixed(2)}</span>
                                </div>
                             </div>

                             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {builtLegs.map((leg, i) => (
                                    <LegCard 
                                        key={i} 
                                        leg={leg} 
                                        isSelected={selectedLegForAnalysis === leg} 
                                        onSelect={() => setSelectedLegForAnalysis(leg)} 
                                        onRemove={() => handleRemoveLeg(i)} 
                                        onFeedback={() => setLegForFeedback({ leg, index: i })}
                                    />
                                ))}
                                {builtLegs.length === 0 && <p className="text-center py-10 text-gray-600 text-xs italic">Añade selecciones desde la mesa de investigación.</p>}
                             </div>

                             <div className="mt-8 space-y-3">
                                <button 
                                    onClick={() => onAddParlayToSlip(builtLegs)} 
                                    disabled={builtLegs.length === 0}
                                    className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                >
                                    <LayersIcon className="w-5 h-5" /> INYECTAR AL BOLETO
                                </button>
                                <button onClick={() => setStep('research')} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-lg text-xs uppercase transition-all">
                                    Volver a Investigación
                                </button>
                             </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-brand-secondary rounded-2xl border border-gray-800 p-8 shadow-2xl h-full min-h-[500px]">
                             <h3 className="text-white font-black text-xs uppercase tracking-widest mb-8 border-b border-gray-800 pb-4">Análisis Forense de Selección</h3>
                             <div className="animate-fade-in">
                                {selectedLegForAnalysis ? (
                                    <>
                                        <div className="flex justify-between items-center mb-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                                            <div>
                                                <p className="text-brand-accent font-black text-2xl uppercase tracking-tighter">{selectedLegForAnalysis.outcomeName}</p>
                                                <p className="text-xs text-gray-500 font-bold uppercase mt-1">{selectedLegForAnalysis.teamA} vs {selectedLegForAnalysis.teamB}</p>
                                            </div>
                                            <div className="text-right">
                                                <FiabilityGauge score={selectedLegForAnalysis.fiabilityScore} size="large" />
                                                <p className="text-[9px] text-gray-600 font-black mt-2 uppercase tracking-widest">Nexus Trust Score</p>
                                            </div>
                                        </div>
                                        <StructuredAnalysisDisplay analysis={selectedLegForAnalysis.justification} />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-center opacity-30">
                                        <BrainCircuitIcon className="w-16 h-16 text-gray-600 mb-4" />
                                        <p className="text-gray-500 uppercase font-black text-xs tracking-widest">Awaiting selection for deep dive</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {selectedFixtureForModal && (
                 <MatchDetailModal
                    fixture={selectedFixtureForModal}
                    onClose={() => setSelectedFixtureForModal(null)}
                    onToggleBet={handleAddLegFromModal}
                    betSlip={[]}
                    onPredictionLoaded={() => {}}
                />
            )}

            {legForFeedback && (
                <FeedbackModal 
                    leg={legForFeedback.leg}
                    onClose={() => setLegForFeedback(null)}
                    onSubmit={handleFeedbackSubmit}
                    isSubmitting={isSubmittingFeedback}
                />
            )}
        </div>
    );
};

// --- COMPONENTE INTERNO SETUP ---

const SetupView: React.FC<{onStartResearch: (settings: ParlaySettings) => void}> = ({ onStartResearch }) => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [sport, setSport] = useState<Sport>(SportEnum.Football);
    const [targetOddsStr, setTargetOddsStr] = useState('10.0');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(nextWeek.toISOString().split('T')[0]);
    const [aggressiveness, setAggressiveness] = useState<ParlayAggressiveness>('Safe');

    return (
        <div className="max-w-4xl mx-auto bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-white text-center uppercase tracking-tighter mb-8">Protocolo de Investigación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Activo de Mercado</label>
                        <select value={sport} onChange={e => setSport(e.target.value as Sport)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white font-bold outline-none focus:border-brand-accent">
                            {Object.values(SportEnum).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Apalancamiento de Riesgo</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(['Safe', 'Balanced', 'Aggressive'] as ParlayAggressiveness[]).map(agg => (
                                <button key={agg} onClick={() => setAggressiveness(agg)} className={`p-4 rounded-xl border-2 text-left transition-all ${aggressiveness === agg ? 'border-brand-accent bg-brand-accent/5 text-white' : 'border-gray-800 bg-gray-900/50 text-gray-500'}`}>
                                    <span className="font-black text-xs uppercase tracking-widest">{agg}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Métrica de Cuota Objetivo</label>
                        <input type="number" value={targetOddsStr} onChange={e => setTargetOddsStr(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-3xl font-black font-mono text-center outline-none focus:border-brand-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Start Window</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">End Window</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white outline-none" />
                        </div>
                    </div>
                 </div>
            </div>

            <button 
                onClick={() => onStartResearch({ sport, targetOdds: parseFloat(targetOddsStr), dateRange: { startDate, endDate }, aggressiveness })}
                className="w-full mt-10 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-5 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-95 shadow-[0_0_30px_rgba(0,245,160,0.2)] uppercase tracking-widest"
            >
                Iniciar Intercepción de Datos
            </button>
        </div>
    );
};
