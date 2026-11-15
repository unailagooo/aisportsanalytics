
import React, { useState } from 'react';
import { getMatchMenu } from '../services/geminiService';
import type { MatchMenuData, BetSlipItem, Sport } from '../types';
import { Sport as SportEnum } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ClipboardListIcon, ShieldCheckIcon, BrainCircuitIcon, TargetIcon } from './IconComponents';

interface MatchMenuProps {
    onBack: () => void;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
}

export const MatchMenu: React.FC<MatchMenuProps> = ({ onBack, onToggleBet, betSlip }) => {
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [sport, setSport] = useState<Sport>(SportEnum.Football);
    const [menu, setMenu] = useState<MatchMenuData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!teamA || !teamB) return;
        setIsLoading(true);
        setMenu(null);
        try {
            const result = await getMatchMenu(teamA, teamB, sport);
            setMenu(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const isBetInSlip = (item: any) => {
        return betSlip.some(s => s.matchIdentifier.includes(teamA) && s.outcomeName === item.outcomeName);
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-400/20 rounded-lg">
                        <ClipboardListIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">The Match Menu</h2>
                        <p className="text-brand-text-secondary">Desglose de 3 niveles de riesgo para cualquier partido.</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-brand-secondary p-8 rounded-2xl border border-gray-800 shadow-xl mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase font-bold mb-2">Deporte</label>
                        <select value={sport} onChange={e => setSport(e.target.value as Sport)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white">
                            {Object.values(SportEnum).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-1">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">Team A</label>
                            <input type="text" value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="Ej: Lakers" className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-1 focus:ring-brand-accent outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">Team B</label>
                            <input type="text" value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="Ej: Warriors" className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-1 focus:ring-brand-accent outline-none" />
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !teamA || !teamB}
                    className="w-full mt-6 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-black py-4 rounded-xl transition-all disabled:opacity-50"
                >
                    {isLoading ? <LoadingSpinner /> : 'GENERAR MENÚ ESTRATÉGICO'}
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-brand-accent font-mono text-sm animate-pulse tracking-widest">DIVIDIENDO ANÁLISIS EN NIVELES DE RIESGO...</p>
                </div>
            )}

            {menu && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    {/* SAFE LEVEL */}
                    <div className="bg-brand-secondary rounded-2xl border border-gray-800 overflow-hidden shadow-xl flex flex-col group hover:border-green-500 transition-colors">
                        <div className="p-4 bg-green-900/20 border-b border-gray-800 flex items-center justify-between">
                            <span className="text-green-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4"/> Suelo Institucional
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">CONFIDENCIA: 95%</span>
                        </div>
                        <div className="p-6 flex-grow">
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">{menu.safe.marketName}</p>
                            <h3 className="text-white font-black text-xl mb-4">{menu.safe.outcomeName}</h3>
                            <div className="bg-gray-900 rounded-lg p-3 text-center mb-6 border border-gray-800">
                                <span className="text-3xl font-mono font-black text-brand-accent">@{Number(menu.safe.odds).toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] text-brand-text-secondary leading-relaxed italic">"{menu.safe.justification.veredictoCuantico}"</p>
                        </div>
                        <button 
                            onClick={() => onToggleBet({ matchIdentifier: `${teamA} vs ${teamB}`, marketName: menu.safe.marketName, outcomeName: menu.safe.outcomeName, odds: menu.safe.odds, sport })}
                            className={`p-4 font-bold text-xs uppercase transition-all ${isBetInSlip(menu.safe) ? 'bg-red-800 text-white' : 'bg-brand-accent text-brand-primary'}`}
                        >
                            {isBetInSlip(menu.safe) ? 'Quitar del Boleto' : 'Añadir este Nivel'}
                        </button>
                    </div>

                    {/* LOGIC LEVEL */}
                    <div className="bg-brand-secondary rounded-2xl border border-gray-800 overflow-hidden shadow-xl flex flex-col group hover:border-blue-400 transition-colors">
                        <div className="p-4 bg-blue-900/20 border-b border-gray-800 flex items-center justify-between">
                            <span className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                <BrainCircuitIcon className="w-4 h-4"/> Tesis Central
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">BALANCEADO</span>
                        </div>
                        <div className="p-6 flex-grow">
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">{menu.logic.marketName}</p>
                            <h3 className="text-white font-black text-xl mb-4">{menu.logic.outcomeName}</h3>
                            <div className="bg-gray-900 rounded-lg p-3 text-center mb-6 border border-gray-800">
                                <span className="text-3xl font-mono font-black text-white">@{Number(menu.logic.odds).toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] text-brand-text-secondary leading-relaxed italic">"{menu.logic.justification.veredictoCuantico}"</p>
                        </div>
                        <button 
                            onClick={() => onToggleBet({ matchIdentifier: `${teamA} vs ${teamB}`, marketName: menu.logic.marketName, outcomeName: menu.logic.outcomeName, odds: menu.logic.odds, sport })}
                            className={`p-4 font-bold text-xs uppercase transition-all ${isBetInSlip(menu.logic) ? 'bg-red-800 text-white' : 'bg-blue-400 text-brand-primary'}`}
                        >
                            {isBetInSlip(menu.logic) ? 'Quitar del Boleto' : 'Añadir este Nivel'}
                        </button>
                    </div>

                    {/* AGGRESSIVE LEVEL */}
                    <div className="bg-brand-secondary rounded-2xl border border-gray-800 overflow-hidden shadow-xl flex flex-col group hover:border-purple-500 transition-colors">
                        <div className="p-4 bg-purple-900/20 border-b border-gray-700 flex items-center justify-between">
                            <span className="text-purple-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                <TargetIcon className="w-4 h-4"/> Ataque de Valor
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">ALTA CUOTA</span>
                        </div>
                        <div className="p-6 flex-grow">
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">{menu.aggressive.marketName}</p>
                            <h3 className="text-white font-black text-xl mb-4">{menu.aggressive.outcomeName}</h3>
                            <div className="bg-gray-900 rounded-lg p-3 text-center mb-6 border border-gray-800">
                                <span className="text-3xl font-mono font-black text-brand-accent">@{Number(menu.aggressive.odds).toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] text-brand-text-secondary leading-relaxed italic">"{menu.aggressive.justification.veredictoCuantico}"</p>
                        </div>
                        <button 
                            onClick={() => onToggleBet({ matchIdentifier: `${teamA} vs ${teamB}`, marketName: menu.aggressive.marketName, outcomeName: menu.aggressive.outcomeName, odds: menu.aggressive.odds, sport })}
                            className={`p-4 font-bold text-xs uppercase transition-all ${isBetInSlip(menu.aggressive) ? 'bg-red-800 text-white' : 'bg-purple-600 text-white'}`}
                        >
                            {isBetInSlip(menu.aggressive) ? 'Quitar del Boleto' : 'Añadir este Nivel'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
