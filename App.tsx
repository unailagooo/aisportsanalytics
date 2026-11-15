
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Disclaimer } from './components/Disclaimer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MatchDetailModal } from './components/MatchDetailModal';
import { BetSlip } from './components/BetSlip';
import { getFixturesForSport, getSportAnalyticsDashboard, searchFixtures, getBestBetsAcrossSports, getParlayOfTheWeek, verifyBetResults } from './services/geminiService';
import type { Fixture, BetSlipItem, Sport, AIRecommendedParlayLeg, AIAction, UserPreferences, LiveMatch, CompletedBet, SportAnalyticsDashboardData, AIRecommendedParlay, MatchPrediction, UserProfile, CategorizedBestBets, AIAnalysisBet } from './types';
import { Sport as SportEnum } from './types';
import { FootballIcon, BasketballIcon, TennisIcon, SearchIcon, AmericanFootballIcon, BaseballIcon, IceHockeyIcon, BrainCircuitIcon, EsportsIcon, Formula1Icon, GemIcon, TestTubeIcon, LayersIcon, ClipboardListIcon, LiveIcon, DollarSignIcon, EditIcon, GamepadIcon, ActivityIcon, BriefcaseIcon, ScaleIcon, LinkIcon, WarningIcon, TargetIcon, RefreshIcon, FlameIcon, RocketIcon, PuzzleIcon, ShieldCheckIcon } from './components/IconComponents';
import { uniq } from 'lodash';
import { AIAssistant } from './components/AIAssistant';
import { AIAnalyticsDashboard } from './components/AIAnalyticsDashboard';
import { SettingsModal } from './components/SettingsModal';
import { LiveMatchModal } from './components/LiveMatchModal';
import { BestBetsDashboard } from './components/BestBetsDashboard';
import { ProfileModal } from './components/ProfileModal';
import { ParlayOfTheWeekDashboard } from './components/ParlayOfTheWeekDashboard';
import { ProphetsPickModal } from './components/ProphetsPickModal';
import { ParlayLabDashboard } from './components/ParlayLabDashboard';
import { PredictionAnalyzerDashboard } from './components/PredictionAnalyzerDashboard';
import { LiveCommandCenterDashboard } from './components/LiveCommandCenterDashboard';
import { TheVaultDashboard } from '././components/TheVaultDashboard';
import { ManualEntryModal } from './components/ManualEntryModal';
import { SimulationDashboard } from './components/SimulationDashboard';
import { OddsMovementDashboard } from './components/OddsMovementDashboard';
import { EliteCardHub } from './components/EliteCardHub';
import { EdgeFinder } from './components/EdgeFinder';
import { LegMatcher } from './components/LegMatcher';
import { RiskAuditor } from './components/RiskAuditor';
import { MatchMenu } from './components/MatchMenu';
import { MarketOptimizer } from './components/MarketOptimizer';
import { SpecialOpsTerminal } from './components/SpecialOpsTerminal';
import { SingleMatchParlayDashboard } from './components/SingleMatchParlayDashboard';
import { CertaintyRecalibrator } from './components/CertaintyRecalibrator';
import { ChallengeDashboard } from './components/ChallengeDashboard';
import { SuperCuotasDashboard } from './components/SuperCuotasDashboard';
import { SynergyEngineDashboard } from './components/SynergyEngineDashboard';
import { DailyParlayModal } from './components/DailyParlayModal';
import { MarketExplorerDashboard } from './components/MarketExplorerDashboard';

const PAGE_SIZE = 20;

const createDefaultProfile = (): UserProfile => ({
    id: `profile_${Date.now()}`,
    name: 'Default Profile',
    preferences: {
        riskProfile: 'Balanced',
        oddsFormat: 'Decimal',
        favoriteSports: [],
        theme: 'Dark',
    },
    betHistory: [],
    bankroll: 1000,
    stakingStrategy: 'Percentage',
    stakingPercentage: 2,
});

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [isBestBetsViewActive, setIsBestBetsViewActive] = useState<boolean>(false);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fixtureError, setFixtureError] = useState<string | null>(null);

  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [detailedPrediction, setDetailedPrediction] = useState<MatchPrediction | null>(null);
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<LiveMatch | null>(null);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [analyticsData, setAnalyticsData] = useState<SportAnalyticsDashboardData | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProphetsPickModalOpen, setIsProphetsPickModalOpen] = useState(false);
  const [isDailyParlayModalOpen, setIsDailyParlayModalOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  const [bestBetsData, setBestBetsData] = useState<CategorizedBestBets | null>(null);
  const [isBestBetsLoading, setIsBestBetsLoading] = useState<boolean>(false);
  const [bestBetsError, setBestBetsError] = useState<string | null>(null);
  
  const [isParlayOfTheWeekViewActive, setIsParlayOfTheWeekViewActive] = useState<boolean>(false);
  const [parlayOfTheWeekData, setParlayOfTheWeekData] = useState<AIRecommendedParlay | null>(null);
  const [isParlayOfTheWeekLoading, setIsParlayOfTheWeekLoading] = useState<boolean>(false);
  const [parlayOfTheWeekError, setParlayOfTheWeekError] = useState<string | null>(null);

  const [isParlayLabViewActive, setIsParlayLabViewActive] = useState<boolean>(false);
  const [isPredictionAnalyzerViewActive, setIsPredictionAnalyzerViewActive] = useState<boolean>(false);
  const [isLiveCommandCenterViewActive, setIsLiveCommandCenterViewActive] = useState<boolean>(false);
  const [isVaultViewActive, setIsVaultViewActive] = useState<boolean>(false);
  const [isSimulationViewActive, setIsSimulationViewActive] = useState<boolean>(false);
  const [isOddsMovementViewActive, setIsOddsMovementViewActive] = useState<boolean>(false);
  const [isEliteCardViewActive, setIsEliteCardViewActive] = useState<boolean>(false);
  const [isEdgeFinderViewActive, setIsEdgeFinderViewActive] = useState<boolean>(false);
  
  const [isLegMatcherViewActive, setIsLegMatcherViewActive] = useState<boolean>(false);
  const [isRiskAuditorViewActive, setIsRiskAuditorViewActive] = useState<boolean>(false);
  const [isMatchMenuViewActive, setIsMatchMenuViewActive] = useState<boolean>(false);
  const [isMarketOptimizerViewActive, setIsMarketOptimizerViewActive] = useState<boolean>(false);
  const [isSpecialOpsViewActive, setIsSpecialOpsViewActive] = useState<boolean>(false);
  const [isSingleMatchParlayViewActive, setIsSingleMatchParlayViewActive] = useState<boolean>(false);
  const [isCertaintyRecalibratorViewActive, setIsCertaintyRecalibratorViewActive] = useState<boolean>(false);
  const [isChallengeViewActive, setIsChallengeViewActive] = useState<boolean>(false);
  const [isSuperCuotasViewActive, setIsSuperCuotasViewActive] = useState<boolean>(false);
  const [isSynergyViewActive, setIsSynergyViewActive] = useState<boolean>(false);
  const [isMarketExplorerViewActive, setIsMarketExplorerViewActive] = useState<boolean>(false);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem('userProfiles');
      const storedActiveId = localStorage.getItem('activeProfileId');
      if (storedProfiles) {
        const parsedProfiles = JSON.parse(storedProfiles);
        if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
            setProfiles(parsedProfiles);
            setActiveProfileId(storedActiveId || parsedProfiles[0].id);
            return;
        }
      }
      const defaultProfile = createDefaultProfile();
      setProfiles([defaultProfile]);
      setActiveProfileId(defaultProfile.id);
    } catch (error) {
      console.error("Failed to load profiles from localStorage", error);
      const defaultProfile = createDefaultProfile();
      setProfiles([defaultProfile]);
      setActiveProfileId(defaultProfile.id);
    }
  }, []);

  useEffect(() => {
    try {
      if (profiles.length > 0) {
        localStorage.setItem('userProfiles', JSON.stringify(profiles));
      }
      if (activeProfileId) {
        localStorage.setItem('activeProfileId', activeProfileId);
      }
    } catch (error) {
      console.error("Failed to save profiles to localStorage", error);
    }
  }, [profiles, activeProfileId]);

  useEffect(() => {
    const theme = activeProfile?.preferences.theme || 'Dark';
    if (theme === 'Light') {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }
  }, [activeProfile]);

  const updateProfile = useCallback((profileId: string, updates: Partial<UserProfile>) => {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, ...updates } : p));
  }, []);

  const fetchBestBetsData = useCallback(async (filters?: { dateRange?: { startDate: string; endDate: string }, sport?: string, match?: string }) => {
    if (!activeProfile) return;
    setIsBestBetsLoading(true);
    setBestBetsError(null);
    try {
        const bets = await getBestBetsAcrossSports(activeProfile.preferences, filters?.dateRange, filters?.sport, filters?.match);
        setBestBetsData(bets);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setBestBetsError(`Failed to fetch AI's top picks. ${errorMessage}`);
    } finally {
        setIsBestBetsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    if (isBestBetsViewActive) {
      // Do not fetch automatically on mount
      // fetchBestBetsData();
    }
  }, [isBestBetsViewActive]);

  const handleAnalyticsDateSearch = async (dateRange: { startDate: string; endDate: string; }) => {
    if (!activeProfile) return;
    
    if (isBestBetsViewActive) {
      await fetchBestBetsData({ dateRange });
    } else if (selectedSport) {
      setIsAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const analyticsResult = await getSportAnalyticsDashboard(selectedSport, activeProfile.preferences, dateRange);
        if (analyticsResult) {
            const dataWithSport = {
              ...analyticsResult,
              safestBets: (analyticsResult.safestBets || []).map(bet => ({ ...bet, sport: selectedSport })),
              valueBets: (analyticsResult.valueBets || []).map(bet => ({ ...bet, sport: selectedSport })),
              highRiskBets: (analyticsResult.highRiskBets || []).map(bet => ({ ...bet, sport: selectedSport })),
              playerPropBets: (analyticsResult.playerPropBets || []).map(bet => ({ ...bet, sport: selectedSport })),
            };
            setAnalyticsData(dataWithSport);
        } else {
            setAnalyticsData(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setAnalyticsError(`Failed to fetch AI analytics for the selected date range. ${errorMessage}`);
      } finally {
        setIsAnalyticsLoading(false);
      }
    }
  };

  const handleGenerateParlayOfTheWeek = useCallback(async (targetOdds: number, dateRange: { startDate: string; endDate: string }) => {
    setIsParlayOfTheWeekLoading(true);
    setParlayOfTheWeekError(null);
    setParlayOfTheWeekData(null);
    try {
        const parlay = await getParlayOfTheWeek(targetOdds, dateRange);
        setParlayOfTheWeekData(parlay);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setParlayOfTheWeekError(`Failed to generate the Parlay of the Week. ${errorMessage}`);
    } finally {
        setIsParlayOfTheWeekLoading(false);
    }
  }, []);

  const handleClearParlayData = () => {
    setParlayOfTheWeekData(null);
    setParlayOfTheWeekError(null);
  };

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMorePages || !selectedSport) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;
    try {
      const newFixtures = await getFixturesForSport(selectedSport, nextPage, PAGE_SIZE);
      if (newFixtures.length > 0) {
        setFixtures(prev => [...prev, ...newFixtures]);
        setCurrentPage(nextPage);
      }
      if (newFixtures.length < PAGE_SIZE) {
        setHasMorePages(false);
      }
    } catch (err) {
      console.error("Failed to load more fixtures", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMorePages, selectedSport, currentPage]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !selectedSport) {
      return;
    }

    setIsSearching(true);
    setFixtureError(null);
    try {
      const searchResults = await searchFixtures(selectedSport, searchTerm);
      if (searchResults.length > 0) {
        setFixtures(searchResults);
        setCurrentPage(1);
        setHasMorePages(false);
        setSelectedLeagues([]);
      } else {
        setFixtureError(`The AI couldn't find any matches for "${searchTerm}". Try a different query.`);
        setFixtures([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFixtureError(`Failed to perform AI search. ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiAction = useCallback((action: AIAction) => {
      if (action.type === 'VIEW_MATCH_DETAILS') {
          setSelectedFixture(action.fixture);
      }
  }, []);

  const handleSelectSport = useCallback(async (sport: Sport) => {
    if (isLoading && selectedSport === sport) return;

    setIsParlayOfTheWeekViewActive(false);
    setIsBestBetsViewActive(false);
    setSelectedSport(sport);
    setIsLoading(true);
    setIsAnalyticsLoading(true);
    setFixtureError(null);
    setAnalyticsError(null);
    setFixtures([]);
    setAnalyticsData(null);
    setSearchTerm('');
    setSelectedLeagues([]);
    setCurrentPage(1);
    setHasMorePages(true);
    
    try {
      const [fixturesResult, analyticsResult] = await Promise.allSettled([
        getFixturesForSport(sport, 1, PAGE_SIZE),
        getSportAnalyticsDashboard(sport, activeProfile?.preferences || createDefaultProfile().preferences)
      ]);

      if (fixturesResult.status === 'fulfilled') {
        if (fixturesResult.value.length > 0) {
            setFixtures(fixturesResult.value);
        } else {
             setFixtureError(`No upcoming matches found for ${sport}. This could be due to the off-season.`);
        }
        if (fixturesResult.value.length < PAGE_SIZE) {
          setHasMorePages(false);
        }
      } else {
        const errorMessage = fixturesResult.reason instanceof Error ? fixturesResult.reason.message : 'An unknown error occurred.';
        setFixtureError(`Failed to fetch fixtures. ${errorMessage} Please try again later.`);
      }

      if (analyticsResult.status === 'fulfilled') {
          if (analyticsResult.value) {
               const dataWithSport = {
                 ...analyticsResult.value,
                 safestBets: (analyticsResult.value.safestBets || []).map(bet => ({ ...bet, sport })),
                 valueBets: (analyticsResult.value.valueBets || []).map(bet => ({ ...bet, sport })),
                 highRiskBets: (analyticsResult.value.highRiskBets || []).map(bet => ({ ...bet, sport })),
                 playerPropBets: (analyticsResult.value.playerPropBets || []).map(bet => ({ ...bet, sport })),
               };
               setAnalyticsData(dataWithSport);
          } else {
               setAnalyticsData(analyticsResult.value);
          }
      } else {
        const errorMessage = analyticsResult.reason instanceof Error ? analyticsResult.reason.message : 'An unknown error occurred.';
        setAnalyticsError(`Failed to fetch AI analytics dashboard. ${errorMessage}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFixtureError(`An unexpected error occurred. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsAnalyticsLoading(false);
    }
  }, [isLoading, selectedSport, activeProfile]);

  const handleUpdateBetStatus = (betId: string, status: 'win' | 'loss') => {
      if (!activeProfile) return;
      const updatedHistory = activeProfile.betHistory.map(bet => 
        bet.id === betId ? { ...bet, status } : bet
      );
      updateProfile(activeProfile.id, { betHistory: updatedHistory });
  };

  const handleSavePreferences = (prefs: UserPreferences) => {
    if (!activeProfile) return;
    updateProfile(activeProfile.id, { preferences: prefs });
    if (selectedSport) {
        setIsAnalyticsLoading(true);
        setAnalyticsError(null);
        getSportAnalyticsDashboard(selectedSport, prefs)
            .then(setAnalyticsData)
            .catch(err => {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setAnalyticsError(`Failed to fetch AI analytics dashboard. ${errorMessage}`);
            })
            .finally(() => setIsAnalyticsLoading(false));
    }
  };

  const handleCreateProfile = (name: string) => {
    const newProfile: UserProfile = {
        ...createDefaultProfile(),
        id: `profile_${Date.now()}`,
        name: name,
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
        alert("Cannot delete the last profile.");
        return;
    }
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfileId === profileId) {
        setActiveProfileId(profiles.find(p => p.id !== profileId)?.id || null);
    }
  };

  const handleToggleBet = useCallback((item: BetSlipItem) => {
    setBetSlip(prev => {
      const exists = prev.some(
        p => p.matchIdentifier === item.matchIdentifier && p.marketName === item.marketName && p.outcomeName === item.outcomeName
      );
      if (exists) {
        return prev.filter(p => !(p.matchIdentifier === item.matchIdentifier && p.marketName === item.marketName && p.outcomeName === item.outcomeName));
      } else {
        const itemWithSport = { ...item, sport: selectedSport || item.sport };
        return [...prev, itemWithSport];
      }
    });
  }, [selectedSport]);

  const handleToggleBetWrapped = useCallback((item: BetSlipItem) => {
    handleToggleBet(item);
  }, [handleToggleBet]);

  const handleAddParlayToSlip = useCallback((legs: AIRecommendedParlayLeg[]) => {
      const newItems: BetSlipItem[] = legs.map(leg => ({
          matchIdentifier: `${leg.teamA} vs ${leg.teamB}`,
          marketName: leg.marketName,
          outcomeName: leg.outcomeName,
          odds: leg.odds,
          fiabilityScore: leg.fiabilityScore,
          matchDateTime: leg.matchDateTime || new Date().toISOString(),
          sport: leg.sport,
      }));
      
      setBetSlip(prev => {
          const uniqueNewItems = newItems.filter(newItem => 
              !prev.some(p => p.matchIdentifier === newItem.matchIdentifier && p.outcomeName === newItem.outcomeName)
          );
          return [...prev, ...uniqueNewItems];
      });
  }, []);

  const handleClearAndArchive = useCallback((stakedItems: { item: BetSlipItem, stake: number }[]) => {
    if (!activeProfile) return;
    
    const completedBets: CompletedBet[] = stakedItems.map(({ item, stake }) => ({
        ...item,
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        stake,
        potentialReturn: stake * (item.odds || 0),
        pnl: 0,
        resultVerified: false
    }));

    const totalStakeSpent = stakedItems.reduce((sum, { stake }) => sum + stake, 0);
    
    updateProfile(activeProfile.id, { 
        betHistory: [...activeProfile.betHistory, ...completedBets],
        bankroll: activeProfile.bankroll - totalStakeSpent
    });
    setBetSlip([]);
  }, [activeProfile, updateProfile]);

  const allLeagues = useMemo(() => uniq(fixtures.map(f => f.league)).sort(), [fixtures]);
  const filteredFixtures = useMemo(() => {
    let result = fixtures;
    if (searchTerm) {
      result = result.filter(
        f =>
          f.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.teamB.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.league.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedLeagues.length > 0) {
      result = result.filter(f => selectedLeagues.includes(f.league));
    }
    return result;
  }, [fixtures, searchTerm, selectedLeagues]);

  const sportsList: Sport[] = Object.values(SportEnum);
  const sportIcons: { [key in Sport]: React.FC<{ className?: string }> } = {
    [SportEnum.Football]: FootballIcon, [SportEnum.Basketball]: BasketballIcon, [SportEnum.Tennis]: TennisIcon,
    [SportEnum.AmericanFootball]: AmericanFootballIcon, [SportEnum.Baseball]: BaseballIcon, [SportEnum.IceHockey]: IceHockeyIcon,
    [SportEnum.Esports]: EsportsIcon, [SportEnum.Formula1]: Formula1Icon,
  };

  const renderContent = () => {
    if (isSynergyViewActive) return <SynergyEngineDashboard onBack={() => setIsSynergyViewActive(false)} onAddParlayToSlip={handleAddParlayToSlip} />;
    if (isSuperCuotasViewActive) return <SuperCuotasDashboard onBack={() => setIsSuperCuotasViewActive(false)} onAddParlayToSlip={handleAddParlayToSlip} />;
    if (isChallengeViewActive) return <ChallengeDashboard onBack={() => setIsChallengeViewActive(false)} />;
    if (isCertaintyRecalibratorViewActive) return <CertaintyRecalibrator onBack={() => setIsCertaintyRecalibratorViewActive(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />;
    if (isSingleMatchParlayViewActive) return <SingleMatchParlayDashboard onBack={() => setIsSingleMatchParlayViewActive(false)} onAddParlayToSlip={handleAddParlayToSlip} />;
    if (isSpecialOpsViewActive) return <SpecialOpsTerminal onBack={() => setIsSpecialOpsViewActive(false)} onToggleBet={handleToggleBetWrapped} />;
    if (isLegMatcherViewActive) return <LegMatcher onBack={() => setIsLegMatcherViewActive(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />;
    if (isRiskAuditorViewActive) return <RiskAuditor onBack={() => setIsRiskAuditorViewActive(false)} />;
    if (isMatchMenuViewActive) return <MatchMenu onBack={() => setIsMatchMenuViewActive(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />;
    if (isMarketOptimizerViewActive) return <MarketOptimizer onBack={() => setIsMarketOptimizerViewActive(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />;
    if (isEdgeFinderViewActive) return <EdgeFinder onBack={() => setIsEdgeFinderViewActive(false)} />;
    if (isEliteCardViewActive) return <EliteCardHub betSlip={betSlip} onBack={() => setIsEliteCardViewActive(false)} />;
    if (isOddsMovementViewActive) return <OddsMovementDashboard onBack={() => setIsOddsMovementViewActive(false)} />;
    if (isSimulationViewActive) return <SimulationDashboard onBack={() => setIsSimulationViewActive(false)} />;
    if (isVaultViewActive) return <TheVaultDashboard profile={activeProfile!} onBack={() => setIsVaultViewActive(false)} onVerifyBets={() => {}} isVerifying={false} />;
    if (isLiveCommandCenterViewActive) return <LiveCommandCenterDashboard onBack={() => setIsLiveCommandCenterViewActive(false)} onToggleBet={handleToggleBetWrapped} />;
    if (isPredictionAnalyzerViewActive) return <PredictionAnalyzerDashboard onBack={() => setIsPredictionAnalyzerViewActive(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />;
    if (isParlayLabViewActive) return <ParlayLabDashboard onBack={() => setIsParlayLabViewActive(false)} onAddParlayToSlip={handleAddParlayToSlip} />;
    if (isParlayOfTheWeekViewActive) {
      return <ParlayOfTheWeekDashboard
          onBack={() => setIsParlayOfTheWeekViewActive(false)}
          parlayData={parlayOfTheWeekData}
          isLoading={isParlayOfTheWeekLoading}
          error={parlayOfTheWeekError}
          onAddParlayToSlip={handleAddParlayToSlip}
          onGenerateParlay={handleGenerateParlayOfTheWeek}
          onClearParlay={handleClearParlayData}
      />;
    }
    if (isBestBetsViewActive) {
        return <BestBetsDashboard 
            onBack={() => setIsBestBetsViewActive(false)} 
            betSlip={betSlip} 
            onToggleBet={handleToggleBetWrapped} 
            bestBets={bestBetsData}
            isLoading={isBestBetsLoading}
            error={bestBetsError}
            onSearch={fetchBestBetsData}
        />;
    }
    if (isMarketExplorerViewActive) {
        return <MarketExplorerDashboard
            onBack={() => setIsMarketExplorerViewActive(false)}
            betSlip={betSlip}
            onToggleBet={handleToggleBetWrapped}
        />;
    }

    if (selectedSport) {
      return (
        <AIAnalyticsDashboard
            sport={selectedSport}
            analyticsData={analyticsData}
            isAnalyticsLoading={isAnalyticsLoading}
            analyticsError={analyticsError}
            fixtureError={fixtureError}
            fixtures={filteredFixtures}
            leagues={allLeagues}
            selectedLeagues={selectedLeagues}
            onSelectLeague={setSelectedLeagues}
            onSelectFixture={setSelectedFixture}
            onLoadMoreFixtures={handleLoadMore}
            isFixturesLoading={isLoading}
            hasMoreFixtures={hasMorePages}
            betSlip={betSlip}
            onToggleBet={handleToggleBetWrapped}
            onAddParlayToSlip={handleAddParlayToSlip}
            onSelectLiveMatch={setSelectedLiveMatch}
            isSearching={isSearching}
            searchTerm={searchTerm}
            onAnalyticsDateSearch={handleAnalyticsDateSearch}
        />
      );
    }

    return (
      <>
        <div className="text-center py-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight italic">AI Sports Analytics Pro <span className="text-brand-accent">v4.8</span></h2>
          <p className="mt-4 max-w-2xl mx-auto text-brand-text-secondary">Terminal de inteligencia deportiva avanzada. Análisis forense, arbitraje cuántico y motores de correlación táctica.</p>
        </div>
        
        <div className="mb-12">
            <h3 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.5em] text-center mb-8 border-b border-brand-accent/20 pb-4">Terminales de Estrategia Pro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => setIsSynergyViewActive(true)} className="bg-gradient-to-br from-blue-600 to-indigo-800 p-0.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg group">
                    <div className="bg-gray-900 rounded-[10px] p-5 h-full flex flex-col items-center justify-center text-center">
                        <PuzzleIcon className="text-blue-400 w-8 h-8 mb-2 group-hover:animate-pulse"/>
                        <span className="text-white font-black text-sm uppercase italic">Synergy Engine</span>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Detector de Correlación Táctica</p>
                    </div>
                </button>
                <button onClick={() => setIsSuperCuotasViewActive(true)} className="bg-gradient-to-br from-orange-500 to-red-700 p-0.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg group">
                    <div className="bg-gray-900 rounded-[10px] p-5 h-full flex flex-col items-center justify-center text-center">
                        <FlameIcon className="text-orange-500 w-8 h-8 mb-2 group-hover:animate-bounce"/>
                        <span className="text-white font-black text-sm uppercase italic">SUPERCUOTAS</span>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Forja de Multiplicadores @15-@5000</p>
                    </div>
                </button>
                <button onClick={() => setIsChallengeViewActive(true)} className="bg-gradient-to-br from-green-500 to-emerald-800 p-0.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg group">
                    <div className="bg-gray-900 rounded-[10px] p-5 h-full flex flex-col items-center justify-center text-center">
                        <RocketIcon className="text-green-400 w-8 h-8 mb-2 group-hover:translate-y-[-4px] transition-transform"/>
                        <span className="text-white font-black text-sm uppercase italic">Nexus Retos</span>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Planificador de Interés Compuesto</p>
                    </div>
                </button>
                <button onClick={() => setIsCertaintyRecalibratorViewActive(true)} className="bg-gradient-to-br from-brand-accent to-brand-accent-dark p-0.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg group">
                    <div className="bg-gray-900 rounded-[10px] p-5 h-full flex flex-col items-center justify-center text-center">
                        <ActivityIcon className="text-brand-accent w-8 h-8 mb-2 group-hover:animate-pulse"/>
                        <span className="text-white font-black text-sm uppercase italic">Certainty Engine</span>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Arbitraje de Probabilidad Asimétrica</p>
                    </div>
                </button>
            </div>
        </div>

        <div className="mb-12">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] text-center mb-8 border-b border-gray-800 pb-4">Hub de Análisis Institucional</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <button onClick={() => setIsVaultViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <DollarSignIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">The Vault</span>
                    <span className="text-[9px] text-gray-500 uppercase">Gestión Financiera</span>
                </button>
                <button onClick={() => setIsEliteCardViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <BriefcaseIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Elite Card Hub</span>
                    <span className="text-[9px] text-gray-500 uppercase">Reportes Forenses</span>
                </button>
                <button onClick={() => setIsEdgeFinderViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <ScaleIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Edge Finder</span>
                    <span className="text-[9px] text-gray-500 uppercase">Probabilidad vs Mercado</span>
                </button>
                <button onClick={() => setIsBestBetsViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <BrainCircuitIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Best Bets</span>
                    <span className="text-[9px] text-gray-500 uppercase">Selecciones de Alta Confianza</span>
                </button>
                <button onClick={() => setIsDailyParlayModalOpen(true)} className="bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 p-5 rounded-xl border border-brand-accent/30 hover:border-brand-accent transition-all flex flex-col items-center group shadow-[0_0_15px_rgba(0,245,160,0.05)]">
                    <ShieldCheckIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Daily Parlay</span>
                    <span className="text-[9px] text-gray-500 uppercase">Combinada del Día</span>
                </button>
                <button onClick={() => setIsMarketExplorerViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <SearchIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Market Explorer</span>
                    <span className="text-[9px] text-gray-500 uppercase">Buscador de Cuotas</span>
                </button>
                <button onClick={() => setIsProphetsPickModalOpen(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <GemIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Prophet's Pick</span>
                    <span className="text-[9px] text-gray-500 uppercase">La Elección Maestra</span>
                </button>
                <button onClick={() => setIsParlayLabViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <TestTubeIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Parlay Lab</span>
                    <span className="text-[9px] text-gray-500 uppercase">Laboratorio de Combinadas</span>
                </button>
                <button onClick={() => setIsPredictionAnalyzerViewActive(true)} className="bg-brand-secondary p-5 rounded-xl border border-gray-800 hover:border-brand-accent transition-all flex flex-col items-center group">
                    <ClipboardListIcon className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm uppercase">Analizador OCR</span>
                    <span className="text-[9px] text-gray-500 uppercase">Auditoría de Tickets</span>
                </button>
            </div>
        </div>

        <div className="mb-12">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] text-center mb-8 border-b border-gray-800 pb-4">Unidades Operativas Interactivas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={() => setIsSpecialOpsViewActive(true)} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 hover:border-brand-accent transition-all flex items-center gap-4 group">
                    <TargetIcon className="w-10 h-10 text-brand-accent group-hover:rotate-45 transition-transform" />
                    <div className="text-left">
                        <span className="text-white font-black uppercase text-md">Special Ops Terminal</span>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Despliegue Táctico por Voz/Texto</p>
                    </div>
                </button>
                <button onClick={() => setIsLegMatcherViewActive(true)} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 hover:border-blue-400 transition-all flex items-center gap-4 group">
                    <LinkIcon className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                        <span className="text-white font-black uppercase text-md">The Leg Matcher</span>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Buscador de Anclas Seguras</p>
                    </div>
                </button>
                <button onClick={() => setIsRiskAuditorViewActive(true)} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 hover:border-red-500 transition-all flex items-center gap-4 group">
                    <WarningIcon className="w-10 h-10 text-red-500 group-hover:animate-pulse" />
                    <div className="text-left">
                        <span className="text-white font-black uppercase text-md">Risk Auditor</span>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Stress-Test de Pronósticos</p>
                    </div>
                </button>
                <button onClick={() => setIsSingleMatchParlayViewActive(true)} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 hover:border-orange-400 transition-all flex items-center gap-4 group">
                    <LayersIcon className="w-10 h-10 text-orange-400 group-hover:translate-y-[-2px] transition-transform" />
                    <div className="text-left">
                        <span className="text-white font-black uppercase text-md">Combinada de Autor</span>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Same Game Parlay Custom</p>
                    </div>
                </button>
                <button onClick={() => setIsMarketOptimizerViewActive(true)} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 hover:border-yellow-400 transition-all flex items-center gap-4 group">
                    <RefreshIcon className="w-10 h-10 text-yellow-400 group-hover:rotate-180 duration-700 transition-transform" />
                    <div className="text-left">
                        <span className="text-white font-black uppercase text-md">Market Optimizer</span>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Eficiencia en Cuotas Derivadas</p>
                    </div>
                </button>
                <button onClick={() => setIsLiveCommandCenterViewActive(true)} className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 hover:border-red-600 transition-all flex items-center gap-4 group">
                    <div className="relative">
                        <LiveIcon className="w-10 h-10 text-red-600" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span></span>
                    </div>
                    <div className="text-left">
                        <span className="text-white font-black uppercase text-md">Live Command</span>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Telemetría de Campo en Vivo</p>
                    </div>
                </button>
            </div>
        </div>

        <div className="text-center my-12">
            <p className="text-brand-text-secondary text-[10px] uppercase tracking-widest font-black">O selecciona un activo para investigación manual</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {sportsList.map(sport => {
            const Icon = sportIcons[sport];
            return (
              <button key={sport} onClick={() => handleSelectSport(sport)} className="bg-brand-secondary p-6 rounded-xl text-center transition-all hover:bg-gray-800 hover:scale-105 border border-gray-800 hover:border-brand-accent">
                <Icon className="w-10 h-10 mx-auto text-brand-accent mb-3" />
                <span className="block text-[10px] font-black text-brand-text uppercase tracking-tighter">{sport}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  if (!activeProfile) {
    return (
        <div className="min-h-screen bg-brand-primary text-brand-text flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} onOpenProfile={() => setIsProfileModalOpen(true)} activeProfileName={activeProfile?.name} />
      <main className="container mx-auto px-4 py-8">
        {selectedSport && !isBestBetsViewActive && !isParlayOfTheWeekViewActive && !isParlayLabViewActive && !isPredictionAnalyzerViewActive && !isLiveCommandCenterViewActive && !isVaultViewActive && !isSimulationViewActive && !isOddsMovementViewActive && !isEliteCardViewActive && !isEdgeFinderViewActive && !isLegMatcherViewActive && !isRiskAuditorViewActive && !isMatchMenuViewActive && !isMarketOptimizerViewActive && !isSpecialOpsViewActive && !isSingleMatchParlayViewActive && !isCertaintyRecalibratorViewActive && !isChallengeViewActive && !isSuperCuotasViewActive && !isSynergyViewActive && (
          <form onSubmit={handleSearchSubmit} className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
            <input type="text" placeholder={`Search teams...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-brand-secondary border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
          </form>
        )}
        {renderContent()}
      </main>
      <Disclaimer />
      {selectedFixture && <MatchDetailModal fixture={selectedFixture} onClose={() => setSelectedFixture(null)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} onPredictionLoaded={setDetailedPrediction} />}
      {isProphetsPickModalOpen && <ProphetsPickModal onClose={() => setIsProphetsPickModalOpen(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />}
      {isDailyParlayModalOpen && <DailyParlayModal onClose={() => setIsDailyParlayModalOpen(false)} onToggleBet={handleToggleBetWrapped} betSlip={betSlip} />}
      {selectedLiveMatch && <LiveMatchModal match={selectedLiveMatch} onClose={() => setSelectedLiveMatch(null)} />}
      {isManualEntryOpen && <ManualEntryModal onClose={() => setIsManualEntryOpen(false)} onAddBet={handleToggleBetWrapped} />}
      <BetSlip items={betSlip} activeProfile={activeProfile!} onRemove={(item) => setBetSlip(s => s.filter(i => i !== item))} onClearAndArchive={handleClearAndArchive} onUpdateBetStatus={handleUpdateBetStatus} onUpdateProfile={(updates) => updateProfile(activeProfile!.id, updates)} />
      <AIAssistant selectedSport={selectedSport} visibleFixtures={filteredFixtures} analytics={analyticsData} onAiAction={handleAiAction} detailedPrediction={detailedPrediction} />
      {isSettingsOpen && <SettingsModal currentPreferences={activeProfile!.preferences} onSave={handleSavePreferences} onClose={() => setIsSettingsOpen(false)} />}
      {isProfileModalOpen && <ProfileModal profiles={profiles} activeProfileId={activeProfileId} onSelectProfile={setActiveProfileId} onCreateProfile={handleCreateProfile} onDeleteProfile={handleDeleteProfile} onClose={() => setIsProfileModalOpen(false)} onImportData={() => {}} onExportData={() => {}} />}
    </div>
  );
};

export default App;
