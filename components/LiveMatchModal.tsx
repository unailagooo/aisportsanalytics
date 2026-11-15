
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveMatch, LiveInsight, LiveMatchEvent, QuantumVectorAnalysis } from '../types';
import { getLiveInsight } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { DefaultTeamIcon, BrainCircuitIcon, RefreshIcon, DollarSignIcon, WarningIcon, ChartLineIcon } from './IconComponents';
import { MatchTimeline } from './MatchTimeline';

interface LiveMatchModalProps {
  match: LiveMatch;
  onClose: () => void;
}

const TeamLogo: React.FC<{ logo?: string, teamName: string, className?: string }> = ({ logo, teamName, className }) => {
  const [imgError, setImgError] = useState(false);
  if (logo && !imgError) {
    return <img src={logo} alt={`${teamName} logo`} className={className} onError={() => setImgError(true)} />;
  }
  return <DefaultTeamIcon className={className} />;
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
        <div className="space-y-3 text-sm">
            {sections.map(section => {
                if (!section.content) return null;
                const Icon = section.icon;
                return (
                    <div key={section.title} className="bg-gray-800/50 p-3 rounded-lg">
                        <h4 className={`font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 ${section.color}`}>
                            <Icon className="w-4 h-4" />
                            {section.title}
                        </h4>
                        <p className="text-brand-text-secondary leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                );
            })}
        </div>
    );
};


const INSIGHT_REFRESH_INTERVAL_MS = 30000; // 30 seconds

export const LiveMatchModal: React.FC<LiveMatchModalProps> = ({ match, onClose }) => {
  const [timelineData, setTimelineData] = useState<{ events: LiveMatchEvent[], insight: LiveInsight | null }>({ events: [], insight: null });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchInsight = useCallback(async () => {
      if(isAiThinking) return;
      setIsAiThinking(true);
      try {
          const insight = await getLiveInsight(match);
          setTimelineData({ events: insight.events || [], insight });
      } catch (error) {
          const errorMessage: LiveInsight = {
              timestamp: Date.now(),
              structuredAnalysis: {
                vectorCuantitativo: "Error fetching analysis.",
                vectorMomentum: "Could not connect to the AI model.",
                vectorMercado: "N/A",
                simulacionEstres: "Please try refreshing the analysis.",
                veredictoCuantico: "Unable to provide a verdict due to an error."
              },
              events: timelineData.events,
          };
          setTimelineData(prev => ({ ...prev, insight: errorMessage }));
          console.error("Failed to fetch live insight:", error);
      } finally {
          setIsAiThinking(false);
      }
  }, [match, isAiThinking, timelineData.events]);

  useEffect(() => {
      fetchInsight();
      
      intervalRef.current = window.setInterval(fetchInsight, INSIGHT_REFRESH_INTERVAL_MS);

      return () => {
          if (intervalRef.current) {
              window.clearInterval(intervalRef.current);
          }
      };
  }, [fetchInsight]);


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-700 flex justify-between items-center relative">
           <div className="flex items-center gap-3">
              <TeamLogo logo={match.teamALogo} teamName={match.teamA} className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-white hidden sm:inline">{match.teamA}</span>
           </div>
           <div className="text-center">
              <p className="text-3xl font-bold text-white">{match.scoreA} - {match.scoreB}</p>
              <p className="font-mono text-red-500 animate-pulse">{match.minute}'</p>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white hidden sm:inline">{match.teamB}</span>
              <TeamLogo logo={match.teamBLogo} teamName={match.teamB} className="w-8 h-8 object-contain" />
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl absolute top-2 right-2">&times;</button>
        </header>

        <div className="flex-grow flex flex-col md:flex-row overflow-y-auto">
            <div className="p-4 md:w-1/2 md:border-r border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-brand-accent flex items-center gap-2">
                        <BrainCircuitIcon className="w-5 h-5"/> Latest AI Verdict
                    </h3>
                    <button 
                        onClick={fetchInsight} 
                        disabled={isAiThinking}
                        className="flex items-center gap-2 text-sm bg-brand-accent/20 text-brand-accent font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-accent/40 transition-colors disabled:opacity-50"
                    >
                        <RefreshIcon className={`w-4 h-4 ${isAiThinking ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                 {isAiThinking && !timelineData.insight && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
                 {timelineData.insight && (
                     <div className="animate-fade-in">
                        <StructuredAnalysisDisplay analysis={timelineData.insight.structuredAnalysis} />
                        {timelineData.insight.suggestedLiveBets && timelineData.insight.suggestedLiveBets.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {timelineData.insight.suggestedLiveBets.map((bet, idx) => (
                                    <div key={idx} className="text-xs bg-brand-accent/10 border-l-2 border-brand-accent p-2 rounded-r-md">
                                        <p className="font-bold text-brand-accent">Live Bet Suggestion:</p>
                                        <p><span className="font-semibold">{bet.outcomeName}</span> ({bet.marketName}) @{bet.odds.toFixed(2)}</p>
                                        <p className="italic text-brand-text-secondary mt-1">"{bet.justification}"</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 )}
            </div>

            <div className="p-4 md:w-1/2 flex flex-col">
                <h3 className="font-bold text-white mb-3 flex-shrink-0">Match Timeline</h3>
                {isAiThinking && timelineData.events.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center"><LoadingSpinner/></div>
                ) : (
                    <MatchTimeline events={timelineData.events} match={match} />
                )}
            </div>

        </div>
      </div>
    </div>
  );
};
