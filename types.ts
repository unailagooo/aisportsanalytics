
export enum Sport {
  Football = 'Football',
  Basketball = 'Basketball',
  Tennis = 'Tennis',
  AmericanFootball = 'American Football',
  Baseball = 'Baseball',
  IceHockey = 'Ice Hockey',
  Esports = 'Esports',
  Formula1 = 'Formula 1',
}

export interface Outcome {
  name: string;
  odds: number;
  bookmaker?: string;
}

export interface Market {
  name: string;
  outcomes: Outcome[];
}

export interface HistoricalStats {
  headToHead: string;
  recentFormA: string;
  recentFormB: string;
}

export interface Fixture {
  teamA: string;
  teamALogo?: string;
  teamB: string;
  teamBLogo?: string;
  league: string;
  matchDateTime: string; // ISO 8601 format
  sport: Sport;
}

export interface QuantumVectorAnalysis {
  vectorCuantitativo: string;
  vectorMomentum: string;
  vectorMercado: string;
  simulacionEstres: string;
  veredictoCuantico: string;
}

export interface Player {
  name: string;
  position: string;
  stats: Record<string, number | string>;
}

export interface MatchSpecificBet {
  marketName: string;
  outcomeName: string;
  odds: number;
  fiabilityScore: number;
  justification: QuantumVectorAnalysis;
  vectorInfluence: {
    cuantitativo: number;
    momentum: number;
    mercado: number;
    simulacionEstres: number;
  };
}

export interface MatchPrediction extends Fixture {
  teamALogo?: string;
  teamBLogo?: string;
  expertConsensus?: string;
  historicalStats?: HistoricalStats;
  mainPrediction: MatchSpecificBet;
  safestBets: MatchSpecificBet[];
  valueBets: MatchSpecificBet[];
  highRiskBets: MatchSpecificBet[];
  markets: Market[];
  oddsProviders?: {
    bookmaker: string;
    odds: number;
  }[];
  sources?: {
    uri: string;
    title: string;
  }[];
  keyPlayers: { teamA: Player[]; teamB: Player[]; };
  error?: string;
}

export interface MarketExplorerParams {
  market: string;
  match?: string;
  dateRange?: string;
  targetOdds?: string;
}

export interface MarketExplorerPick {
  matchIdentifier: string;
  marketName: string;
  outcomeName: string;
  odds: number;
  bookmaker?: string;
  historicalHitRate?: string;
  fiabilityScore: number;
  valueScore: number;
  analysis: QuantumVectorAnalysis;
  sport: Sport;
  matchDateTime: string;
}

export interface MarketExplorerResult {
  params: MarketExplorerParams;
  categories?: {
    seguras: MarketExplorerPick[];
    rentables: MarketExplorerPick[];
    highRisk: MarketExplorerPick[];
  };
  picks?: MarketExplorerPick[]; // If specific filters are applied, just return a list
}

export interface BetSlipItem {
  matchIdentifier: string;
  marketName: string;
  outcomeName: string;
  odds: number;
  fiabilityScore?: number;
  matchDateTime?: string;
  sport?: Sport;
}

export interface CompletedBet extends BetSlipItem {
  id: string;
  status: 'pending' | 'win' | 'loss' | 'push' | 'void';
  stake: number;
  potentialReturn: number;
  pnl: number;
  resultVerified: false;
}

export interface AIAction {
  type: 'VIEW_MATCH_DETAILS';
  fixture: Fixture;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  action?: AIAction;
}

export interface BetAnalysis {
  structuredAnalysis: QuantumVectorAnalysis;
  fiabilityScore: number;
  marketName?: string;
  outcomeName?: string;
  odds?: number;
}

export interface RecommendedBet {
  teamA: string;
  teamB: string;
  league: string;
  marketName: string;
  outcomeName: string;
  odds: number;
  stakeUnits: number;
  justification: string;
}

export interface ParlayAnalysis {
  structuredAnalysis: QuantumVectorAnalysis;
  viabilityScore: number;
}

export interface AIAnalysisBet {
  sport: Sport;
  teamA: string;
  teamB: string;
  league: string;
  matchDateTime: string;
  marketName: string;
  outcomeName: string;
  odds: number;
  fiabilityScore: number;
  justification: QuantumVectorAnalysis;
  vectorInfluence: {
    cuantitativo: number;
    momentum: number;
    mercado: number;
    simulacionEstres: number;
  };
}

export interface AIRecommendedParlayLeg extends AIAnalysisBet {
  valueScore?: number;
}

export interface AIRecommendedParlay {
  parlayType: string;
  legs: AIRecommendedParlayLeg[];
  viabilityScore: number;
  analysis: QuantumVectorAnalysis;
  explanationForOddsDeviation?: string;
}

export interface SportAnalyticsDashboardData {
  safestBets: AIAnalysisBet[];
  valueBets: AIAnalysisBet[];
  highRiskBets: AIAnalysisBet[];
  playerPropBets: AIAnalysisBet[];
  recommendedParlays: AIRecommendedParlay[];
}

export interface CategorizedBestBets {
  safestBets: AIAnalysisBet[];
  valueBets: AIAnalysisBet[];
  highRiskBets: AIAnalysisBet[];
}

export type RiskProfile = 'Conservative' | 'Balanced' | 'Aggressive';
export type OddsFormat = 'Decimal' | 'American' | 'Fractional';
export type AppTheme = 'Dark' | 'Light';

export interface UserPreferences {
  riskProfile: RiskProfile;
  oddsFormat: OddsFormat;
  favoriteSports: Sport[];
  theme: AppTheme;
}

export type StakingStrategy = 'Level' | 'Percentage' | 'Kelly';

export interface UserProfile {
  id: string;
  name: string;
  preferences: UserPreferences;
  betHistory: CompletedBet[];
  bankroll: number;
  stakingStrategy: StakingStrategy;
  stakingPercentage: number;
}

export interface LiveMatch extends Fixture {
  status: 'live' | 'halftime';
  minute: number;
  scoreA: number;
  scoreB: number;
}

export interface LiveMatchEvent {
  minute: number;
  event: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR_CHECK';
  team: 'A' | 'B' | 'None';
  description: string;
}

export interface LiveInsight {
  timestamp: number;
  reliabilityScore?: number;
  valueScore?: number;
  smallAnalysis?: string;
  stats?: {
    possessionA: number;
    possessionB: number;
    shotsA: number;
    shotsB: number;
    shotsOnTargetA: number;
    shotsOnTargetB: number;
    cornersA: number;
    cornersB: number;
  };
  suggestedLiveBets?: {
    marketName: string;
    outcomeName: string;
    odds: number;
    justification: string;
  }[];
  structuredAnalysis: QuantumVectorAnalysis;
  events: LiveMatchEvent[];
}

export interface ScenarioAnalysis {
  scenario: string;
  newFiabilityScore: number;
  analysis: string;
}

export interface PlayerMatchupAnalysis {
  playerA: Player;
  playerB: Player;
  verdict: string;
  advantage: 'playerA' | 'playerB' | 'balanced';
  keyComparison: string;
}

export interface BetPostMortemAnalysis {
  analysis: string;
  keyFactor: string;
  finalScore: string;
}

export interface BankrollCoachingAdvice {
  advice: string;
  positiveHabits: string[];
  areasForImprovement: string[];
}

export interface PerformanceAnalysis {
  summary: string;
  strongestAreas: string[];
  weakestAreas: string[];
}

export interface OddsMovementData {
    timestamp: string;
    odds: number;
}

export interface OddsMovement {
  id: string;
  sport: Sport;
  match: string;
  league: string;
  market: string;
  selection: string;
  oldOdds: number;
  newOdds: number;
  timestamp: string;
  bookmaker: string;
  movementType: string;
  magnitude: string;
  history: OddsMovementData[];
}

export interface OddsAnalysisResult {
  movement: OddsMovement;
  verdict: {
    type: string;
    score: number;
    recommendation: 'Follow' | 'Fade' | 'Wait';
    summary: string;
  };
  analysis: {
    context: string;
    modelCoherence: string;
    movementType: string;
    speed: string;
    magnitude: string;
  };
}

export interface RiskAuditReport {
  riskLevel: string;
  factors: { title: string; description: string }[];
  conclusion: string;
}

export interface MatchMenuData {
  safe: MatchSpecificBet;
  logic: MatchSpecificBet;
  aggressive: MatchSpecificBet;
}

export interface OptimizerResult {
  selection: string;
  suggestedMarket: string;
  odds: number;
  edgePercentage: number;
  reasoning: string;
  alternatives: { market: string; odds: number; reason: string }[];
}

export type SpecialOpsIntent = 'ROADMAP' | 'PARLAY' | 'ALLOCATION' | 'AUDIT';

export interface RoadmapStep {
  order: number;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  time: string;
  reasoning: string;
}

export interface AllocationItem {
  category: string;
  percentage: number;
  amount: number;
  description: string;
}

export interface SpecialOpsResponse {
  intent: SpecialOpsIntent;
  title: string;
  summary: string;
  reliabilityScore: number;
  valueScore: number;
  analysis: QuantumVectorAnalysis;
  data: {
    steps?: RoadmapStep[];
    legs?: { teamA: string; teamB: string; selection: string; market: string; odds: number; reason: string }[];
    items?: AllocationItem[];
  };
}

export interface EliteCardData {
  cardId: string;
  timestamp: string;
  event: string;
  league: string;
  selection: string;
  market: string;
  odds: number;
  confidenceGrade: string;
  thesis: {
    quantitative: string;
    marketFlow: string;
    riskMitigation: string;
  };
  verificationCode: string;
}

export interface MatchSimulation {
  teamA: string;
  teamB: string;
  simulatedScore?: { A: number; B: number };
  winProbabilities?: { teamA: number; draw: number; teamB: number };
  narrative: string;
  stats?: {
    possession?: { A: number; B: number };
    shots?: { A: number; B: number };
    shotsOnTarget?: { A: number; B: number };
    corners?: { A: number; B: number };
    fouls?: { A: number; B: number };
    yellowCards?: { A: number; B: number };
    offsides?: { A: number; B: number };
    freeKicks?: { A: number; B: number };
    headersWon?: { A: number; B: number };
  };
  timeline?: { minute: number; type: string; description: string; team: 'A' | 'B' }[];
  exactScoreProbabilities?: { score: string; probability: number }[];
}

export interface EdgeAnalysisResult {
  match: string;
  selection: string;
  market: string;
  bookmakerOdds: number;
  fairOdds: number;
  trueProbability: number;
  impliedProbability: number;
  edgePercentage: number;
  valueRating: string;
  kellyStake: number;
  simulationData: { iterations: number; confidenceInterval: string };
  analysis: string;
}

export interface Nexus9AuditData {
  marketAlignment: number;
  blackSwanRisks: { scenario: string; probability: number; impact: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  correlationAudit: string;
  hedgeOptimizer: { trigger: string; action: string; protectionLevel: string }[];
  auditCertificateId: string;
}

export interface CustomPredictionAnalysis {
  isValidPrediction: boolean;
  originalPrediction: string;
  matchContext?: { teamA: string; teamB: string; league: string; sport: string };
  analysis: QuantumVectorAnalysis;
  fiabilityScore: number;
  valueScore: number;
  suggestedAlternative?: { marketName: string; outcomeName: string; odds: number; reason: string };
  structuredBet?: { matchIdentifier: string; marketName: string; outcomeName: string; odds: number };
  nexus9Audit?: Nexus9AuditData;
  error?: string;
}

export type ParlayAggressiveness = 'Safe' | 'Balanced' | 'Aggressive' | 'UltraConservative';
export type ChallengeExecutionMode = 'Manual' | 'MasterPlan';

export interface RecalibratorResult {
  originalBet: {
    match: string;
    selection: string;
    odds: number;
    probability: number;
    failurePoints: string[];
  };
  recalibratedBet: {
    match: string;
    selection: string;
    market: string;
    odds: number;
    probability: number;
    shieldFactors: string[];
    evidence: string;
    substitutionType: 'LOCAL' | 'GLOBAL';
    sport: Sport;
  };
  simulation: {
    iterations: number;
    originalCurve: number[];
    recalibratedCurve: number[];
  };
  auditId: string;
}

// --- CHALLENGE TYPES ---
export type ChallengeStrategy = 'Conservative' | 'Balanced' | 'Aggressive' | 'UltraConservative';
export type ChallengeWithdrawalProtocol = 'SaveInitialStake' | 'TacticalHarvest' | 'ZeroWithdrawal';
export type ChallengeMode = 'Active' | 'Paused' | 'Recovery' | 'Completed' | 'Failed';

export interface ChallengeStep {
  id: string;
  order: number;
  matchIdentifier: string;
  marketName: string;
  outcomeName: string;
  odds: number;
  stake: number;
  status: 'pending' | 'win' | 'loss' | 'void' | 'upcoming';
  analysis?: QuantumVectorAnalysis;
  reliabilityScore: number;
  volatilityIndex: number; // 0-100
  ruinFactor: number; // 0-100
  timestamp: number;
  sport: Sport;
  isCustom?: boolean;
}

export interface ChallengeConfig {
  id: string;
  name: string;
  seedCapital: number;
  targetGoal: number;
  strategy: ChallengeStrategy;
  executionMode: ChallengeExecutionMode;
  withdrawalProtocol: ChallengeWithdrawalProtocol;
  targetDate?: string;
  createdAt: number;
}

export interface Challenge {
  config: ChallengeConfig;
  currentCapital: number;
  totalWithdrawn: number;
  steps: ChallengeStep[];
  mode: ChallengeMode;
  recoveryTarget?: number;
  lastUpdate: number;
}

// --- SUPERCUOTAS TYPES ---
export type SuperCuotaAggressiveness = 'Baja' | 'Alta' | 'Recomendada';

export interface SuperCuotaConfig {
  targetOdds: number;
  aggressiveness: SuperCuotaAggressiveness;
  days: number;
  allowedSports: Sport[];
  excludeToday?: boolean;
}

export interface SuperCuotaDecomposition {
  optimalLegsCount: number;
  averageOddsPerLeg: number;
  reasoning: string;
}

export interface SuperCuotaRealityCheck {
  isViable: boolean;
  warning?: string;
  suggestedAlternative?: string;
}

export interface SuperCuota {
  decomposition: SuperCuotaDecomposition;
  legs: AIRecommendedParlayLeg[];
  planB: {
    legs: AIRecommendedParlayLeg[];
    targetOdds: number;
    viabilityScore: number;
  };
  realityCheck: SuperCuotaRealityCheck;
  globalAnalysis: QuantumVectorAnalysis;
  overallViabilityScore: number;
  closingPhrase?: string;
}

// --- SYNERGY TYPES ---
export interface SynergyLeg extends AIRecommendedParlayLeg {
  correlationFactor: number; // 0-100
}

export interface SynergyResult {
  matchTitle: string;
  tacticalCore: string;
  synergyScore: number; // 0-100
  totalOdds: number;
  legs: SynergyLeg[];
  structuralJustification: string;
  analysis: QuantumVectorAnalysis;
}

// --- DAILY PARLAY TYPES ---
export interface DailyParlayLeg {
  match: string;
  market: string;
  odds: number;
  probability: number;
  reason: string;
  justification: QuantumVectorAnalysis;
  fragility: number; // 1-5
  sport: Sport;
}

export interface DiscardedLeg {
  match: string;
  market: string;
  odds: number;
  discardReason: string;
}

export interface DailyParlay {
  exists: boolean;
  date: string;
  sports: Sport[];
  legs: DailyParlayLeg[];
  discardedLegs: DiscardedLeg[]; // Added field
  totalOdds: number;
  globalSecurityIndex: number; // 0-100
  profitabilityIndex: number; // 0-100
  weakLink?: string;
  status: 'OPTIMO' | 'VOLATIL';
  reasoning: string;
  analysis: QuantumVectorAnalysis;
}
