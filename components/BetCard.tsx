
import React from 'react';
import type { AIAnalysisBet, BetSlipItem, Sport, QuantumVectorAnalysis } from '../types';
import { Sport as SportEnum } from '../types';
import { FiabilityGauge } from './FiabilityGauge';
import { FootballIcon, BasketballIcon, TennisIcon, AmericanFootballIcon, BaseballIcon, IceHockeyIcon, EsportsIcon, Formula1Icon, BrainCircuitIcon, DollarSignIcon, WarningIcon, ChartLineIcon, RefreshIcon } from './IconComponents';

interface BetCardProps {
    bet: AIAnalysisBet;
    onToggleBet: (item: BetSlipItem) => void;
    betSlip: BetSlipItem[];
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

const formatDate = (isoString: string) => {
  if (!isoString) return 'Date TBD';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Date TBD";
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Date TBD';
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
        <div className="text-sm text-brand-text-secondary leading-relaxed space-y-3 mt-2">
            {sections.map((section) => {
                if (!section.content) return null;
                 const Icon = section.icon;
                return (
                    <div key={section.title}>
                        <p className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${section.color}`}>
                           <Icon className="w-3.5 h-3.5" /> {section.title}
                        </p>
                        <p className="pl-2 border-l-2 border-brand-accent/30 text-xs mt-1 whitespace-pre-line">{section.content.replace(/^- /gm, '• ')}</p>
                    </div>
                );
            })}
        </div>
    );
};


export const BetCard: React.FC<BetCardProps> = ({ bet, onToggleBet, betSlip }) => {
    const matchIdentifier = `${bet.teamA || 'Team A'} vs ${bet.teamB || 'Team B'}`;

    const isInSlip = betSlip.some(item => 
        item.matchIdentifier === matchIdentifier &&
        item.marketName === bet.marketName &&
        item.outcomeName === bet.outcomeName
    );

    const handleToggle = () => {
        onToggleBet({
            matchIdentifier: matchIdentifier,
            marketName: bet.marketName,
            outcomeName: bet.outcomeName,
            odds: Number(bet.odds || 0),
            fiabilityScore: bet.fiabilityScore,
            matchDateTime: bet.matchDateTime,
            sport: bet.sport,
        });
    };

    return (
        <div className="bg-brand-secondary rounded-lg shadow-lg p-4 flex flex-col justify-between border border-gray-700 hover:border-brand-accent/70 transition-colors duration-300">
            <div>
                <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                         <div className="flex items-center gap-2">
                            {bet.sport && <SportIcon sport={bet.sport} className="w-4 h-4 text-brand-text-secondary flex-shrink-0" />}
                            <p className="text-xs text-brand-text-secondary truncate">{bet.league || 'Unknown League'}</p>
                        </div>
                        <p className="font-bold text-lg text-white leading-tight truncate">{bet.teamA || 'Unknown'} vs {bet.teamB || 'Unknown'}</p>
                         <p className="text-xs text-brand-text-secondary mt-1">{formatDate(bet.matchDateTime)}</p>
                    </div>
                    <FiabilityGauge score={bet.fiabilityScore} size="small" />
                </div>
                
                <div className="bg-gray-800/50 rounded-md p-3 my-3 text-center">
                    <p className="text-brand-accent font-bold text-xl">{bet.outcomeName}</p>
                    <p className="text-xs text-brand-text-secondary mb-1">({bet.marketName})</p>
                    <p className="font-mono text-lg font-bold text-white bg-brand-accent/20 px-3 py-1 rounded-md inline-block">@{(Number(bet.odds) || 0).toFixed(2)}</p>
                </div>
                <StructuredAnalysisDisplay analysis={bet.justification} />
            </div>
            <div className="mt-4">
                <button 
                    onClick={handleToggle}
                    className={`w-full font-bold py-2 px-4 rounded transition-colors ${
                        isInSlip 
                        ? 'bg-red-800/70 hover:bg-red-700 text-white' 
                        : 'bg-brand-accent/80 hover:bg-brand-accent text-brand-primary'
                    }`}
                >
                    {isInSlip ? 'Remove from Slip' : 'Add to Slip'}
                </button>
            </div>
        </div>
    );
};
