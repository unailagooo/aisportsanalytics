import React, { useRef, useCallback } from 'react';
import type { Fixture } from '../types';
import { FixtureListItem } from './FixtureListItem';
import { LoadingSpinner } from './LoadingSpinner';

interface FixtureListProps {
  fixtures: Fixture[];
  leagues: string[];
  selectedLeagues: string[];
  onSelectLeague: (leagues: string[]) => void;
  onSelectFixture: (fixture: Fixture) => void;
  onLoadMore: () => void;
  isLoading: boolean;
  hasMorePages: boolean;
}

export const FixtureList: React.FC<FixtureListProps> = ({ fixtures, leagues, selectedLeagues, onSelectLeague, onSelectFixture, onLoadMore, isLoading, hasMorePages }) => {
  
  const handleLeagueChange = (league: string) => {
    const safeLeagues = Array.isArray(selectedLeagues) ? selectedLeagues : [];
    onSelectLeague(
      safeLeagues.includes(league)
        ? safeLeagues.filter(l => l !== league)
        : [...safeLeagues, league]
    );
  };
    
  const observer = useRef<IntersectionObserver | null>(null);
  const lastFixtureElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMorePages) {
        onLoadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMorePages, onLoadMore]);

  const renderFooter = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center">
          <LoadingSpinner />
          <span className="mt-2 text-sm text-brand-text-secondary">Loading more matches...</span>
        </div>
      );
    }

    if (!hasMorePages && Array.isArray(fixtures) && fixtures.length > 0) {
      return <p className="text-sm text-brand-text-secondary">End of the list.</p>;
    }

    return null;
  };

  const safeFixtures = Array.isArray(fixtures) ? fixtures : [];
  const safeLeagues = Array.isArray(leagues) ? leagues : [];

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg mt-8">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">Filter by League</h3>
        <div className="flex flex-wrap gap-2 mt-3">
          {safeLeagues.map(league => (
            <button
              key={league}
              onClick={() => handleLeagueChange(league)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                (Array.isArray(selectedLeagues) ? selectedLeagues : []).includes(league)
                  ? 'bg-brand-accent text-brand-primary'
                  : 'bg-gray-700 hover:bg-gray-600 text-brand-text'
              }`}
            >
              {league}
            </button>
          ))}
          {Array.isArray(selectedLeagues) && selectedLeagues.length > 0 && (
              <button
                onClick={() => onSelectLeague([])}
                className="px-3 py-1 text-xs font-semibold rounded-full bg-red-800/70 hover:bg-red-700 text-white"
                >
                Clear All
                </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-brand-text-secondary">
          <thead className="text-xs text-brand-text-secondary uppercase bg-gray-800/50">
            <tr>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Match</th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">League</th>
              <th scope="col" className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {safeFixtures.length > 0 ? safeFixtures.map((fixture, index) => (
              <FixtureListItem 
                ref={safeFixtures.length === index + 1 ? lastFixtureElementRef : null}
                key={`${fixture.teamA}-${fixture.teamB}-${fixture.matchDateTime}-${index}`} 
                fixture={fixture} 
                onSelect={onSelectFixture} 
              />
            )) : (
                 <tr>
                    <td colSpan={4} className="text-center p-8">
                        <p>No matches found for your current filter.</p>
                        <p className="text-xs">Try clearing the league filter or changing your search term.</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 text-center border-t border-gray-700 h-20 flex items-center justify-center">
        {renderFooter()}
      </div>
    </div>
  );
};