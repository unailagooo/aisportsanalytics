import React from 'react';

interface FiabilityGaugeProps {
    score: number;
    size?: 'small' | 'large';
}

export const FiabilityGauge: React.FC<FiabilityGaugeProps> = ({ score, size = 'large' }) => {
  const isSmall = size === 'small';
  const radius = isSmall ? 22 : 40;
  const strokeWidth = isSmall ? 5 : 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // We want a semi-circle, so we'll use half the circumference
  const semiCircumference = circumference / 2;
  const strokeDashoffset = semiCircumference - (score / 100) * semiCircumference;

  const getColor = () => {
    if (score > 75) return 'text-green-400';
    if (score > 50) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const color = getColor();

  return (
    <div className={`relative ${isSmall ? 'w-16 h-8' : 'w-24 h-12'}`} title={`Fiability Score: ${score}/100`}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${radius * 2} ${radius}`}
      >
        {/* Background Arc */}
        <path
          d={`M ${strokeWidth},${radius} a ${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius * 2},0`}
          className="text-gray-600"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Foreground Arc */}
        <path
          d={`M ${strokeWidth},${radius} a ${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius * 2},0`}
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={semiCircumference + ' ' + semiCircumference}
          strokeDashoffset={strokeDashoffset}
          stroke="currentColor"
          fill="transparent"
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute bottom-0 w-full text-center ${isSmall ? 'text-xs -mb-1' : 'text-sm'}`}>
        <span className={`font-bold ${color}`}>{score}</span>
        <span className="text-brand-text-secondary">/100</span>
      </div>
    </div>
  );
};
