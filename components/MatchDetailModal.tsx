
import React, { useState, useEffect, useCallback } from 'react';
import type { MatchPrediction, BetSlipItem, Fixture, BetAnalysis, ScenarioAnalysis, QuantumVectorAnalysis, MatchSpecificBet } from '../types';
import { Sport as SportEnum } from '../types';
import { getPredictionForFixture, getBetAnalysis, getScenarioPrediction, getCustomBetAnalysis } from '../services/geminiService';
import { FiabilityGauge } from './FiabilityGauge';
import { DefaultTeamIcon, ShieldCheckIcon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon, TestTubeIcon, UsersIcon } from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { BetAnalysisModal } from './BetAnalysisModal';
import { ComparisonToolbar } from './ComparisonToolbar';
import { ComparisonModal } from './ComparisonModal';
import { RadarChart } from './RadarChart';

interface MatchDetailModalProps {
  fixture: Fixture;
  onClose: () => void;
  onToggleBet: (item: BetSlipItem) => void;
  betSlip: BetSlipItem[];
  onPredictionLoaded: (prediction: MatchPrediction) => void;
}

const TeamLogo: React.FC<{ logo?: string, teamName: string, className?: string }> = ({ logo, teamName, className }) => {
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [logo]);

  if (logo && !imgError) {
    return (
      <img 
        src={logo} 
        alt={`${teamName} logo`} 
        className={className} 
        onError={() => setImgError(true)} 
      />
    );
  }
  return <DefaultTeamIcon className={className} />;
};

const StructuredAnalysisDisplay: React.FC<{ analysis?: QuantumVectorAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;

    const sections: { title: string; content: string; key: keyof QuantumVectorAnalysis; icon: React.FC<{className?: string}>; color: string }[] = [
        { title: 'VECTOR CUANTITATIVO', content: analysis.vectorCuantitativo, key: 'vectorCuantitativo', icon: ChartLineIcon, color: 'text-blue-400' },
        { title: 'VECTOR DE MOMENTUM', content: analysis.vectorMomentum, key: 'vectorMomentum', icon: RefreshIcon, color: 'text-purple-400' },
        { title: 'VECTOR DE MERCADO', content: analysis.vectorMercado, key: 'vectorMercado', icon: DollarSignIcon, color: 'text-yellow-400' },
        { title: 'SIMULACIÓN DE ESTRÉS', content: analysis.simulacionEstres, key: 'simulacionEstres', icon: WarningIcon, color: 'text-red-400' },
        { title: 'VEREDICTO CUÁNTICO', content: analysis.veredictoCuantico, key: 'veredictoCuantico', icon: BrainCircuitIcon, color: 'text-brand-accent' },
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

const getHostnameFromUri = (uri: string): string => {
    if (!uri) {
        return 'Source';
    }
    try {
        const fullUrl = uri.startsWith('http://') || uri.startsWith('https://') ? uri : `https://${uri}`;
        return new URL(fullUrl).hostname;
    } catch (e) {
        return uri;
    }
};

const MatchBetCard: React.FC<{
  bet: MatchSpecificBet;
  fixture: Fixture;
  onToggleBet: (item: BetSlipItem) => void;
  isOutcomeInSlip: (marketName: string, outcomeName: string) => boolean;
}> = ({ bet, fixture, onToggleBet, isOutcomeInSlip }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { marketName, outcomeName, odds, fiabilityScore, justification } = bet;
  const teamA = fixture.teamA || 'Local';
  const teamB = fixture.teamB || 'Visitante';
  const matchIdentifier = fixture.sport === SportEnum.Formula1 ? teamA : `${teamA} vs ${teamB}`;
  const isSelected = isOutcomeInSlip(marketName, outcomeName);
  
  const handleToggle = () => {
    onToggleBet({
      matchIdentifier,
      marketName,
      outcomeName,
      odds: Number(odds || 0),
      fiabilityScore,
      matchDateTime: fixture.matchDateTime,
      sport: fixture.sport,
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-grow min-w-0">
          <p className="font-bold text-white truncate">{outcomeName}</p>
          <p className="text-xs text-brand-text-secondary truncate">{marketName}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono font-bold text-lg text-white">@{(Number(odds) || 0).toFixed(2)}</span>
          <FiabilityGauge score={fiabilityScore} size="small" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleToggle}
          className={`w-full font-bold py-2 px-3 text-sm rounded transition-colors ${
            isSelected 
            ? 'bg-red-800/70 hover:bg-red-700 text-white' 
            : 'bg-brand-accent/80 hover:bg-brand-accent text-brand-primary'
          }`}
        >
          {isSelected ? 'Remove from Slip' : 'Add to Slip'}
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-blue-600/50 hover:bg-blue-600/80 text-white font-semibold py-2 px-3 text-sm rounded transition-colors flex items-center justify-center gap-2"
        >
         <BrainCircuitIcon className="w-4 h-4"/> {isExpanded ? 'Hide' : 'Analyze'}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 animate-fade-in">
          <StructuredAnalysisDisplay analysis={justification} />
        </div>
      )}
    </div>
  );
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ fixture, onClose, onToggleBet, betSlip, onPredictionLoaded }) => {
  const [match, setMatch] = useState<MatchPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');

  const [scenarioAnalysis, setScenarioAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  const [customAnalysis, setCustomAnalysis] = useState<BetAnalysis | null>(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      setIsLoading(true);
      setError(null);
      setCustomAnalysis(null); 
      setScenarioAnalysis(null); 
      try {
        const prediction = await getPredictionForFixture(fixture);
        if (prediction.error) {
            setError(prediction.error);
            setMatch(null);
        } else {
            setMatch(prediction);
            onPredictionLoaded(prediction);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load detailed AI analysis for this match.";
        setError(message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrediction();
  }, [fixture, onPredictionLoaded]);
  
  const handleSimulateScenario = async (scenario: string) => {
    if (isSimulating || !match?.mainPrediction) return;
    setIsSimulating(true);
    setScenarioAnalysis(null);
    try {
        const result = await getScenarioPrediction(fixture, scenario);
        setScenarioAnalysis(result);
    } catch (err) {
        setScenarioAnalysis({
            scenario,
            newFiabilityScore: 0,
            analysis: "Failed to simulate this scenario. Please try again."
        });
    } finally {
        setIsSimulating(false);
    }
  };

  const handleAnalyzeCustomBet = async (prediction: string) => {
      if (isAnalyzingCustom) return;
      setIsAnalyzingCustom(true);
      setCustomAnalysis(null);
      try {
          const result = await getCustomBetAnalysis(fixture, prediction);
          setCustomAnalysis(result);
      } catch (err) {
          console.error("Failed to get custom bet analysis", err);
          const errorAnalysis: BetAnalysis = {
              structuredAnalysis: {
                vectorCuantitativo: "Error",
                vectorMomentum: "Error",
                vectorMercado: "Error",
                simulacionEstres: "Error",
                veredictoCuantico: "No se pudo analizar el pronóstico. Por favor, inténtalo de nuevo."
              },
              fiabilityScore: 0
          };
          setCustomAnalysis(errorAnalysis);
      } finally {
          setIsAnalyzingCustom(false);
      }
  };

  const teamA = fixture.teamA || 'Local';
  const teamB = fixture.teamB || 'Visitante';
  const matchIdentifier = fixture.sport === SportEnum.Formula1 ? teamA : `${teamA} vs ${teamB}`;

  const isOutcomeInSlip = (marketName: string, outcomeName: string) => {
    return betSlip.some(item => 
      item.matchIdentifier === matchIdentifier && 
      item.marketName === marketName && 
      item.outcomeName === outcomeName
    );
  };

  const renderAnalysisTab = () => (
    <div className="p-6 space-y-8">
        <div>
            <h3 className="text-xl font-bold text-brand-accent mb-3 flex items-center gap-2">
                <BrainCircuitIcon className="w-6 h-6" /> AI Main Prediction
            </h3>
            {match?.mainPrediction ? (
                <div className="bg-brand-secondary/50 rounded-lg p-4 border border-brand-accent/50">
                    <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                            <p className="text-2xl font-bold text-white truncate" title={match.mainPrediction.outcomeName}>{match.mainPrediction.outcomeName}</p>
                            <p className="text-sm text-brand-text-secondary truncate">{match.mainPrediction.marketName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-mono text-3xl font-bold text-brand-accent">@{(Number(match.mainPrediction.odds) || 0).toFixed(2)}</p>
                            <p className="text-xs text-brand-text-secondary -mt-1">Fiability Score</p>
                        </div>
                    </div>
                    <div className="flex justify-center items-center my-3 gap-8">
                        <FiabilityGauge score={scenarioAnalysis ? scenarioAnalysis.newFiabilityScore : match.mainPrediction.fiabilityScore} size="large" />
                        {match.mainPrediction.vectorInfluence && (
                        <RadarChart data={match.mainPrediction.vectorInfluence} />
                        )}
                    </div>
                    <button 
                    onClick={() => onToggleBet({ matchIdentifier, marketName: match.mainPrediction.marketName, outcomeName: match.mainPrediction.outcomeName, odds: Number(match.mainPrediction.odds) || 0, fiabilityScore: match.mainPrediction.fiabilityScore, matchDateTime: match.matchDateTime, sport: fixture.sport })}
                    className={`w-full font-bold py-2 px-4 rounded transition-colors text-sm ${
                        isOutcomeInSlip(match.mainPrediction.marketName, match.mainPrediction.outcomeName)
                        ? 'bg-red-800/70 hover:bg-red-700 text-white' 
                        : 'bg-brand-accent/80 hover:bg-brand-accent text-brand-primary'
                    }`}
                    >
                        {isOutcomeInSlip(match.mainPrediction.marketName, match.mainPrediction.outcomeName) ? 'Remove from Slip' : 'Add to Slip'}
                    </button>
                    {scenarioAnalysis && (
                    <div className="w-full bg-blue-900/20 p-3 rounded-lg text-xs animate-fade-in mt-4">
                        <p className="font-bold text-blue-400">Scenario: {scenarioAnalysis.scenario}</p>
                        <p className="text-brand-text-secondary italic mt-1">"{scenarioAnalysis.analysis}"</p>
                    </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <StructuredAnalysisDisplay analysis={match.mainPrediction.justification} />
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-gray-800 rounded-lg text-center text-brand-text-secondary">
                    Analysis unavailable for main market.
                </div>
            )}
        </div>

        {(match.safestBets?.length > 0 || match.valueBets?.length > 0 || match.highRiskBets?.length > 0) && (
            <div className="space-y-6">
                {[
                    { title: 'Safest Bets', bets: match.safestBets, icon: ShieldCheckIcon, color: 'text-green-400' },
                    { title: 'Value Bets', bets: match.valueBets, icon: DollarSignIcon, color: 'text-yellow-400' },
                    { title: 'High-Risk Bets', bets: match.highRiskBets, icon: TestTubeIcon, color: 'text-purple-400' }
                ].map(({ title, bets, icon: Icon, color }) => (
                    (bets && bets.length > 0) && (
                        <div key={title}>
                            <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${color}`}>
                                <Icon className="w-6 h-6" /> {title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bets.map((bet, index) => (
                                    <MatchBetCard 
                                        key={index}
                                        bet={bet}
                                        fixture={fixture}
                                        onToggleBet={onToggleBet}
                                        isOutcomeInSlip={isOutcomeInSlip}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        )}
        
        <ComparisonToolbar
            onSimulateScenario={handleSimulateScenario}
            isSimulating={isSimulating}
            onOpenPlayerComparison={() => setComparisonModalOpen(true)}
            onAnalyzeCustomBet={handleAnalyzeCustomBet}
            isAnalyzingCustom={isAnalyzingCustom}
        />
        
        {isAnalyzingCustom && (
            <div className="flex flex-col items-center justify-center">
                <LoadingSpinner />
                <p className="mt-4 text-brand-accent animate-pulse-fast">AI está analizando tu pronóstico...</p>
            </div>
        )}

        {customAnalysis && !isAnalyzingCustom && (
            <div className="animate-fade-in mt-4">
                <h3 className="text-xl font-bold text-brand-accent mb-3 flex items-center gap-2">
                    <BrainCircuitIcon className="w-6 h-6" /> Análisis de tu Pronóstico
                </h3>
                <div className="bg-brand-secondary/50 rounded-lg p-4 border border-brand-accent/50">
                     {/* New Header for Pick Details */}
                     <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-4">
                        <div>
                            <p className="text-xl font-bold text-white">{customAnalysis.outcomeName || 'Pronóstico'}</p>
                            <p className="text-sm text-brand-text-secondary">{customAnalysis.marketName || 'Personalizado'}</p>
                        </div>
                        <div className="text-right">
                             <span className="font-mono text-2xl font-bold text-brand-accent">
                                @{(Number(customAnalysis.odds) || 0).toFixed(2)}
                             </span>
                        </div>
                     </div>

                     <div className="flex justify-center mb-3">
                        <FiabilityGauge score={customAnalysis.fiabilityScore} size="large" />
                    </div>
                     <StructuredAnalysisDisplay analysis={customAnalysis.structuredAnalysis} />
                </div>
            </div>
        )}

        {match.expertConsensus && (
            <div>
                <h3 className="font-semibold text-white mb-2 text-lg flex items-center gap-2"><UsersIcon className="w-6 h-6 text-brand-accent" /> Expert Consensus</h3>
                <p className="text-sm text-brand-text-secondary bg-gray-800/50 p-3 rounded-lg italic">"{match.expertConsensus}"</p>
            </div>
        )}

        {match.historicalStats && (
             <div>
               <h3 className="font-semibold text-white mb-4 text-lg flex items-center gap-2"><ShieldCheckIcon className="w-6 h-6 text-brand-accent" /> Historical Data & Form</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded-lg"><h4 className="font-bold text-brand-text-secondary mb-1">Head-to-Head</h4><p className="text-white font-mono">{match.historicalStats.headToHead}</p></div>
                  <div className="bg-gray-800/50 p-3 rounded-lg"><h4 className="font-bold text-brand-text-secondary mb-1">{teamA} Form</h4><p className="text-white font-mono">{match.historicalStats.recentFormA}</p></div>
                  <div className="bg-gray-800/50 p-3 rounded-lg"><h4 className="font-bold text-brand-text-secondary mb-1">{teamB} Form</h4><p className="text-white font-mono">{match.historicalStats.recentFormB}</p></div>
               </div>
            </div>
        )}

    </div>
  );

  const renderAllMarketsTab = () => (
    <div className="p-6">
        <h3 className="font-semibold text-white mb-4 text-lg">All Available Markets</h3>
        <div className="space-y-4">
            {Array.isArray(match.markets) && match.markets.length > 0 ? match.markets.map((market, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-brand-text p-3 border-b border-gray-700">{market.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
                {(market.outcomes || []).map((outcome, oIndex) => {
                    const isSelected = isOutcomeInSlip(market.name, outcome.name);
                    return (
                    <div key={oIndex} className="relative group">
                        <button 
                            onClick={() => onToggleBet({ matchIdentifier, marketName: market.name, outcomeName: outcome.name, odds: Number(outcome.odds) || 0, fiabilityScore: 50, matchDateTime: match.matchDateTime, sport: fixture.sport })}
                            className={`w-full flex justify-between items-center p-2 rounded transition-colors ${isSelected ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700/50 hover:bg-gray-600/80'}`}>
                            <span className="text-sm truncate pr-2">{outcome.name}</span>
                            <div className="flex flex-col items-end flex-shrink-0">
                                <span className="font-mono font-bold text-md leading-none">{(Number(outcome.odds) || 0).toFixed(2)}</span>
                                {outcome.bookmaker && <span className="text-xs text-brand-accent/70 leading-none truncate">{outcome.bookmaker}</span>}
                            </div>
                        </button>
                    </div>
                    )
                })}
                </div>
            </div>
            )) : <p className="text-sm text-center text-brand-text-secondary p-4">No other markets available for this match.</p>}
        </div>
        <p className="text-xs text-center text-brand-text-secondary mt-4">Odds are retrieved from public sources and are for informational purposes only.</p>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <LoadingSpinner />
          <p className="mt-4 text-brand-accent animate-pulse-fast">AI is generating detailed analysis...</p>
        </div>
      );
    }

    if (error || !match) {
      return <div className="text-center text-red-400 p-8">{error || 'Match data could not be loaded.'}</div>;
    }

    return (
        <div className="flex-grow overflow-y-auto">
            {activeTab === 'analysis' && renderAnalysisTab()}
            {activeTab === 'markets' && renderAllMarketsTab()}
            
            {match.sources && match.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-700 p-6">
                    <h4 className="font-semibold text-white mb-3 text-sm">Data Sources:</h4>
                    <ul className="space-y-2">
                        {match.sources.slice(0, 3).map((source, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-brand-accent mr-2 mt-1">&#8227;</span>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-text-secondary hover:text-brand-accent underline truncate" title={source.title || source.uri}>
                                {source.title || getHostnameFromUri(source.uri)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-brand-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-gray-700 flex justify-between items-start gap-4">
          <div className="flex items-center gap-4 min-w-0">
                <TeamLogo logo={match?.teamALogo || fixture.teamALogo} teamName={teamA} className="w-10 h-10 object-contain flex-shrink-0" />
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-white truncate" title={matchIdentifier}>
                        {matchIdentifier}
                    </h2>
                    <p className="text-sm text-brand-text-secondary mt-1">{fixture.league || 'Evento'}</p>
                </div>
                 {fixture.sport !== SportEnum.Formula1 && <TeamLogo logo={match?.teamBLogo || fixture.teamBLogo} teamName={teamB} className="w-10 h-10 object-contain flex-shrink-0" />}
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl flex-shrink-0">&times;</button>
        </header>
        
        <div className="border-b border-gray-700 flex-shrink-0">
            <nav className="flex gap-4 px-6">
                 <button onClick={() => setActiveTab('analysis')} className={`py-3 text-sm font-semibold transition-colors ${activeTab === 'analysis' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary hover:text-white'}`}>AI Analysis</button>
                 <button onClick={() => setActiveTab('markets')} className={`py-3 text-sm font-semibold transition-colors ${activeTab === 'markets' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary hover:text-white'}`}>All Markets</button>
            </nav>
        </div>

        {renderContent()}
      </div>

      {comparisonModalOpen && match?.keyPlayers && (
          <ComparisonModal 
            fixture={fixture}
            playersA={match.keyPlayers.teamA}
            playersB={match.keyPlayers.teamB}
            onClose={() => setComparisonModalOpen(false)}
          />
      )}
    </div>
  );
};
