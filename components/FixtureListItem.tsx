
import React, { useState } from 'react';
import type { Fixture } from '../types';
import { Sport as SportEnum } from '../types';
import { DefaultTeamIcon } from './IconComponents';

interface FixtureListItemProps {
  fixture: Fixture;
  onSelect: (fixture: Fixture) => void;
}

const formatDate = (isoString: string) => {
  if (!isoString) return { date: "Próximamente", time: "Horario TBD" };
  try {
    const date = new Date(isoString);
    // Verificación de fecha inválida (NaN)
    if (isNaN(date.getTime())) {
        // Intenta parsear si viene como string simple "2025-01-20"
        const parts = isoString.split('T');
        if (parts.length > 0) return { date: parts[0], time: parts[1] ? parts[1].substring(0, 5) : "--:--" };
        return { date: "TBD", time: "TBD" };
    }
    return {
      date: date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
  } catch (error) {
    return { date: 'Pendiente', time: '' };
  }
};

const TeamLogo: React.FC<{ logo?: string, teamName: string }> = ({ logo, teamName }) => {
  const [imgError, setImgError] = useState(false);
  
  if (logo && !imgError) {
    return (
      <img 
        src={logo} 
        alt={`${teamName} logo`} 
        className="w-6 h-6 object-contain"
        onError={() => setImgError(true)} 
      />
    );
  }
  return <DefaultTeamIcon className="w-6 h-6 text-gray-600" />;
};

export const FixtureListItem = React.forwardRef<HTMLTableRowElement, FixtureListItemProps>(
  ({ fixture, onSelect }, ref) => {
    const { date, time } = formatDate(fixture.matchDateTime);
    
    const teamA = fixture.teamA || 'Equipo Desconocido';
    const teamB = fixture.teamB || 'Equipo Desconocido';
    const league = fixture.league || 'Liga No Especificada';

    return (
      <tr 
        ref={ref} 
        className="bg-brand-secondary hover:bg-gray-800/60 border-b border-gray-700 transition-colors animate-fade-in"
        style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
      >
        <td className="px-6 py-4">
          <div className="font-medium text-white">{date}</div>
          <div className="text-xs text-brand-text-secondary">{time}</div>
        </td>
        <td className="px-6 py-4">
           {fixture.sport === SportEnum.Formula1 ? (
                <div className="flex items-center gap-3">
                    <TeamLogo logo={fixture.teamALogo} teamName={teamA} />
                    <div>
                        <span className="font-bold text-white">{teamA}</span>
                        <div className="text-xs text-brand-text-secondary">{teamB}</div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <TeamLogo logo={fixture.teamALogo} teamName={teamA} />
                        <span className="font-bold text-white">{teamA}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <TeamLogo logo={fixture.teamBLogo} teamName={teamB} />
                        <span className="font-bold text-white">{teamB}</span>
                    </div>
                </div>
            )}
            <div className="text-xs text-brand-text-secondary md:hidden mt-2">{league}</div>
        </td>
        <td className="px-6 py-4 hidden md:table-cell">
          <span className="bg-gray-800 px-2 py-1 rounded text-xs text-brand-text-secondary">{league}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <button
            onClick={() => onSelect(fixture)}
            className="font-bold text-brand-accent hover:text-brand-accent-dark transition-colors duration-200 border border-brand-accent/20 px-4 py-1.5 rounded-lg bg-brand-accent/5 hover:bg-brand-accent/10"
          >
            Analizar
          </button>
        </td>
      </tr>
    );
  }
);
