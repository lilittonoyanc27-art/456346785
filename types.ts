export type PlayerId = 'razmik' | 'gayane';

export type SpeechSpeed = 'slow' | 'normal' | 'fast';

export type TimerPhase =
  | 'idle'
  | 'running'
  | 'paused'
  | 'pending_review'
  | 'error_feedback'
  | 'turn_confirmed';

export type GameScreen =
  | 'welcome'
  | 'battle'
  | 'round_result'
  | 'milestone'
  | 'final_results';

export interface TrabalenguasItem {
  id: number;
  title: string;
  emoji: string;
  soundFocus: string;
  difficulty: 'Media' | 'Alta' | 'Reto final';
  text: string;
  armenianTranslation: string;
}

export interface AttemptRecord {
  elapsedMs: number;
  status: 'valid' | 'error';
  recordedAt: number;
}

export interface PlayerTurnState {
  status: 'pending' | 'valid' | 'error';
  finalMs: number | null;
  attempts: AttemptRecord[];
}

export interface RoundResult {
  roundNumber: number; // 1..20
  trabalenguasId: number;
  firstPlayer: PlayerId;
  razmik: PlayerTurnState;
  gayane: PlayerTurnState;
  winner: PlayerId | 'tie' | 'none';
  differenceMs: number | null;
  pointsAwarded: {
    razmik: number;
    gayane: number;
  };
  completedAt: number;
}

export interface ActiveRoundState {
  roundNumber: number; // 1..20
  firstPlayer: PlayerId;
  activePlayer: PlayerId;
  razmik: PlayerTurnState;
  gayane: PlayerTurnState;
  timerPhase: TimerPhase;
  accumulatedMs: number;
  lastReviewMs: number | null;
  isRunning: boolean;
  lastTickWallMs: number | null;
}

export interface PersistedGameState {
  version: number;
  hasStarted: boolean;
  screen: GameScreen;
  scores: {
    razmik: number;
    gayane: number;
  };
  currentRound: ActiveRoundState;
  completedRounds: RoundResult[];
  lastCompletedRoundNumber: number | null;
  lastUpdatedAt: number;
}

export interface PlayerStatsSummary {
  player: PlayerId;
  points: number;
  roundsWon: number;
  ties: number;
  validAttemptsCount: number;
  errorRoundsCount: number;
  totalValidMs: number;
  averageValidMs: number | null;
  bestTimeMs: number | null;
  bestRoundNumber: number | null;
  bestRoundTitle: string | null;
}
