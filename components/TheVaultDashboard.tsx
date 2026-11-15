
import React, { useState, useMemo } from 'react';
import type { UserProfile, CompletedBet } from '../types';
import { ChartLineIcon, DollarSignIcon, ShieldCheckIcon, RefreshIcon, TargetIcon } from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';

interface TheVaultDashboardProps {
    profile: UserProfile;
    onBack: () => void;
    onVerifyBets: (bets: CompletedBet[]) => void;
    isVerifying: boolean;
}

const StatCard: React.FC<{ label: string, value: string, icon: React.FC<{className?: string}>, color: string, subtext?: string }> = ({ label, value, icon: Icon, color, subtext }) => (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-gray-900 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-brand-text-secondary text-sm uppercase tracking-wider font-semibold">{label}</p>
            <p className="text-2xl font-bold text-white font-mono">{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
    </div>
);

export const TheVaultDashboard: React.FC<TheVaultDashboardProps> = ({ profile, onBack, onVerifyBets, isVerifying }) => {
    const { bankroll, betHistory } = profile;

    const stats = useMemo(() => {
        const completed = betHistory.filter(b => b.status === 'win' || b.status === 'loss');
        const pending = betHistory.filter(b => b.status === 'pending');
        const wins = completed.filter(b => b.status === 'win').length;
        const losses = completed.filter(b => b.status === 'loss').length;
        const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;
        
        const totalStaked = completed.reduce((acc, b) => acc + b.stake, 0);
        const totalReturned = completed.reduce((acc, b) => b.status === 'win' ? acc + b.potentialReturn : acc, 0);
        const netProfit = totalReturned - totalStaked;
        const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;

        return { wins, losses, winRate, netProfit, roi, pendingCount: pending.length, pending };
    }, [betHistory]);

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-lg">
                        <DollarSignIcon className="w-8 h-8 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">The Vault</h2>
                        <p className="text-brand-text-secondary">Financial Performance Center</p>
                    </div>
                </div>
                <button onClick={onBack} className="bg-brand-secondary hover:bg-gray-700 text-brand-text font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Back to Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    label="Total Bankroll" 
                    value={`$${bankroll.toFixed(2)}`} 
                    icon={DollarSignIcon} 
                    color="text-brand-accent" 
                    subtext="Available Funds"
                />
                <StatCard 
                    label="Net Profit" 
                    value={`${stats.netProfit >= 0 ? '+' : ''}$${stats.netProfit.toFixed(2)}`} 
                    icon={ChartLineIcon} 
                    color={stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} 
                    subtext={`ROI: ${stats.roi.toFixed(1)}%`}
                />
                <StatCard 
                    label="Win Rate" 
                    value={`${stats.winRate.toFixed(1)}%`} 
                    icon={TargetIcon} 
                    color={stats.winRate >= 50 ? 'text-blue-400' : 'text-yellow-400'} 
                    subtext={`${stats.wins}W - ${stats.losses}L`}
                />
                <StatCard 
                    label="Pending Action" 
                    value={`${stats.pendingCount}`} 
                    icon={ShieldCheckIcon} 
                    color="text-purple-400" 
                    subtext="Bets in play"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Bets / Verification Section */}
                <div className="lg:col-span-2 bg-brand-secondary rounded-xl p-6 border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Pending Bets Adjudication</h3>
                        <button 
                            onClick={() => onVerifyBets(stats.pending)}
                            disabled={isVerifying || stats.pendingCount === 0}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVerifying ? <LoadingSpinner /> : <><RefreshIcon className="w-5 h-5"/> Verify Results with AI</>}
                        </button>
                    </div>
                    
                    {stats.pendingCount === 0 ? (
                        <div className="text-center py-12 text-brand-text-secondary bg-gray-800/30 rounded-lg">
                            <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                            <p>No pending bets to verify.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.pending.map(bet => (
                                <div key={bet.id} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center border-l-4 border-yellow-500/50">
                                    <div>
                                        <p className="font-bold text-white">{bet.outcomeName} <span className="font-mono text-brand-accent">@{bet.odds.toFixed(2)}</span></p>
                                        <p className="text-sm text-brand-text-secondary">{bet.matchIdentifier}</p>
                                        <p className="text-xs text-gray-500">{new Date(bet.matchDateTime || '').toLocaleDateString()} - ${bet.stake} stake</p>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-wide">Pending</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent History (Brief) */}
                <div className="bg-brand-secondary rounded-xl p-6 border border-gray-700 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-3">
                        {betHistory.filter(b => b.status !== 'pending').slice(0, 5).map(bet => (
                            <div key={bet.id} className={`p-3 rounded-lg border-l-4 ${bet.status === 'win' ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-white truncate w-40">{bet.outcomeName}</p>
                                        <p className="text-xs text-brand-text-secondary truncate w-40">{bet.matchIdentifier}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold font-mono ${bet.status === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                            {bet.status === 'win' ? `+$${(bet.potentialReturn - bet.stake).toFixed(2)}` : `-$${bet.stake.toFixed(2)}`}
                                        </p>
                                        <p className="text-xs text-gray-500">{bet.status.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {betHistory.filter(b => b.status !== 'pending').length === 0 && (
                             <p className="text-center text-brand-text-secondary py-8 text-sm">No settled bets yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
