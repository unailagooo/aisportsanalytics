
import React, { useState } from 'react';
import { getRiskAudit } from '../services/geminiService';
import type { RiskAuditReport } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { WarningIcon, BrainCircuitIcon, ShieldCheckIcon } from './IconComponents';

interface RiskAuditorProps {
    onBack: () => void;
}

export const RiskAuditor: React.FC<RiskAuditorProps> = ({ onBack }) => {
    const [pick, setPick] = useState('');
    const [report, setReport] = useState<RiskAuditReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAudit = async () => {
        if (!pick.trim()) return;
        setIsLoading(true);
        setReport(null);
        try {
            const result = await getRiskAudit(pick);
            setReport(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-900/20 rounded-lg">
                        <WarningIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">The Risk Auditor</h2>
                        <p className="text-brand-text-secondary">El "Abogado del Diablo" de tus apuestas.</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-brand-secondary p-8 rounded-2xl border border-gray-800 shadow-xl mb-12">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Introduce tu pronóstico ya formado</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text" 
                        value={pick}
                        onChange={(e) => setPick(e.target.value)}
                        placeholder="Ej: Gana el Real Madrid vs Talavera @1.15"
                        className="flex-grow bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <button 
                        onClick={handleAudit}
                        disabled={isLoading || !pick}
                        className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner /> : 'AUDITAR RIESGO'}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-red-400 font-mono text-sm animate-pulse">INVESTIGANDO PUNTOS DE FALLO, LESIONES Y FATIGA...</p>
                </div>
            )}

            {report && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                    <div className="bg-red-900/10 border-2 border-red-500/30 rounded-2xl p-6 text-center">
                        <p className="text-xs text-red-400 uppercase font-bold tracking-widest mb-1">Nivel de Riesgo Forense</p>
                        <p className="text-4xl font-black text-white uppercase">{report.riskLevel}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {report.factors.map((f, i) => (
                            <div key={i} className="bg-gray-800/40 p-6 rounded-xl border border-gray-700">
                                <h4 className="text-red-400 font-bold mb-2 uppercase text-xs">{f.title}</h4>
                                <p className="text-brand-text-secondary text-sm leading-relaxed italic">"{f.description}"</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-brand-secondary p-8 rounded-2xl border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                             <BrainCircuitIcon className="text-brand-accent w-6 h-6" /> Veredicto de Seguridad
                        </h3>
                        <p className="text-brand-text-secondary leading-relaxed">{report.conclusion}</p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                            <ShieldCheckIcon className="w-4 h-4 text-brand-accent"/>
                            <span>Si después de leer este ataque sigues confiando en el pick, es un Pick de Hierro.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
