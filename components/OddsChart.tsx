
import React from 'react';
import type { OddsMovementData } from '../types';

interface OddsChartProps {
    data: OddsMovementData[];
}

export const OddsChart: React.FC<OddsChartProps> = ({ data }) => {
    if (!data || data.length < 2) return <div className="text-sm text-center text-brand-text-secondary p-4 bg-gray-800/30 rounded">Not enough data to display chart.</div>;

    const width = 300;
    const height = 100;
    const padding = 20;

    const maxOdds = Math.max(...data.map(d => d.odds));
    const minOdds = Math.min(...data.map(d => d.odds));
    const startTime = new Date(data[0].timestamp).getTime();
    const endTime = new Date(data[data.length - 1].timestamp).getTime();
    const timeRange = endTime - startTime;
    const oddsRange = maxOdds - minOdds;

    const getX = (timestamp: string) => {
        const time = new Date(timestamp).getTime();
        if (timeRange === 0) return padding;
        return ((time - startTime) / timeRange) * (width - 2 * padding) + padding;
    };
    
    const getY = (odds: number) => {
        if(oddsRange === 0) return height - padding;
        return height - (((odds - minOdds) / oddsRange) * (height - 2 * padding) + padding);
    };

    const path = data.map((d, i) => {
        const x = getX(d.timestamp);
        const y = getY(d.odds);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-axis labels */}
                <text x="5" y={padding} dy="0.3em" fontSize="8" fill="#A0AEC0">{maxOdds.toFixed(2)}</text>
                <text x="5" y={height - padding} dy="0.3em" fontSize="8" fill="#A0AEC0">{minOdds.toFixed(2)}</text>
                
                {/* Path */}
                <path d={path} fill="none" stroke="#00F5A0" strokeWidth="2" />

                {/* Points */}
                {data.map((d, i) => (
                    <circle key={i} cx={getX(d.timestamp)} cy={getY(d.odds)} r="2" fill="#00F5A0" />
                ))}
            </svg>
            <div className="flex justify-between text-xs text-brand-text-secondary mt-1 px-1">
                 <span>{new Date(data[0].timestamp).toLocaleDateString('en-CA')}</span>
                 <span>{new Date(data[data.length - 1].timestamp).toLocaleDateString('en-CA')}</span>
            </div>
        </div>
    );
};
