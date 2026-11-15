import React from 'react';
import type { LiveMatch, LiveMatchEvent } from '../types';
import { FootballIcon, CardIcon, SubstitutionIcon, VarIcon } from './IconComponents';

interface MatchTimelineProps {
  events: LiveMatchEvent[];
  match: LiveMatch;
}

const EventIcon: React.FC<{ event: LiveMatchEvent['event']; team: LiveMatchEvent['team'] }> = ({ event, team }) => {
    const baseClass = "w-4 h-4";
    switch (event) {
        case 'GOAL':
            return <FootballIcon className={`${baseClass} text-brand-accent`} />;
        case 'YELLOW_CARD':
            return <CardIcon className={`${baseClass} text-yellow-400`} />;
        case 'RED_CARD':
            return <CardIcon className={`${baseClass} text-red-500`} />;
        case 'SUBSTITUTION':
            return <SubstitutionIcon className={`${baseClass} text-blue-400`} />;
        case 'VAR_CHECK':
            return <VarIcon className={`${baseClass} text-purple-400`} />;
        default:
            return null;
    }
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ events, match }) => {
    const timelineDuration = 95; // 90 mins + 5 mins buffer for styling

    if (!events || events.length === 0) {
        return <div className="h-24 flex items-center justify-center text-sm text-brand-text-secondary">No key events recorded yet.</div>;
    }

    const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

    return (
        <div className="w-full overflow-x-auto overflow-y-hidden py-4">
            <div className="relative h-24" style={{ width: `${timelineDuration}%`, minWidth: '100%'}}>
                {/* Mid-line and minute markers */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600 -translate-y-1/2"></div>
                {['0', '15', '30', '45', '60', '75', '90'].map(min => (
                    <div key={min} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${(parseInt(min) / timelineDuration) * 100}%`}}>
                        <div className="w-px h-2 bg-gray-500"></div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-400">{min}'</span>
                    </div>
                ))}

                {/* Events */}
                {sortedEvents.map((event, index) => {
                    const position = (event.minute / timelineDuration) * 100;
                    const isTeamA = event.team === 'A';
                    const isNeutral = event.team === 'None';
                    const verticalPositionClass = isNeutral ? 'top-1/2 -translate-y-1/2' : (isTeamA ? 'bottom-1/2 mb-1' : 'top-1/2 mt-1');
                    
                    return (
                        <div 
                            key={`${event.minute}-${event.event}-${index}`}
                            className={`absolute group flex items-center gap-1 ${verticalPositionClass}`}
                            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                        >
                            <div className="flex items-center justify-center w-6 h-6 bg-brand-secondary rounded-full border-2 border-gray-600 z-10">
                                <EventIcon event={event.event} team={event.team} />
                            </div>

                            {/* Tooltip */}
                            <div className={`absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20
                                ${isTeamA || isNeutral ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                            >
                                <p className="font-bold">{event.minute}' - {event.team === 'A' ? match.teamA : event.team === 'B' ? match.teamB : ''} </p>
                                <p>{event.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};