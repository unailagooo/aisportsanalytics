import React from 'react';

interface RadarChartProps {
    data: { [key: string]: number };
}

// A more descriptive mapping for labels
const labelMapping: { [key: string]: string } = {
    cuantitativo: 'QUANT',
    momentum: 'MOMENTUM',
    mercado: 'MARKET',
    simulacionEstres: 'STRESS',
};

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
    const labels = Object.keys(data).filter(key => labelMapping[key]);
    if (labels.length < 3) return null; // Need at least 3 points

    const width = 120;
    const height = 120;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    const numAxes = labels.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    // Generate points for the polygon
    const points = labels.map((key, i) => {
        const value = (data[key] / 100) * radius;
        const x = centerX + value * Math.cos(angleSlice * i - Math.PI / 2);
        const y = centerY + value * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    // Generate lines for the axes and labels
    const axes = labels.map((key, i) => {
        const x1 = centerX;
        const y1 = centerY;
        const x2 = centerX + radius * Math.cos(angleSlice * i - Math.PI / 2);
        const y2 = centerY + radius * Math.sin(angleSlice * i - Math.PI / 2);
        const labelX = centerX + (radius + 15) * Math.cos(angleSlice * i - Math.PI / 2);
        const labelY = centerY + (radius + 15) * Math.sin(angleSlice * i - Math.PI / 2);
        return {
            line: { x1, y1, x2, y2 },
            label: { x: labelX, y: labelY, text: labelMapping[key] }
        };
    });

    return (
        <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
                <g>
                    {/* Concentric circles (grid) */}
                    {[0.25, 0.5, 0.75, 1].map(r => (
                        <circle
                            key={r}
                            cx={centerX}
                            cy={centerY}
                            r={radius * r}
                            fill="none"
                            stroke="#4A5568"
                            strokeWidth="0.5"
                        />
                    ))}

                    {/* Axes and Labels */}
                    {axes.map(({ line, label }, i) => (
                        <g key={i}>
                            <line {...line} stroke="#4A5568" strokeWidth="0.5" />
                            <text
                                x={label.x}
                                y={label.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#A0AEC0"
                                fontSize="10"
                                fontWeight="bold"
                            >
                                {label.text}
                            </text>
                        </g>
                    ))}

                    {/* Data Polygon */}
                    <polygon
                        points={points}
                        fill="rgba(0, 245, 160, 0.4)"
                        stroke="#00F5A0"
                        strokeWidth="1.5"
                    />
                </g>
            </svg>
            <p className="text-xs text-brand-text-secondary -mt-2">Vector Influence</p>
        </div>
    );
};
