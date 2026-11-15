import React, { useState } from 'react';
import { SearchIcon } from './IconComponents';

interface DateRangeFilterProps {
    onSearch: (range: { startDate: string; endDate: string }) => void;
    isLoading: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onSearch, isLoading }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSearch = () => {
        if (startDate && endDate) {
            onSearch({ startDate, endDate });
        }
    };
    
    // Set default start date to today when component mounts
    React.useEffect(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setStartDate(today);
        setEndDate(nextWeek.toISOString().split('T')[0]);
    }, [today]);

    return (
        <div className="flex items-center gap-2 bg-brand-secondary p-2 rounded-lg">
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="bg-gray-800 border border-gray-600 rounded-md py-1 px-2 text-sm text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                aria-label="Start Date"
            />
            <span className="text-brand-text-secondary">-</span>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="bg-gray-800 border border-gray-600 rounded-md py-1 px-2 text-sm text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                aria-label="End Date"
                disabled={!startDate}
            />
            <button
                onClick={handleSearch}
                disabled={isLoading || !startDate || !endDate}
                className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Search by date range"
            >
                <SearchIcon className="w-4 h-4" />
            </button>
        </div>
    );
};
