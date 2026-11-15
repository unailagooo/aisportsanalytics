import React from 'react';
import type { LiveMatch } from '../types';
import { DefaultTeamIcon, LiveIcon } from './IconComponents';

interface LiveMatchCardProps {
    match: LiveMatch;
    onSelect: (match: LiveMatch) => void;
}

const TeamLogo: React.FC<{ logo?: string, teamName: string, className?: string }> = ({ logo, teamName, className }) => {
  const [imgError, setImgError] = React.useState(false);
  
  if (logo && !imgError) {
    return <img src={logo} alt={`${teamName} logo`} className={className} onError={() => setImgError(true)} />;
  }
  return <DefaultTeamIcon className={className} />;
};


export const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onSelect }) => {
    return (
        <div className="bg-brand-secondary rounded-lg shadow-lg border border-gray-700 hover:border-red-500/70 transition-all duration-300">
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-2/5">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <TeamLogo logo={match.teamALogo} teamName={match.teamA} className="w-8 h-8 object-contain" />
                        <span className="text-sm font-semibold text-white truncate">{match.teamA}</span>
                    </div>
                    <div className="text-center flex-shrink-0">
                        <span className="text-3xl font-bold text-white">{match.scoreA} - {match.scoreB}</span>
                        <p className="text-xs font-mono text-brand-text-secondary">{match.minute}'</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <TeamLogo logo={match.teamBLogo} teamName={match.teamB} className="w-8 h-8 object-contain" />
                        <span className="text-sm font-semibold text-white truncate">{match.teamB}</span>
                    </div>
                </div>
                <div className="hidden md:block border-l border-gray-700 h-16"></div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <p className="text-sm font-bold text-white">{match.league}</p>
                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                        <LiveIcon className="w-4 h-4" />
                        <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        LIVE
                    </div>
                </div>
                 <button
                    onClick={() => onSelect(match)}
                    className="w-full md:w-auto mt-2 md:mt-0 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded transition-colors"
                >
                    Analyze Live
                </button>
            </div>
        </div>
    );
};
