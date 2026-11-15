import React, { useState, useMemo } from 'react';
import { getParlayAnalysis, getBetPostMortemAnalysis, getPerformanceAnalysis } from '../services/geminiService';
import type { BetSlipItem, ParlayAnalysis, StakingStrategy, CompletedBet, UserPreferences, BetPostMortemAnalysis, PerformanceAnalysis, Sport, QuantumVectorAnalysis, UserProfile } from '../types';
import { TicketIcon, TrashIcon, LinkIcon, StakeIcon, BrainCircuitIcon, ChartLineIcon, DollarSignIcon, WarningIcon, RefreshIcon, ClipboardListIcon } from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { FiabilityGauge } from './FiabilityGauge';
import { BankrollManager } from './BankrollManager';
import { BetReviewModal } from './BetReviewModal';
import { exportBetsToGoogleSheets, getSavedSpreadsheetId, saveSpreadsheetId, extractSpreadsheetId } from '../services/googleWorkspaceService';

interface BetSlipProps {
  items: BetSlipItem[];
  activeProfile: UserProfile;
  onRemove: (item: BetSlipItem) => void;
  onClearAndArchive: (stakedItems: { item: BetSlipItem, stake: number }[]) => void;
  onUpdateBetStatus: (betId: string, status: 'win' | 'loss') => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const calculateKellyStake = (bankroll: number, odds: number, fiabilityScore: number): number => {
    if (Number(odds) <= 1 || fiabilityScore <= 50) return 0;
    const probability = fiabilityScore / 100;
    const b = Number(odds) - 1; 
    const kellyFraction = (b * probability - (1 - probability)) / b;
    if (kellyFraction <= 0) return 0;
    return Math.max(0.01, (kellyFraction * bankroll) / 10); 
};

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis, size?: 'small' }> = ({ analysis, size }) => {
    if (!analysis) return null;
    const isSmall = size === 'small';
    const sections: { title: string; content: string; icon: React.FC<{className?: string}>; color: string }[] = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, icon: BrainCircuitIcon, color: 'text-brand-accent' },
    ];

    return (
        <div className="space-y-3">
            {sections.map(section => {
                if (!section.content) return null;
                const Icon = section.icon;
                return (
                    <div key={section.title}>
                        <h5 className={`font-bold mb-1 flex items-center gap-1.5 ${section.color} ${isSmall ? 'text-xs' : 'text-sm'}`}>
                            <Icon className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                            {section.title}
                        </h5>
                        <p className={`leading-relaxed whitespace-pre-line ${isSmall ? 'text-xs text-brand-text-secondary' : 'text-sm text-brand-text-secondary'}`}>{section.content}</p>
                    </div>
                );
            })}
        </div>
    );
};


export const BetSlip: React.FC<BetSlipProps> = ({ items, activeProfile, onRemove, onClearAndArchive, onUpdateBetStatus, onUpdateProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('bets');
  const [parlayAnalysis, setParlayAnalysis] = useState<ParlayAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [reviewingBet, setReviewingBet] = useState<CompletedBet | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAnalysis, setReviewAnalysis] = useState<BetPostMortemAnalysis | null>(null);
  
  const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);
  const [linkedSheetId, setLinkedSheetId] = useState<string | null>(() => getSavedSpreadsheetId());
  const [isLinkingSheet, setIsLinkingSheet] = useState(false);
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [stakes, setStakes] = useState<Record<string, number>>({});

  const { bankroll, stakingStrategy, stakingPercentage, betHistory, preferences } = activeProfile;

  const getItemKey = (item: BetSlipItem) => `${item.matchIdentifier}-${item.outcomeName}`;

  const updateStake = (item: BetSlipItem, amount: number) => {
      const validAmount = isNaN(amount) ? 0 : amount;
      setStakes(prev => ({ ...prev, [getItemKey(item)]: validAmount }));
  };

  const getSuggestedStakeAmount = (item: BetSlipItem): number => {
    if (!bankroll || bankroll <= 0) return 0;
    let amount = 0;
    try {
        switch (stakingStrategy) {
            case 'Level': 
                amount = bankroll * ((stakingPercentage || 2) / 100);
                break;
            case 'Percentage':
                const score = typeof item.fiabilityScore === 'number' ? item.fiabilityScore : 50;
                const confidenceMultiplier = (score / 100) * 1.5;
                amount = Math.max(0, bankroll * ((stakingPercentage || 2) / 100) * confidenceMultiplier);
                break;
            case 'Kelly': 
                amount = calculateKellyStake(bankroll, Number(item.odds) || 0, item.fiabilityScore || 50);
                break;
            default: amount = 0;
        }
    } catch (error) {
        console.error("Error calculating stake", error);
        return 0;
    }
    return parseFloat(Number(amount).toFixed(2)) || 0;
  };

  const totalStake = useMemo(() => {
      return items.reduce((sum, item) => sum + (stakes[getItemKey(item)] || 0), 0);
  }, [items, stakes]);

  const potentialTotalReturn = useMemo(() => {
      return items.reduce((sum, item) => sum + ((stakes[getItemKey(item)] || 0) * (Number(item.odds) || 1)), 0);
  }, [items, stakes]);

  const handlePlaceBets = () => {
      if (totalStake > bankroll) {
          alert("You do not have enough funds in your bankroll.");
          return;
      }
      const betsToPlace = items.map(item => ({
          item,
          stake: stakes[getItemKey(item)] || 0
      })).filter(b => b.stake > 0);
      onClearAndArchive(betsToPlace);
      setStakes({}); 
  };

  const totalOdds = useMemo(() => items.length === 0 ? 0 : items.reduce((acc, item) => acc * (Number(item.odds) || 1), 1), [items]);

  const handleAnalyzeParlay = async () => {
    if (items.length < 2) return;
    setIsAnalyzing(true);
    setParlayAnalysis(null);
    try {
      const result = await getParlayAnalysis(items);
      setParlayAnalysis(result);
    } catch (error) {
       console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleCopyForAnalyzer = () => {
    if (items.length === 0) return;
    const betsText = items.map((item, index) => 
        `--- Apuesta ${index + 1} ---\n` +
        `Deporte: ${item.sport}\n` +
        `Evento: ${item.matchIdentifier}\n` +
        `Mercado: ${item.marketName}\n` +
        `Selección: ${item.outcomeName}\n` +
        `Cuota Individual: @${Number(item.odds).toFixed(2)}\n` +
        `Fecha: ${new Date(item.matchDateTime || Date.now()).toLocaleDateString()}`
    ).join('\n\n');

    const clipboardText = `[BOLETO DE APUESTAS - ANÁLISIS SOLICITADO]\n\n${betsText}\n\n` +
                          `--- RESUMEN DEL BOLETO ---\n` +
                          `Número de Selecciones: ${items.length}\n` +
                          `Cuota Total (Combinada): @${Number(totalOdds).toFixed(2)}`;

    navigator.clipboard.writeText(clipboardText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy:', err));
  };

  const handleExportToSheets = async () => {
    if (items.length === 0) return;
    try {
        setIsExporting(true);
        setExportStatus(null);
        const result = await exportBetsToGoogleSheets(items, linkedSheetId || undefined);
        const newId = extractSpreadsheetId(result.url);
        setLinkedSheetId(newId);
        setExportStatus({
            type: 'success',
            message: result.isNew 
                ? `¡Archivo '${result.spreadsheetTitle || 'picks ai'}' creado con ${result.rowsAdded} picks!` 
                : `¡${result.rowsAdded} picks añadidos a las siguientes filas de tu archivo '${result.spreadsheetTitle || 'picks ai'}'!`,
            url: result.url
        });
    } catch (e: any) {
        console.error("Export error:", e);
        setExportStatus({
            type: 'error',
            message: e.message || 'Error al exportar a Google Drive'
        });
    } finally {
        setIsExporting(false);
    }
  };

  const handleSaveLinkedSheet = () => {
    if (!sheetInputUrl.trim()) return;
    const extracted = extractSpreadsheetId(sheetInputUrl.trim());
    if (extracted) {
      saveSpreadsheetId(extracted);
      setLinkedSheetId(extracted);
      setIsLinkingSheet(false);
      setSheetInputUrl('');
      setExportStatus({
        type: 'success',
        message: '¡Tu archivo de Google Sheets ha sido vinculado correctamente! Los próximos picks se añadirán a este archivo.'
      });
    }
  };

  const handleUnlinkSheet = () => {
    saveSpreadsheetId(null);
    setLinkedSheetId(null);
    setExportStatus({
      type: 'success',
      message: 'Vínculo eliminado. Se buscará automáticamente en Drive o podrás vincular otro archivo.'
    });
  };
  
  const handleAnalyzePerformance = async () => {
    if (betHistory.length < 1) return;
    setIsAnalyzingPerformance(true);
    setPerformanceAnalysis(null);
    try {
        const result = await getPerformanceAnalysis(betHistory, preferences);
        setPerformanceAnalysis(result);
    } catch (error) {
        console.error(error);
        setPerformanceAnalysis({
            summary: "An error occurred while analyzing your performance.",
            strongestAreas: [],
            weakestAreas: [],
        });
    } finally {
        setIsAnalyzingPerformance(false);
    }
  };

  const handleReviewBet = async (bet: CompletedBet) => {
    if (isReviewing) return;
    setReviewingBet(bet);
    setIsReviewing(true);
    setReviewAnalysis(null);
    try {
        const result = await getBetPostMortemAnalysis(bet);
        setReviewAnalysis(result);
    } catch (e) {
        console.error(e);
        setReviewAnalysis({
            analysis: "Could not retrieve AI review for this bet.",
            keyFactor: "Error",
            finalScore: "N/A"
        });
    } finally {
        setIsReviewing(false);
    }
  };

  const toggleSlip = () => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setParlayAnalysis(null);
    }
  };

  const renderBetsTab = () => {
    if (items.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <TicketIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-brand-text-secondary">Your bet slip is empty.</p>
            <p className="text-sm text-gray-500">Click on odds to add selections.</p>
        </div>
      );
    }
    return (
      <>
        <div className="p-4 space-y-4">
            {items.map((item, index) => {
                const key = getItemKey(item);
                const currentStake = stakes[key] || 0;
                const suggested = getSuggestedStakeAmount(item);
                const potentialReturn = currentStake * Number(item.odds || 0);

                return (
                    <div key={key} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 pr-2">
                                <p className="text-sm font-bold truncate text-brand-text">{item.outcomeName}</p>
                                <p className="text-xs text-brand-text-secondary truncate">{item.matchIdentifier}</p>
                                <p className="text-xs text-gray-400">{item.marketName}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono font-bold text-brand-accent text-lg">@{Number(item.odds || 0).toFixed(2)}</span>
                                <button onClick={() => onRemove(item)} className="text-gray-500 hover:text-red-400 mt-1">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-700/50">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <label className="text-xs text-brand-text-secondary font-semibold">Stake ($):</label>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="1"
                                        value={currentStake || ''} 
                                        onChange={(e) => updateStake(item, parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); updateStake(item, suggested); }}
                                        className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50 hover:bg-blue-800/50 transition-colors"
                                    >
                                        Magic: ${suggested}
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-brand-text-secondary">To Win</p>
                                    <p className="text-xs font-mono text-green-400 font-bold">+${Math.max(0, potentialReturn - currentStake).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        {isAnalyzing && <div className="p-4 flex justify-center"><LoadingSpinner /></div>}
        {!isAnalyzing && parlayAnalysis && (
          <div className="p-4 pt-0">
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-4">
                <div className="flex justify-between items-center"><h4 className="text-sm font-bold text-brand-accent">AI Parlay Analysis</h4><FiabilityGauge score={parlayAnalysis.viabilityScore} size="small"/></div>
                <StructuredAnalysisDisplay analysis={parlayAnalysis.structuredAnalysis} size="small" />
            </div>
          </div>
        )}
      </>
    );
  };

  const renderHistoryTab = () => {
    const sortedHistory = [...betHistory].sort((a,b) => parseInt(b.id.split('-')[0]) - parseInt(a.id.split('-')[0]));
    if (sortedHistory.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <ClipboardListIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-brand-text-secondary">Your bet history is empty.</p>
        </div>
      );
    }
    return (
        <div className="p-4 space-y-3">
            {sortedHistory.map((bet) => (
                <div key={bet.id} className="bg-gray-800/50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                            <p className="font-bold truncate text-brand-text">{bet.outcomeName}</p>
                            <p className="text-xs text-brand-text-secondary truncate">{bet.matchIdentifier}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            bet.status === 'win' ? 'bg-green-500/20 text-green-400' :
                            bet.status === 'loss' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>{bet.status}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                        {bet.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button onClick={() => onUpdateBetStatus(bet.id, 'win')} className="flex-1 text-xs bg-green-700/50 hover:bg-green-600 text-white font-semibold py-1.5 px-2 rounded">Mark as Won</button>
                                <button onClick={() => onUpdateBetStatus(bet.id, 'loss')} className="flex-1 text-xs bg-red-800/50 hover:bg-red-700 text-white font-semibold py-1.5 px-2 rounded">Mark as Lost</button>
                            </div>
                        ) : (
                            <button onClick={() => handleReviewBet(bet)} className="w-full flex items-center justify-center gap-2 text-xs bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent font-semibold py-1.5 px-2 rounded">
                                <BrainCircuitIcon className="w-4 h-4" /> AI Review
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
  };
  
  const PerformanceStats: React.FC<{ history: CompletedBet[] }> = ({ history }) => {
    const stats = useMemo(() => {
        const completed = history.filter(b => b.status !== 'pending');
        if (completed.length === 0) return { wins: 0, losses: 0, winRate: 0, totalProfit: 0, roi: 0 };
        const wins = completed.filter(b => b.status === 'win').length;
        const losses = completed.length - wins;
        const winRate = (wins / completed.length) * 100;
        const totalProfit = completed.reduce((acc, bet) => {
            if (bet.status === 'win') return acc + (Number(bet.odds) - 1);
            if (bet.status === 'loss') return acc - 1;
            return acc;
        }, 0);
        return { wins, losses, winRate, totalProfit, roi: (totalProfit / completed.length) * 100 };
    }, [history]);

    return (
        <div className="p-4 space-y-4">
             <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2 mb-2"><ChartLineIcon className="w-6 h-6 text-brand-accent"/>Performance Overview</h3>
             <div className="bg-gray-800/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm py-1">
                    <span className="text-brand-text-secondary">Win Rate</span>
                    <span className={`font-bold font-mono ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                    <span className="text-brand-text-secondary">Profit / Loss</span>
                    <span className={`font-bold font-mono ${stats.totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>{stats.totalProfit.toFixed(2)} u</span>
                </div>
             </div>
             {isAnalyzingPerformance && <div className="flex justify-center"><LoadingSpinner/></div>}
             {performanceAnalysis && (
                 <div className="space-y-2 text-sm animate-fade-in bg-gray-800/50 p-3 rounded-lg">
                    <p className="italic text-brand-text-secondary">"{performanceAnalysis.summary}"</p>
                 </div>
             )}
             <button onClick={handleAnalyzePerformance} disabled={isAnalyzingPerformance || betHistory.length < 1} className="w-full mt-2 flex items-center justify-center gap-2 text-sm bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent font-semibold py-2 px-2 rounded disabled:opacity-50">
                <BrainCircuitIcon className="w-4 h-4"/> Get AI Performance Review
             </button>
        </div>
    )
  }

  return (
    <>
      <div 
        className={`fixed right-0 top-0 h-full bg-brand-secondary/80 backdrop-blur-md shadow-2xl z-30 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} w-full max-w-sm flex flex-col`}
      >
        <header className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold text-brand-text">Betting Slip</h2>
          <button onClick={toggleSlip} className="text-gray-400 hover:text-white">&times;</button>
        </header>
        <div className="flex border-b border-gray-700">
            <button onClick={() => setActiveTab('bets')} className={`flex-1 p-3 text-sm font-semibold ${activeTab === 'bets' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400'}`}>Current Bets ({items.length})</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 p-3 text-sm font-semibold ${activeTab === 'history' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400'}`}>History ({betHistory.length})</button>
            <button onClick={() => setActiveTab('bankroll')} className={`flex-1 p-3 text-sm font-semibold ${activeTab === 'bankroll' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400'}`}>Tools</button>
        </div>
        <div className="flex-grow overflow-y-auto">
            {activeTab === 'bets' && renderBetsTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'bankroll' && 
                <div className="divide-y divide-gray-700">
                    <BankrollManager 
                        bankroll={bankroll}
                        setBankroll={(value) => onUpdateProfile({ bankroll: value })}
                        strategy={stakingStrategy}
                        setStrategy={(value) => onUpdateProfile({ stakingStrategy: value })}
                        percentage={stakingPercentage}
                        setPercentage={(value) => onUpdateProfile({ stakingPercentage: value })}
                        betHistory={betHistory}
                        userPreferences={preferences}
                    />
                    <PerformanceStats history={betHistory} />
                </div>
            }
        </div>
        {activeTab === 'bets' && items.length > 0 && (
          <footer className="p-4 border-t border-gray-700 bg-gray-900/90">
            <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-brand-text-secondary">Available Bankroll:</span>
                <span className={`font-bold ${bankroll < totalStake ? 'text-red-500' : 'text-white'}`}>${Number(bankroll).toFixed(2)}</span>
            </div>
            {totalStake > 0 && (
                <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-brand-text-secondary">Total Stake:</span>
                    <span className="font-bold text-white">-${Number(totalStake).toFixed(2)}</span>
                </div>
            )}
            {items.length > 1 && (
                <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-brand-text-secondary">Parlay Odds:</span>
                    <span className="font-mono font-bold text-brand-accent">@{Number(totalOdds).toFixed(2)}</span>
                </div>
            )}
            <button
                onClick={handleCopyForAnalyzer}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold mb-2 py-2 px-2 rounded transition-all duration-300 ${isCopied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            >
                <ClipboardListIcon className="w-4 h-4"/> {isCopied ? '¡Copiado!' : 'Copiar para Analizador'}
            </button>
            <button
                onClick={handleExportToSheets}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold mb-1 py-2 px-2 rounded transition-all duration-300 bg-[#0F9D58] hover:bg-[#0B8043] text-white shadow"
            >
                {isExporting ? <LoadingSpinner/> : 'Exportar a Google Drive (\'picks ai\')'}
            </button>
            
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 px-1">
                <span>{linkedSheetId ? '🟢 Hoja vinculada' : '⚪ Sin vincular'}</span>
                <button 
                    type="button"
                    onClick={() => setIsLinkingSheet(!isLinkingSheet)}
                    className="text-brand-accent hover:underline text-[11px] font-medium"
                >
                    {linkedSheetId ? 'Cambiar hoja' : 'Vincular mi archivo \'picks ai\''}
                </button>
            </div>

            {isLinkingSheet && (
                <div className="p-2.5 mb-2 rounded bg-brand-primary/95 border border-gray-700 text-xs shadow-lg animate-fade-in">
                    <p className="text-gray-200 mb-1.5 font-semibold">Pega el enlace o ID de tu Google Sheet:</p>
                    <input 
                        type="text"
                        value={sheetInputUrl}
                        onChange={(e) => setSheetInputUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1.5 text-xs text-white mb-2 focus:outline-none focus:border-brand-accent placeholder-gray-500"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSaveLinkedSheet}
                            disabled={!sheetInputUrl.trim()}
                            className="flex-1 bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-1 px-2 rounded text-xs disabled:opacity-40 transition-colors"
                        >
                            Vincular hoja
                        </button>
                        {linkedSheetId && (
                            <button
                                type="button"
                                onClick={handleUnlinkSheet}
                                className="text-red-400 hover:text-red-300 py-1 px-2 rounded text-xs"
                            >
                                Desvincular
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsLinkingSheet(false)}
                            className="text-gray-400 hover:text-white py-1 px-2 rounded text-xs"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {exportStatus && (
                <div className={`p-2.5 rounded text-xs mb-2 border ${exportStatus.type === 'success' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-red-950/70 border-red-500/50 text-red-200'}`}>
                    <p className="font-medium leading-relaxed">{exportStatus.message}</p>
                    {exportStatus.url && (
                        <a 
                            href={exportStatus.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded font-semibold transition-colors"
                        >
                            Abrir archivo en Google Sheets ↗
                        </a>
                    )}
                </div>
            )}
            {items.length > 1 && (
                 <button 
                    onClick={handleAnalyzeParlay}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 text-xs bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent font-semibold mb-2 py-2 px-2 rounded"
                >
                    <LinkIcon className="w-4 h-4"/> AI Parlay Analysis
                </button>
            )}
            <button 
                onClick={handlePlaceBets} 
                disabled={totalStake === 0}
                className="w-full bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Place Bets {totalStake > 0 ? `($${Number(totalStake).toFixed(2)})` : ''}
            </button>
          </footer>
        )}
      </div>

      <button
        onClick={toggleSlip}
        className="fixed top-20 right-0 bg-brand-accent text-brand-primary py-3 pl-4 pr-3 rounded-l-full shadow-lg z-20 transition-transform hover:scale-105"
        aria-label="Open Bet Slip"
      >
        <TicketIcon className="w-7 h-7" />
        {items.length > 0 && (
          <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {reviewingBet && (
          <BetReviewModal
            bet={reviewingBet}
            analysis={reviewAnalysis}
            isLoading={isReviewing}
            onClose={() => setReviewingBet(null)}
           />
      )}
    </>
  );
};