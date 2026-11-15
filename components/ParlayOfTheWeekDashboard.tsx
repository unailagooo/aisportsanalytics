
import React, { useState, useMemo } from 'react';
import type { AIRecommendedParlay, AIRecommendedParlayLeg, QuantumVectorAnalysis, Sport } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { GemIcon, LayersIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon } from './IconComponents';
import { Sport as SportEnum } from '../types';
import { FootballIcon, BasketballIcon, TennisIcon, AmericanFootballIcon, BaseballIcon, IceHockeyIcon, EsportsIcon, Formula1Icon } from './IconComponents';
import { FiabilityGauge } from './FiabilityGauge';


interface ParlayOfTheWeekDashboardProps {
    onBack: () => void;
    parlayData: AIRecommendedParlay | null;
    isLoading: boolean;
    error: string | null;
    onAddParlayToSlip: (legs: AIRecommendedParlayLeg[]) => void;
    onGenerateParlay: (targetOdds: number, dateRange: { startDate: string; endDate: string }) => void;
    onClearParlay: () => void;
}

const SportIcon: React.FC<{ sport: Sport, className?: string }> = ({ sport, className }) => {
    switch (sport) {
        case SportEnum.Football: return <FootballIcon className={className} />;
        case SportEnum.Basketball: return <BasketballIcon className={className} />;
        case SportEnum.Tennis: return <TennisIcon className={className} />;
        case SportEnum.AmericanFootball: return <AmericanFootballIcon className={className} />;
        case SportEnum.Baseball: return <BaseballIcon className={className} />;
        case SportEnum.IceHockey: return <IceHockeyIcon className={className} />;
        case SportEnum.Esports: return <EsportsIcon className={className} />;
        case SportEnum.Formula1: return <Formula1Icon className={className} />;
        default: return null;
    }
};

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;

    const sections: { title: string; content: string; icon: React.FC<{className?: string}>; color: string }[] = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];

    return (
        <div className="space-y-4">
            {sections.map(section => {
                if (!section.content) return null;
                const Icon = section.icon;
                return (
                    <div key={section.title} className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-gray-700">
                        <h4 className={`font-bold text-sm mb-2 flex items-center gap-2 ${section.color}`}>
                            <Icon className="w-5 h-5" />
                            {section.title}
                        </h4>
                        <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                );
            })}
        </div>
    );
};

export const ParlayOfTheWeekDashboard: React.FC<ParlayOfTheWeekDashboardProps> = ({ onBack, parlayData, isLoading, error, onAddParlayToSlip, onGenerateParlay, onClearParlay }) => {

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const [targetOddsStr, setTargetOddsStr] = useState('5.0');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(nextWeek.toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('global'); // 'global' or the index of the leg
    const [generatedForOdds, setGeneratedForOdds] = useState<number | null>(null);
    
    const handleGenerate = () => {
        const targetOdds = parseFloat(targetOddsStr);
        if (!isNaN(targetOdds) && startDate && endDate) {
            setActiveTab('global'); // Reset to global view on new generation
            setGeneratedForOdds(targetOdds);
            onGenerateParlay(targetOdds, { startDate, endDate });
        }
    };

    const handleClear = () => {
        setActiveTab('global');
        setGeneratedForOdds(null);
        onClearParlay();
    }

    const renderGeneratorForm = () => (
        <div className="bg-brand-secondary rounded-lg shadow-lg p-6 max-w-2xl mx-auto animate-fade-in">
             <h3 className="text-xl font-bold text-center text-white mb-4">Construye tu Combinada Cuántica</h3>
             <div className="space-y-4">
                 <div>
                    <label htmlFor="target-odds" className="block text-sm font-medium text-brand-text-secondary mb-1">Cuota Total Aproximada</label>
                    <input 
                        id="target-odds"
                        type="number"
                        value={targetOddsStr}
                        onChange={(e) => setTargetOddsStr(e.target.value)}
                        placeholder="e.g., 5.0"
                        min="1.5"
                        step="0.1"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-accent text-lg font-mono text-center"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Rango de Fechas</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={today}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-2 text-sm text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                            aria-label="Start Date"
                        />
                        <span className="text-brand-text-secondary">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || today}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-2 text-sm text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                            aria-label="End Date"
                            disabled={!startDate}
                        />
                    </div>
                 </div>
                 <p className="text-xs text-brand-text-secondary text-center">
                    Nota: La IA prioriza la seguridad y viabilidad de cada selección. La cuota final puede variar para garantizar la máxima calidad y confianza.
                </p>
                 <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                 >
                    <GemIcon className="w-6 h-6"/>
                    Forjar Combinada
                 </button>
             </div>
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent animate-pulse-fast">Forjando tu Combinada Cuántica Personalizada...</p>
                    <p className="text-sm text-brand-text-secondary mt-2">Este proceso de élite puede tardar unos segundos.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg my-4 max-w-2xl mx-auto">
                    <p className="font-bold">Error al generar la Combinada</p>
                    <p className="text-sm">{error}</p>
                     <button onClick={handleClear} className="mt-4 bg-brand-accent/80 hover:bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded">Intentar de Nuevo</button>
                </div>
            );
        }
        
        if (!parlayData) {
            return renderGeneratorForm();
        }

        if (!parlayData.legs || parlayData.legs.length === 0) {
             return (
                 <div className="text-center text-brand-text-secondary bg-brand-secondary p-8 rounded-lg mt-8 max-w-2xl mx-auto">
                    <p className="text-lg">No se pudo generar una Combinada</p>
                    <p className="text-sm mt-2">El AI no encontró suficientes oportunidades de ultra-alta confianza para construir una combinada que cumpla tus criterios. La calidad es la máxima prioridad.</p>
                     <button onClick={handleClear} className="mt-4 bg-brand-accent/80 hover:bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded">Intentar de Nuevo</button>
                </div>
            )
        }
        
        const totalOdds = parlayData.legs.reduce((acc, leg) => acc * (leg.odds || 1), 1);

        return (
             <div className="bg-brand-secondary rounded-lg shadow-lg animate-fade-in">
                <div className="p-6 text-center border-b-2 border-brand-accent/50 bg-gray-900/30 rounded-t-lg">
                    <h3 className="text-2xl font-bold text-white">{parlayData.parlayType}</h3>
                    <div className="mt-4 flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                        <div>
                            <p className="text-sm text-brand-text-secondary">Legs</p>
                            <p className="text-3xl font-bold font-mono text-white">{parlayData.legs.length}</p>
                        </div>
                         {generatedForOdds && (
                            <div>
                                <p className="text-sm text-brand-text-secondary">Target Odds</p>
                                <p className="text-2xl font-bold font-mono text-gray-400">@{generatedForOdds?.toFixed(2)}</p>
                            </div>
                         )}
                         <div>
                            <p className="text-sm text-brand-text-secondary">Final Odds</p>
                            <p className="text-4xl font-bold font-mono text-brand-accent">@{totalOdds.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-sm text-brand-text-secondary mb-1">Viability Score</p>
                            <FiabilityGauge score={parlayData.viabilityScore} size="large" />
                        </div>
                    </div>
                </div>
                {parlayData.explanationForOddsDeviation && parlayData.explanationForOddsDeviation !== 'Sin desviación significativa.' && (
                    <div className="p-3 text-center bg-blue-900/30 text-blue-300 text-xs rounded-b-lg border-t border-blue-800/50">
                        <p><span className="font-bold">Nota de la IA:</span> {parlayData.explanationForOddsDeviation}</p>
                    </div>
                )}
                <div className="p-6 space-y-8">
                    <div>
                        <h4 className="text-xl font-bold mb-4 text-white">Selecciones Individuales</h4>
                        <div className="space-y-3">
                            {parlayData.legs.map((leg, index) => (
                                <div key={index} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <SportIcon sport={leg.sport} className="w-6 h-6 text-brand-accent flex-shrink-0"/>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{leg.outcomeName}</p>
                                            <p className="text-xs text-brand-text-secondary truncate">{leg.teamA} vs {leg.teamB}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className="font-mono font-bold text-lg text-white">@{(leg.odds || 0).toFixed(2)}</span>
                                        <FiabilityGauge score={leg.fiabilityScore} size="small"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-4 text-white">Análisis Cuántico Detallado</h4>
                        <div className="border-b border-gray-700 mb-4">
                            <nav className="flex flex-wrap -mb-px gap-4">
                                <button
                                    onClick={() => setActiveTab('global')}
                                    className={`py-3 px-2 text-sm font-semibold transition-colors ${activeTab === 'global' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary hover:text-white'}`}
                                >
                                    Análisis Global
                                </button>
                                {parlayData.legs.map((leg, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveTab(index.toString())}
                                        className={`py-3 px-2 text-sm font-semibold transition-colors truncate ${activeTab === index.toString() ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary hover:text-white'}`}
                                        title={`${leg.teamA} vs ${leg.teamB}`}
                                    >
                                        Selección #{index + 1}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="animate-fade-in">
                            {activeTab === 'global' && (
                                <>
                                    <div className="flex flex-col items-center mb-4">
                                        <p className="text-sm text-brand-text-secondary mb-1">Viability Score (Global)</p>
                                        <FiabilityGauge score={parlayData.viabilityScore} size="large" />
                                    </div>
                                    <StructuredAnalysisDisplay analysis={parlayData.analysis} />
                                </>
                            )}
                            {activeTab !== 'global' && parlayData.legs[parseInt(activeTab)] && (
                                <>
                                    <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <SportIcon sport={parlayData.legs[parseInt(activeTab)].sport} className="w-6 h-6 text-brand-accent flex-shrink-0"/>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white truncate">{parlayData.legs[parseInt(activeTab)].outcomeName}</p>
                                                <p className="text-xs text-brand-text-secondary truncate">{parlayData.legs[parseInt(activeTab)].teamA} vs {parlayData.legs[parseInt(activeTab)].teamB}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className="font-mono font-bold text-lg text-white">@{(parlayData.legs[parseInt(activeTab)].odds || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                     <div className="flex flex-col items-center mb-4">
                                        <p className="text-sm text-brand-text-secondary mb-1">Fiability Score (Individual)</p>
                                        <FiabilityGauge score={parlayData.legs[parseInt(activeTab)].fiabilityScore} size="large" />
                                    </div>
                                    <StructuredAnalysisDisplay analysis={parlayData.legs[parseInt(activeTab)].justification} />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleClear}
                            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded transition-colors"
                        >
                            Empezar de Nuevo
                        </button>
                        <button 
                            onClick={() => onAddParlayToSlip(parlayData.legs)}
                            className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 text-lg"
                        >
                            <LayersIcon className="w-6 h-6" />
                            Añadir al Boleto
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <GemIcon className="w-8 h-8 text-brand-accent"/>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Combinada Cuántica de la Semana</h2>
                        <p className="text-brand-text-secondary">La selección de élite del AI, diseñada para máxima seguridad y alto valor.</p>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    &larr; Volver al Dashboard
                </button>
            </div>
            <div className="my-4 p-3 bg-yellow-900/30 text-yellow-300 text-sm rounded-lg border border-yellow-700/50">
                <p><span className="font-bold">Aviso Importante:</span> Aunque esta combinada ha sido analizada con la máxima rigurosidad por nuestra IA, ninguna apuesta está 100% garantizada. El deporte es impredecible. Apuesta siempre con responsabilidad.</p>
            </div>
            {renderContent()}
        </div>
    );
};
