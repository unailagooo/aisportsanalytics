
import React, { useState, useEffect, useMemo } from 'react';
import type { Challenge, ChallengeConfig, ChallengeStep, ChallengeStrategy, ChallengeWithdrawalProtocol, QuantumVectorAnalysis, ChallengeExecutionMode } from '../types';
import { getChallengePick, auditChallengeCustomPick, getPlannedChallengeRoadmap } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { RocketIcon, FlameIcon, DollarSignIcon, WarningIcon, RefreshIcon, TargetIcon, BrainCircuitIcon, LayersIcon, ShieldCheckIcon, ActivityIcon, EditIcon, RefreshIcon as RerollIcon, ChartLineIcon, ClipboardListIcon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';

interface ChallengeDashboardProps {
    onBack: () => void;
}

export const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({ onBack }) => {
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    useEffect(() => {
        const saved = localStorage.getItem('nexus_pro_active_challenge');
        if (saved) {
            try { setActiveChallenge(JSON.parse(saved)); } catch (e) { console.error("Error cargando reto."); }
        }
    }, []);

    useEffect(() => {
        if (activeChallenge) {
            localStorage.setItem('nexus_pro_active_challenge', JSON.stringify(activeChallenge));
        } else {
            localStorage.removeItem('nexus_pro_active_challenge');
        }
    }, [activeChallenge]);

    const handleCreateChallenge = (challenge: Challenge) => {
        setActiveChallenge(challenge);
    };

    const handleExport = () => {
        if (!activeChallenge) return;
        setIsExporting(true);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeChallenge));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `nexus_challenge_${activeChallenge.config.name}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        setTimeout(() => setIsExporting(false), 1000);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target?.result as string);
                    setActiveChallenge(imported);
                } catch (e) {
                    alert("Archivo JSON inválido.");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleReset = () => {
        if (window.confirm("¿Seguro que quieres eliminar el reto actual? Esta acción borrará todo el progreso local.")) {
            localStorage.removeItem('nexus_pro_active_challenge');
            setActiveChallenge(null);
        }
    };

    if (!activeChallenge) {
        return <ChallengeWizard onCancel={onBack} onComplete={handleCreateChallenge} />;
    }

    return (
        <div className="animate-fade-in pb-20 pt-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-xl border border-brand-accent/30 shadow-[0_0_15px_rgba(0,245,160,0.1)]">
                        <FlameIcon className="w-8 h-8 text-brand-accent animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">NEXUS COCKPIT</h2>
                        <p className="text-[10px] text-brand-accent font-mono tracking-[0.3em] uppercase">Unidad de Gestión de Capital</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <label className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-[10px] uppercase cursor-pointer transition-all flex items-center gap-2">
                        <RefreshIcon className="w-3 h-3" /> Cargar
                        <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </label>
                    <button onClick={handleExport} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-[10px] uppercase transition-all flex items-center gap-2">
                         {isExporting ? 'Exportando...' : <><RefreshIcon className="w-3 h-3" /> Backup</>}
                    </button>
                    <button onClick={handleReset} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white font-bold py-2 px-4 rounded-lg text-[10px] uppercase border border-red-500/30 transition-all">Limpiar</button>
                    <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg text-[10px] uppercase border border-gray-700 transition-all">Salir</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ChallengeLadder challenge={activeChallenge} />
                    {activeChallenge.config.executionMode === 'MasterPlan' ? (
                        <MasterPlanView challenge={activeChallenge} setChallenge={setActiveChallenge} />
                    ) : (
                        <ChallengeStepGenerator challenge={activeChallenge} setChallenge={setActiveChallenge} />
                    )}
                    <ChallengeTimeline challenge={activeChallenge} />
                </div>
                <div className="space-y-6">
                    <ChallengeStatsSidebar challenge={activeChallenge} />
                    <ChallengeStrategyControl challenge={activeChallenge} setChallenge={setActiveChallenge} />
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE: MASTER PLAN VIEW ---

const MasterPlanView: React.FC<{ challenge: Challenge, setChallenge: any }> = ({ challenge, setChallenge }) => {
    const [isRefreshingIdx, setIsRefreshingIdx] = useState<number | null>(null);
    const [selectedStepForAnalysis, setSelectedStepForAnalysis] = useState<ChallengeStep | null>(null);

    const handleResolve = (stepId: string, result: 'win' | 'loss' | 'void') => {
        const updatedSteps = challenge.steps.map(s => s.id === stepId ? { ...s, status: result } : s);
        const resolvedStep = updatedSteps.find(s => s.id === stepId)!;
        
        let newCapital = challenge.currentCapital;
        if (result === 'win') {
            const profit = resolvedStep.stake * (resolvedStep.odds - 1);
            newCapital += profit;
        } else if (result === 'loss') {
            newCapital = 0;
        }

        // Recalcular stakes de pasos futuros (Compounding)
        const nextCapitalForFuture = newCapital;
        const fullyUpdatedSteps = updatedSteps.map((s, idx) => {
            if (s.status === 'upcoming' || s.status === 'pending') {
                // Simplistic compounding: if MasterPlan, each step uses full bankroll of that moment
                // This is a placeholder for more complex logic
                return s; 
            }
            return s;
        });

        setChallenge({
            ...challenge,
            currentCapital: newCapital,
            steps: fullyUpdatedSteps,
            mode: newCapital <= 0 ? 'Failed' : (newCapital >= challenge.config.targetGoal ? 'Completed' : 'Active')
        });
    };

    const handleRerollStep = async (idx: number) => {
        setIsRefreshingIdx(idx);
        try {
            const newPick = await getChallengePick(challenge.config, challenge.currentCapital);
            const newSteps = [...challenge.steps];
            newSteps[idx] = { ...newPick, order: idx + 1, status: 'upcoming' };
            setChallenge({ ...challenge, steps: newSteps });
        } catch (e) {
            alert("Error relanzando paso.");
        } finally {
            setIsRefreshingIdx(null);
        }
    };

    const handleActivateStep = (stepId: string) => {
        const newSteps = challenge.steps.map(s => s.id === stepId ? { ...s, status: 'pending' as const } : s);
        setChallenge({ ...challenge, steps: newSteps });
    };

    return (
        <div className="space-y-6">
            <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-2xl">
                <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                    <ClipboardListIcon className="w-5 h-5 text-brand-accent" /> Hoja de Ruta: Plan Maestro Nexus
                </h4>
                
                <div className="space-y-6 relative">
                    <div className="absolute left-[24px] top-6 bottom-6 w-1 bg-gradient-to-b from-brand-accent via-gray-800 to-transparent"></div>
                    
                    {challenge.steps.map((step, idx) => {
                        const isNext = step.status === 'upcoming' && (idx === 0 || challenge.steps[idx-1].status === 'win');
                        const isActive = step.status === 'pending';
                        const isResolved = ['win', 'loss', 'void'].includes(step.status);

                        return (
                            <div key={step.id} className={`relative pl-16 animate-fade-in`} style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className={`absolute left-0 top-0 w-12 h-12 rounded-full border-4 border-gray-900 flex items-center justify-center font-black text-sm z-10 transition-all ${
                                    step.status === 'win' ? 'bg-green-500 text-white' : 
                                    step.status === 'loss' ? 'bg-red-500 text-white' :
                                    isActive ? 'bg-brand-accent text-brand-primary animate-pulse' :
                                    isNext ? 'bg-gray-800 text-brand-accent border-brand-accent' :
                                    'bg-gray-900 text-gray-700'
                                }`}>
                                    {step.order}
                                </div>
                                
                                <div className={`p-6 rounded-2xl border transition-all ${
                                    isActive ? 'bg-gray-900 border-brand-accent shadow-[0_0_20px_rgba(0,245,160,0.1)]' : 
                                    isNext ? 'bg-gray-900 border-gray-700 hover:border-gray-500' :
                                    isResolved ? 'bg-black/20 border-gray-800 opacity-60' :
                                    'bg-black/10 border-transparent opacity-30'
                                }`}>
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{step.matchIdentifier || 'Cargando...'}</p>
                                            <h5 className="text-xl font-black text-white uppercase truncate">{step.outcomeName}</h5>
                                            <p className="text-xs text-gray-400 font-bold">{step.marketName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-2xl font-black text-brand-accent">@{step.odds.toFixed(2)}</p>
                                            <p className="text-[8px] text-gray-500 uppercase font-black">Cuota Nexus</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-800/50">
                                        <div className="flex gap-4 items-center">
                                            <div className="text-center">
                                                <p className="text-[8px] text-gray-600 uppercase font-black">Fiabilidad</p>
                                                <p className="text-xs font-bold text-white">{step.reliabilityScore}%</p>
                                            </div>
                                            <div className="w-px h-6 bg-gray-800"></div>
                                            <div className="text-center">
                                                <p className="text-[8px] text-gray-600 uppercase font-black">Capital Tras Win</p>
                                                <p className="text-xs font-bold text-brand-accent">{(step.stake * step.odds).toFixed(2)}€</p>
                                            </div>
                                        </div>

                                        <div className="ml-auto flex gap-2">
                                            {isNext && (
                                                <button onClick={() => handleActivateStep(step.id)} className="bg-brand-accent text-brand-primary font-black py-2 px-6 rounded-lg text-[10px] uppercase shadow-lg">Activar Operación</button>
                                            )}
                                            {isActive && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleResolve(step.id, 'win')} className="bg-green-600 text-white font-black py-2 px-4 rounded-lg text-[10px] uppercase">G</button>
                                                    <button onClick={() => handleResolve(step.id, 'loss')} className="bg-red-600 text-white font-black py-2 px-4 rounded-lg text-[10px] uppercase">P</button>
                                                    <button onClick={() => handleResolve(step.id, 'void')} className="bg-gray-700 text-white font-black py-2 px-4 rounded-lg text-[10px] uppercase">N</button>
                                                </div>
                                            )}
                                            {!isResolved && (
                                                <button onClick={() => handleRerollStep(idx)} disabled={isRefreshingIdx === idx} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                                    <RerollIcon className={`w-4 h-4 text-gray-500 ${isRefreshingIdx === idx ? 'animate-spin' : ''}`} />
                                                </button>
                                            )}
                                            <button onClick={() => setSelectedStepForAnalysis(step)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                                <BrainCircuitIcon className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedStepForAnalysis && (
                <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                            <BrainCircuitIcon className="text-brand-accent" /> Análisis Forense: Paso #{selectedStepForAnalysis.order}
                        </h4>
                        <button onClick={() => setSelectedStepForAnalysis(null)} className="text-gray-500 hover:text-white">&times; Cerrar Análisis</button>
                    </div>
                    {selectedStepForAnalysis.analysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnalysisCard title="Cuantitativo" content={selectedStepForAnalysis.analysis.vectorCuantitativo} color="text-blue-400" />
                            <AnalysisCard title="Momentum" content={selectedStepForAnalysis.analysis.vectorMomentum} color="text-purple-400" />
                            <AnalysisCard title="Veredicto" content={selectedStepForAnalysis.analysis.veredictoCuantico} color="text-brand-accent" />
                            <AnalysisCard title="Estrés" content={selectedStepForAnalysis.analysis.simulacionEstres} color="text-red-400" />
                        </div>
                    ) : (
                        <p className="text-center py-8 text-gray-500 italic">Análisis no disponible para este paso.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- COMPONENTE: LADDER DE PROGRESO ---

const ChallengeLadder: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    const progress = (challenge.currentCapital / challenge.config.targetGoal) * 100;
    
    return (
        <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <TargetIcon className="w-40 h-40 text-brand-accent" />
            </div>
            
            <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                    <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Estado de Escalada</h4>
                    <p className="text-3xl font-black text-white italic">{challenge.config.name}</p>
                    <div className="flex gap-3 mt-1">
                         <span className="text-[8px] bg-brand-accent/20 text-brand-accent font-black uppercase px-2 py-0.5 rounded border border-brand-accent/20">{challenge.config.executionMode === 'MasterPlan' ? 'PLAN MAESTRO' : 'MODO MANUAL'}</span>
                         {challenge.config.targetDate && (
                             <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Fecha Meta: {new Date(challenge.config.targetDate).toLocaleDateString()}</p>
                         )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-brand-accent font-black">{Math.min(progress, 100).toFixed(1)}% COMPLETADO</p>
                </div>
            </div>

            <div className="relative h-4 bg-gray-900 rounded-full border border-gray-800 mb-8 overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-accent to-brand-accent-dark transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="bg-black/30 p-4 rounded-2xl border border-gray-800">
                    <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Capital Semilla</p>
                    <p className="text-lg font-black text-white">{challenge.config.seedCapital.toFixed(2)}€</p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-gray-800">
                    <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Inversión Actual</p>
                    <p className="text-lg font-black text-brand-accent">{challenge.currentCapital.toFixed(2)}€</p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-gray-800">
                    <p className="text-[8px] text-gray-500 uppercase font-black mb-1">ROI Global</p>
                    <p className="text-lg font-black text-green-400">+{((challenge.currentCapital / challenge.config.seedCapital - 1) * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-gray-800">
                    <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Meta Final</p>
                    <p className="text-lg font-black text-orange-500">{challenge.config.targetGoal.toFixed(2)}€</p>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE: GENERADOR DE PASOS (MANUAL) ---

const ChallengeStepGenerator: React.FC<{ challenge: Challenge, setChallenge: any }> = ({ challenge, setChallenge }) => {
    const [isThinking, setIsThinking] = useState(false);
    const [currentProposal, setCurrentProposal] = useState<ChallengeStep | null>(null);
    const [customInput, setCustomInput] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    const [isEditingOdds, setIsEditingOdds] = useState(false);
    const [tempOdds, setTempOdds] = useState('');
    const [showAnalysis, setShowAnalysis] = useState(false);

    const pendingStep = challenge.steps.find(s => s.status === 'pending');

    const handleGeneratePick = async () => {
        setIsThinking(true);
        setCurrentProposal(null);
        setShowAnalysis(false);
        try {
            const nextStep = await getChallengePick(challenge.config, challenge.currentCapital);
            setCurrentProposal({ ...nextStep, order: challenge.steps.length + 1 });
        } catch (e) {
            alert("Error del motor Nexus-9. Reintenta.");
        } finally {
            setIsThinking(false);
        }
    };

    const handleAcceptProposal = () => {
        if (!currentProposal) return;
        const newSteps = [...challenge.steps, { ...currentProposal, status: 'pending' as const }];
        setChallenge({ ...challenge, steps: newSteps });
        setCurrentProposal(null);
    };

    const handleAuditCustom = async () => {
        if (!customInput.trim()) return;
        setIsAuditing(true);
        try {
            const audited = await auditChallengeCustomPick(customInput, challenge.config);
            setCurrentProposal({ ...audited, stake: challenge.currentCapital, order: challenge.steps.length + 1 });
            setCustomInput('');
            setShowAnalysis(true);
        } catch (e) {
            alert("Error auditando pick.");
        } finally {
            setIsAuditing(false);
        }
    };

    const resolveStep = (result: 'win' | 'loss' | 'void') => {
        if (!pendingStep) return;
        
        let newCapital = challenge.currentCapital;
        let newWithdrawn = challenge.totalWithdrawn;
        const updatedSteps = [...challenge.steps];
        const stepIdx = updatedSteps.findIndex(s => s.id === pendingStep.id);
        
        updatedSteps[stepIdx] = { ...pendingStep, status: result };

        if (result === 'win') {
            const profit = pendingStep.stake * (pendingStep.odds - 1);
            newCapital += profit;

            if (challenge.config.withdrawalProtocol === 'SaveInitialStake' && newWithdrawn === 0 && newCapital >= challenge.config.seedCapital * 2) {
                newWithdrawn = challenge.config.seedCapital;
                newCapital -= challenge.config.seedCapital;
            }
        } else if (result === 'loss') {
            newCapital = 0;
        }

        setChallenge({
            ...challenge,
            currentCapital: newCapital,
            totalWithdrawn: newWithdrawn,
            steps: updatedSteps,
            mode: newCapital <= 0 ? 'Failed' : (newCapital >= challenge.config.targetGoal ? 'Completed' : 'Active')
        });
    };

    const applyOddsChange = () => {
        if (!currentProposal) return;
        const o = parseFloat(tempOdds);
        if (!isNaN(o) && o > 1) {
            setCurrentProposal({ ...currentProposal, odds: o });
            setIsEditingOdds(false);
        }
    };

    if (challenge.mode === 'Failed') {
        return (
            <div className="bg-red-900/10 border-2 border-red-500/30 p-10 rounded-3xl text-center">
                <WarningIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white uppercase mb-2">UNIDAD LIQUIDADA</h3>
                <p className="text-gray-400 mb-6">Fallo sistémico. Capital perdido. Protegido: {challenge.totalWithdrawn.toFixed(2)}€.</p>
                <button onClick={() => setChallenge(null)} className="bg-red-600 text-white font-black py-3 px-8 rounded-xl uppercase text-xs">Reiniciar Terminal</button>
            </div>
        );
    }

    if (challenge.mode === 'Completed') {
        return (
            <div className="bg-brand-accent/10 border-2 border-brand-accent/30 p-10 rounded-3xl text-center">
                <ShieldCheckIcon className="w-16 h-16 text-brand-accent mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white uppercase mb-2">MISIÓN COMPLETADA</h3>
                <p className="text-gray-400 mb-6">Capital total consolidado: {challenge.currentCapital.toFixed(2)}€.</p>
                <button onClick={() => setChallenge(null)} className="bg-brand-accent text-brand-primary font-black py-3 px-8 rounded-xl uppercase text-xs">Iniciar Nueva Escalada</button>
            </div>
        );
    }

    return (
        <div className="bg-brand-secondary rounded-3xl border border-gray-800 p-8 shadow-2xl relative">
            {!pendingStep && !currentProposal && (
                <div className="py-10 text-center animate-fade-in">
                    <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-10">Fase de Generación de Pick Individual</h4>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <button 
                            onClick={handleGeneratePick}
                            disabled={isThinking}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-5 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,245,160,0.3)] min-w-[280px]"
                        >
                            {isThinking ? <LoadingSpinner /> : <><BrainCircuitIcon className="w-6 h-6"/> PROPUESTA NEXUS-9</>}
                        </button>
                        <div className="flex-grow flex gap-2 max-w-md mx-auto md:mx-0">
                            <input 
                                value={customInput}
                                onChange={e => setCustomInput(e.target.value)}
                                placeholder="Pick Manual (Ej: Goleada @1.60)..."
                                className="flex-grow bg-black/40 border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-brand-accent outline-none"
                            />
                            <button 
                                onClick={handleAuditCustom}
                                disabled={isAuditing || !customInput.trim()}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 rounded-xl text-[10px] uppercase"
                            >
                                {isAuditing ? <LoadingSpinner /> : 'AUDITAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentProposal && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] text-orange-400 font-black uppercase tracking-[0.3em]">Propuesta de Seguridad Paso #{currentProposal.order}</span>
                        <button onClick={() => setCurrentProposal(null)} className="text-gray-500 hover:text-white text-xs font-bold">&times; DESCARTAR</button>
                    </div>
                    
                    <div className="bg-black/40 border-2 border-brand-accent/30 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                        <div className="flex-grow">
                             <div className="flex items-center gap-2 mb-2">
                                 <span className="bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded text-[8px] font-black uppercase">{currentProposal.sport}</span>
                                 <span className="text-[9px] text-gray-500 font-bold uppercase truncate">{currentProposal.matchIdentifier}</span>
                             </div>
                             <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{currentProposal.outcomeName}</h3>
                             <p className="text-sm text-gray-400 font-bold mt-1 uppercase">{currentProposal.marketName}</p>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="text-center">
                                <p className="text-[9px] text-gray-600 font-black uppercase mb-1">Cuota</p>
                                {isEditingOdds ? (
                                    <div className="flex gap-1 items-center">
                                        <input autoFocus value={tempOdds} onChange={e => setTempOdds(e.target.value)} className="w-16 bg-gray-800 border border-brand-accent p-1 text-center font-black text-white" />
                                        <button onClick={applyOddsChange} className="bg-brand-accent text-brand-primary p-1 rounded text-[10px] font-black">OK</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-4xl font-black text-white font-mono">@{currentProposal.odds.toFixed(2)}</span>
                                        <button onClick={() => { setTempOdds(currentProposal.odds.toString()); setIsEditingOdds(true); }} className="p-1 hover:bg-gray-800 rounded opacity-30 hover:opacity-100"><EditIcon className="w-3 h-3 text-gray-400"/></button>
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-gray-600 font-black uppercase mb-1">Supervivencia</p>
                                <span className="text-2xl font-black text-brand-accent">{currentProposal.reliabilityScore}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-800 pt-6">
                        <button onClick={() => setShowAnalysis(!showAnalysis)} className="text-[10px] text-brand-accent font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                            {showAnalysis ? '▲ Ocultar Análisis Forense' : '▼ Ver Análisis Forense de la IA'}
                        </button>
                        {showAnalysis && currentProposal.analysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                <AnalysisCard title="Cuantitativo" content={currentProposal.analysis.vectorCuantitativo} color="text-blue-400" />
                                <AnalysisCard title="Momentum" content={currentProposal.analysis.vectorMomentum} color="text-purple-400" />
                                <AnalysisCard title="Veredicto" content={currentProposal.analysis.veredictoCuantico} color="text-brand-accent" />
                                <AnalysisCard title="Estrés" content={currentProposal.analysis.simulacionEstres} color="text-red-400" />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row gap-4">
                         <button onClick={handleGeneratePick} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2"><RerollIcon className="w-3 h-3"/> REROLL</button>
                         <button onClick={handleAcceptProposal} className="flex-[2] bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-4 rounded-xl text-xs uppercase shadow-xl transform active:scale-95">ACEPTAR Y REGISTRAR</button>
                    </div>
                </div>
            )}

            {pendingStep && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                         <h4 className="text-brand-accent font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                             <RocketIcon className="w-6 h-6 animate-bounce" /> Operación en Curso: Paso #{pendingStep.order}
                         </h4>
                    </div>
                    
                    <div className="bg-gray-900 border-2 border-brand-accent/20 p-10 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 shadow-inner">
                        <div className="flex-grow">
                             <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{pendingStep.matchIdentifier}</p>
                             <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{pendingStep.outcomeName}</h3>
                             <div className="flex gap-6 mt-4">
                                 <div className="text-center">
                                     <p className="text-[9px] text-gray-600 uppercase font-black">Inversión</p>
                                     <p className="text-xl font-black text-white font-mono">{pendingStep.stake.toFixed(2)}€</p>
                                 </div>
                                 <div className="text-center">
                                     <p className="text-[9px] text-gray-600 uppercase font-black">Beneficio Est.</p>
                                     <p className="text-xl font-black text-brand-accent font-mono">+{(pendingStep.stake * (pendingStep.odds - 1)).toFixed(2)}€</p>
                                 </div>
                             </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 justify-center">
                             <button onClick={() => resolveStep('win')} className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl flex flex-col items-center min-w-[120px]">
                                 <span className="text-sm">GANADA</span>
                                 <span className="text-[8px] opacity-70 mt-1 uppercase">Éxito confirmado</span>
                             </button>
                             <button onClick={() => resolveStep('loss')} className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl flex flex-col items-center min-w-[120px]">
                                 <span className="text-sm">PERDIDA</span>
                                 <span className="text-[8px] opacity-70 mt-1 uppercase">Liquidar Paso</span>
                             </button>
                             <button onClick={() => resolveStep('void')} className="bg-gray-700 hover:bg-gray-600 text-white font-black px-6 py-5 rounded-2xl flex flex-col items-center">
                                 <span className="text-sm">NULA</span>
                                 <span className="text-[8px] opacity-70 mt-1 uppercase">Anulación</span>
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalysisCard: React.FC<{title: string, content: string, color: string}> = ({title, content, color}) => (
    <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
        <h5 className={`text-[9px] font-black uppercase ${color} mb-1 tracking-widest`}>{title}</h5>
        <p className="text-[11px] text-gray-400 leading-relaxed italic">"{content}"</p>
    </div>
);

// --- COMPONENTE: HISTORIAL / TIMELINE ---

const ChallengeTimeline: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    return (
        <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-xl">
             <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                 <LayersIcon className="w-5 h-5 text-gray-500" /> Log de Operaciones Estratégicas
             </h4>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {[...challenge.steps].reverse().map((step) => (
                    <div key={step.id} className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${
                                step.status === 'win' ? 'border-brand-accent text-brand-accent' :
                                step.status === 'loss' ? 'border-red-500 text-red-500' :
                                step.status === 'pending' ? 'border-brand-accent text-brand-accent bg-brand-accent/20 animate-pulse' :
                                'border-gray-500 text-gray-500'
                            }`}>
                                {step.order}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm uppercase">{step.outcomeName} <span className="font-mono text-gray-500 text-[10px]">@{step.odds.toFixed(2)}</span></p>
                                <p className="text-[9px] text-gray-600 font-bold uppercase">{step.matchIdentifier}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className={`font-black font-mono text-sm ${step.status === 'win' ? 'text-green-400' : step.status === 'loss' ? 'text-red-400' : 'text-gray-500'}`}>
                                 {step.status === 'win' ? `+${(step.stake * (step.odds - 1)).toFixed(2)}€` : 
                                  step.status === 'loss' ? `-${step.stake.toFixed(2)}€` : 
                                  step.status === 'upcoming' ? 'PLANIFICADO' : '...'}
                             </p>
                             <p className="text-[8px] text-gray-700 uppercase font-black">{new Date(step.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                {challenge.steps.length === 0 && <p className="text-center py-10 text-gray-600 text-xs italic">Inicia el despliegue para registrar operaciones.</p>}
             </div>
        </div>
    );
};

// --- COMPONENTE: SIDEBAR DE ESTADÍSTICAS ---

const ChallengeStatsSidebar: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    const totalProfit = challenge.currentCapital + challenge.totalWithdrawn - challenge.config.seedCapital;

    return (
        <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-xl">
             <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8 text-center">Telemetría Financiera</h4>
             <div className="space-y-8">
                 <div className="text-center">
                     <p className="text-[10px] text-gray-500 font-black uppercase mb-2">ROI Neto Operativo</p>
                     <p className={`text-4xl font-black ${totalProfit >= 0 ? 'text-brand-accent' : 'text-red-400'}`}>
                         {totalProfit >= 0 ? '+' : ''}{((totalProfit / challenge.config.seedCapital) * 100).toFixed(1)}%
                     </p>
                 </div>

                 <div className="border-t border-gray-800 pt-8 space-y-4">
                     <div className="flex justify-between items-center">
                         <span className="text-[10px] text-gray-500 uppercase font-black">Capital Actual</span>
                         <span className="font-mono font-black text-white">{challenge.currentCapital.toFixed(2)}€</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-[10px] text-gray-500 uppercase font-black">Beneficio Protegido</span>
                         <span className="font-mono font-black text-brand-accent">{challenge.totalWithdrawn.toFixed(2)}€</span>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const ChallengeStrategyControl: React.FC<{ challenge: Challenge, setChallenge: any }> = ({ challenge, setChallenge }) => {
    return (
        <div className="bg-brand-secondary p-8 rounded-3xl border border-gray-800 shadow-xl">
             <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                 <ShieldCheckIcon className="w-4 h-4 text-blue-400" /> Control de Protocolo
             </h4>
             
             <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Estrategia Activa</p>
                    <p className="text-sm font-bold text-white uppercase">{challenge.config.strategy}</p>
                </div>
                
                <button 
                    onClick={() => {
                         if (window.confirm("¿Confirmar Cash Out total? Se cerrará el reto consolidando las ganancias actuales.")) {
                             setChallenge({ ...challenge, mode: 'Completed' });
                         }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-[10px] uppercase shadow-xl transition-all"
                >
                    LIQUIDAR RETO (CASH OUT)
                </button>
             </div>
        </div>
    );
};

// --- COMPONENTE: ASISTENTE DE CREACIÓN (WIZARD) ---

const ChallengeWizard: React.FC<{ onCancel: () => void, onComplete: (challenge: Challenge) => void }> = ({ onCancel, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [config, setConfig] = useState<ChallengeConfig>({
        id: `challenge_${Date.now()}`,
        name: 'OPERACIÓN PLAN MAESTRO',
        seedCapital: 25,
        targetGoal: 1000,
        strategy: 'Balanced',
        executionMode: 'MasterPlan',
        withdrawalProtocol: 'SaveInitialStake',
        targetDate: '',
        createdAt: Date.now()
    });

    const handleFinalize = async () => {
        if (config.executionMode === 'MasterPlan') {
            setIsGenerating(true);
            try {
                const initialSteps = await getPlannedChallengeRoadmap(config);
                const challenge: Challenge = {
                    config,
                    currentCapital: config.seedCapital,
                    totalWithdrawn: 0,
                    steps: initialSteps,
                    mode: 'Active',
                    lastUpdate: Date.now()
                };
                onComplete(challenge);
            } catch (e) {
                alert("Error generando el Plan Maestro. Intente con Modo Manual.");
                setIsGenerating(false);
            }
        } else {
            const challenge: Challenge = {
                config,
                currentCapital: config.seedCapital,
                totalWithdrawn: 0,
                steps: [],
                mode: 'Active',
                lastUpdate: Date.now()
            };
            onComplete(challenge);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-brand-secondary rounded-3xl border border-gray-800 p-10 shadow-2xl animate-fade-in relative overflow-hidden">
            <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <RocketIcon className="text-orange-500 w-8 h-8" />
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">NEXUS CHALLENGE BUILDER</h3>
                </div>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Paso {step} / 4</p>
            </header>

            <div className="min-h-[350px]">
                {step === 1 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nombre del Reto</label>
                                <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value.toUpperCase()})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-5 text-2xl font-black text-white text-center outline-none focus:border-brand-accent" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 text-center">Capital Inicial (€)</label>
                                <input type="number" value={config.seedCapital} onChange={e => setConfig({...config, seedCapital: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-5 text-3xl font-black text-white text-center outline-none focus:border-brand-accent" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 text-center">Objetivo (€)</label>
                                <input type="number" value={config.targetGoal} onChange={e => setConfig({...config, targetGoal: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-5 text-3xl font-black text-orange-500 text-center outline-none focus:border-orange-500" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Fecha Límite (Timeline)</label>
                                <input type="date" value={config.targetDate} onChange={e => setConfig({...config, targetDate: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-brand-accent" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <h4 className="text-white font-bold text-center mb-6 uppercase tracking-widest text-xs">Modo de Ejecución</h4>
                        {(['Manual', 'MasterPlan'] as ChallengeExecutionMode[]).map(m => (
                            <button key={m} onClick={() => setConfig({...config, executionMode: m})} className={`w-full p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${config.executionMode === m ? 'border-brand-accent bg-brand-accent/5 text-white' : 'border-gray-800 opacity-40'}`}>
                                <div className="text-left">
                                    <p className="font-black uppercase text-sm">{m === 'Manual' ? 'Manual Paso a Paso' : 'Plan Maestro (Full Roadmap)'}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{m === 'Manual' ? 'Tú seleccionas los picks uno a uno o pides sugerencias al momento.' : 'La IA planifica todos los pasos, calcula cuotas y fechas desde el inicio.'}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <h4 className="text-white font-bold text-center mb-6 uppercase tracking-widest text-xs">Estrategia de Riesgo</h4>
                        {(['UltraConservative', 'Conservative', 'Balanced', 'Aggressive'] as ChallengeStrategy[]).map(s => (
                            <button key={s} onClick={() => setConfig({...config, strategy: s})} className={`w-full p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${config.strategy === s ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-800 opacity-40'}`}>
                                <div className="text-left">
                                    <p className="font-black uppercase text-xs">{s === 'UltraConservative' ? 'Muro Ultra-Seguro' : s === 'Conservative' ? 'Escudo Conservador' : s === 'Balanced' ? 'Vigilancia Balanceada' : 'Ataque Agresivo'}</p>
                                    <p className="text-[9px] text-gray-400 mt-1">{s === 'UltraConservative' ? 'Cuotas @1.15-1.25. Máxima supervivencia.' : s === 'Conservative' ? '@1.25-1.45. Bajo riesgo.' : s === 'Balanced' ? '@1.45-1.75. Crecimiento estándar.' : 'Cuotas @1.80+. Máxima aceleración.'}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4 animate-fade-in">
                         <h4 className="text-white font-bold text-center mb-6 uppercase tracking-widest text-xs">Protocolo de Blindaje</h4>
                         {(['SaveInitialStake', 'TacticalHarvest', 'ZeroWithdrawal'] as ChallengeWithdrawalProtocol[]).map(p => (
                            <button key={p} onClick={() => setConfig({...config, withdrawalProtocol: p})} className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${config.withdrawalProtocol === p ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 opacity-40'}`}>
                                <p className="font-black uppercase text-sm">{p === 'SaveInitialStake' ? 'Recuperar Inversión Pronto' : p === 'TacticalHarvest' ? 'Cosecha Recurrente (20%)' : 'Interés Compuesto Agresivo'}</p>
                                <p className="text-[9px] text-gray-500 mt-1">{p === 'SaveInitialStake' ? 'Al doblar capital, se retira la inversión inicial.' : p === 'TacticalHarvest' ? 'Se retira un % de beneficios en cada paso ganado.' : 'Todo el capital se reinvierte para máximo interés compuesto.'}</p>
                            </button>
                         ))}
                    </div>
                )}
            </div>

            <footer className="mt-12 flex justify-between gap-4">
                {step > 1 && <button onClick={() => setStep(step - 1)} className="text-xs font-bold text-gray-500 uppercase">Anterior</button>}
                {step < 4 ? (
                    <button onClick={() => setStep(step + 1)} className="bg-brand-accent text-brand-primary font-black py-4 px-12 rounded-2xl uppercase text-sm ml-auto">Siguiente</button>
                ) : (
                    <button 
                        onClick={handleFinalize} 
                        disabled={isGenerating}
                        className="bg-brand-accent text-brand-primary font-black py-4 px-12 rounded-2xl uppercase text-sm ml-auto flex items-center gap-2"
                    >
                        {isGenerating ? <><LoadingSpinner /> GENERANDO PLAN...</> : 'INICIAR OPERACIÓN'}
                    </button>
                )}
            </footer>
        </div>
    );
};
