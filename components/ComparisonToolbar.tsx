import React, { useState } from 'react';
import { TestTubeIcon, UsersIcon, BrainCircuitIcon } from './IconComponents';

interface ComparisonToolbarProps {
    onSimulateScenario: (scenario: string) => void;
    isSimulating: boolean;
    onOpenPlayerComparison: () => void;
    onAnalyzeCustomBet: (prediction: string) => void;
    isAnalyzingCustom: boolean;
}

export const ComparisonToolbar: React.FC<ComparisonToolbarProps> = ({ onSimulateScenario, isSimulating, onOpenPlayerComparison, onAnalyzeCustomBet, isAnalyzingCustom }) => {
    const [customScenario, setCustomScenario] = useState('');
    const [customPrediction, setCustomPrediction] = useState('');

    return (
        <div className="my-8 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="font-semibold text-white mb-4 text-lg">Herramientas de Análisis Interactivo</h3>
            <div className="space-y-4">
                <div className="border border-gray-700 p-3 rounded-lg">
                    <h4 className="font-bold text-brand-text-secondary mb-2 flex items-center gap-2"><TestTubeIcon className="w-5 h-5"/>'What If?' Scenario Simulator</h4>
                    <div className="flex gap-2">
                        <input 
                          type="text"
                          value={customScenario}
                          onChange={(e) => setCustomScenario(e.target.value)}
                          placeholder="Ask a question, e.g., 'Star player gets injured'"
                          className="w-full bg-brand-secondary border border-gray-600 rounded-md py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <button 
                            onClick={() => onSimulateScenario(customScenario)}
                            disabled={isSimulating || !customScenario.trim()}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold px-4 rounded transition-colors disabled:opacity-50"
                        >
                            {isSimulating ? '...' : 'Run'}
                        </button>
                    </div>
                </div>
                 <div className="border border-gray-700 p-3 rounded-lg">
                     <h4 className="font-bold text-brand-text-secondary mb-2 flex items-center gap-2"><UsersIcon className="w-5 h-5"/>Player vs. Player</h4>
                    <button 
                        onClick={onOpenPlayerComparison}
                        className="w-full bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent font-bold py-2 px-4 rounded transition-colors"
                    >
                       Launch Player Comparison
                    </button>
                </div>
                <div className="border border-gray-700 p-3 rounded-lg">
                    <h4 className="font-bold text-brand-text-secondary mb-2 flex items-center gap-2"><BrainCircuitIcon className="w-5 h-5"/>Analiza tu Propio Pronóstico</h4>
                    <div className="flex gap-2">
                         <input 
                          type="text"
                          value={customPrediction}
                          onChange={(e) => setCustomPrediction(e.target.value)}
                          placeholder="Ej: Gana el Equipo A y ambos marcan"
                          className="w-full bg-brand-secondary border border-gray-600 rounded-md py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <button 
                            onClick={() => onAnalyzeCustomBet(customPrediction)}
                            disabled={isAnalyzingCustom || !customPrediction.trim()}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold px-4 rounded transition-colors disabled:opacity-50"
                        >
                            {isAnalyzingCustom ? '...' : 'Analizar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};