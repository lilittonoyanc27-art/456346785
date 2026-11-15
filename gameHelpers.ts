import { TRABALENGUAS_LIST } from './trabalenguasData';
import {
  ActiveRoundState,
  PersistedGameState,
  PlayerId,
  PlayerStatsSummary,
  PlayerTurnState,
  RoundResult,
} from './types';

export const STORAGE_KEY = 'batalla_trabalenguas_v1_state';
export const TOTAL_ROUNDS = TRABALENGUAS_LIST.length; // 20

export function getFirstPlayerForRound(roundNumber: number): PlayerId {
  // Ronda 1 -> Razmik, Ronda 2 -> Gayane, Ronda 3 -> Razmik, ...
  return roundNumber % 2 === 1 ? 'razmik' : 'gayane';
}

export function getSecondPlayer(firstPlayer: PlayerId): PlayerId {
  return firstPlayer === 'razmik' ? 'gayane' : 'razmik';
}

export function getPlayerMeta(player: PlayerId) {
  if (player === 'razmik') {
    return {
      id: 'razmik' as const,
      name: 'Razmik',
      emoji: '⚽',
      accentText: 'text-orange-700',
      badgeBg: 'bg-orange-500',
    };
  }
  return {
    id: 'gayane' as const,
    name: 'Gayane',
    emoji: '🌸',
    accentText: 'text-pink-700',
    badgeBg: 'bg-pink-500',
  };
}

export function createEmptyTurnState(): PlayerTurnState {
  return {
    status: 'pending',
    finalMs: null,
    attempts: [],
  };
}

export function createRoundState(roundNumber: number): ActiveRoundState {
  const firstPlayer = getFirstPlayerForRound(roundNumber);
  return {
    roundNumber,
    firstPlayer,
    activePlayer: firstPlayer,
    razmik: createEmptyTurnState(),
    gayane: createEmptyTurnState(),
    timerPhase: 'idle',
    accumulatedMs: 0,
    lastReviewMs: null,
    isRunning: false,
    lastTickWallMs: null,
  };
}

export function createInitialGameState(): PersistedGameState {
  return {
    version: 1,
    hasStarted: false,
    screen: 'welcome',
    scores: {
      razmik: 0,
      gayane: 0,
    },
    currentRound: createRoundState(1),
    completedRounds: [],
    lastCompletedRoundNumber: null,
    lastUpdatedAt: Date.now(),
  };
}

export function toCentiseconds(ms: number): number {
  return Math.max(0, Math.round(ms / 10));
}

export function formatStopwatchMs(ms: number): string {
  const totalCentiseconds = toCentiseconds(ms);
  const centis = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(centis).padStart(2, '0');
  return `${mm}:${ss}.${cc}`;
}

export function formatReadableDuration(ms: number): string {
  const totalCentiseconds = toCentiseconds(ms);
  const centis = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes === 0) {
    return `${seconds}.${String(centis).padStart(2, '0')} s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')} s`;
}

export function evaluateRoundOutcome(round: ActiveRoundState): RoundResult {
  const rValid = round.razmik.status === 'valid' && round.razmik.finalMs !== null;
  const gValid = round.gayane.status === 'valid' && round.gayane.finalMs !== null;

  let winner: PlayerId | 'tie' | 'none' = 'none';
  let differenceMs: number | null = null;
  const pointsAwarded = { razmik: 0, gayane: 0 };

  if (rValid && gValid) {
    const rCs = toCentiseconds(round.razmik.finalMs!);
    const gCs = toCentiseconds(round.gayane.finalMs!);
    differenceMs = Math.abs(rCs - gCs) * 10;

    if (rCs < gCs) {
      winner = 'razmik';
      pointsAwarded.razmik = 1;
    } else if (gCs < rCs) {
      winner = 'gayane';
      pointsAwarded.gayane = 1;
    } else {
      winner = 'tie';
      pointsAwarded.razmik = 1;
      pointsAwarded.gayane = 1;
    }
  } else if (rValid && !gValid) {
    winner = 'razmik';
    pointsAwarded.razmik = 1;
  } else if (!rValid && gValid) {
    winner = 'gayane';
    pointsAwarded.gayane = 1;
  } else {
    winner = 'none';
  }

  return {
    roundNumber: round.roundNumber,
    trabalenguasId: round.roundNumber,
    firstPlayer: round.firstPlayer,
    razmik: round.razmik,
    gayane: round.gayane,
    winner,
    differenceMs,
    pointsAwarded,
    completedAt: Date.now(),
  };
}

export function computePlayerStats(
  player: PlayerId,
  completedRounds: RoundResult[],
  currentScore: number
): PlayerStatsSummary {
  let roundsWon = 0;
  let ties = 0;
  let validAttemptsCount = 0;
  let errorRoundsCount = 0;
  let totalValidMs = 0;
  let bestTimeMs: number | null = null;
  let bestRoundNumber: number | null = null;

  for (const r of completedRounds) {
    if (r.winner === player) roundsWon += 1;
    if (r.winner === 'tie') ties += 1;

    const pTurn = r[player];
    if (pTurn.status === 'valid' && pTurn.finalMs !== null) {
      validAttemptsCount += 1;
      totalValidMs += pTurn.finalMs;
      if (bestTimeMs === null || toCentiseconds(pTurn.finalMs) < toCentiseconds(bestTimeMs)) {
        bestTimeMs = pTurn.finalMs;
        bestRoundNumber = r.roundNumber;
      }
    } else if (pTurn.status === 'error') {
      errorRoundsCount += 1;
    }
  }

  const bestTwister = bestRoundNumber
    ? TRABALENGUAS_LIST.find((t) => t.id === bestRoundNumber)
    : null;

  return {
    player,
    points: currentScore,
    roundsWon,
    ties,
    validAttemptsCount,
    errorRoundsCount,
    totalValidMs,
    averageValidMs: validAttemptsCount > 0 ? Math.round(totalValidMs / validAttemptsCount) : null,
    bestTimeMs,
    bestRoundNumber,
    bestRoundTitle: bestTwister ? `${bestTwister.emoji} ${bestTwister.title}` : null,
  };
}

export function saveGameState(state: PersistedGameState): void {
  try {
    const payload: PersistedGameState = {
      ...state,
      lastUpdatedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadGameState(): PersistedGameState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialGameState();
    const parsed = JSON.parse(raw) as PersistedGameState;
    if (!parsed || parsed.version !== 1 || !parsed.currentRound) {
      return createInitialGameState();
    }

    // Regla crítica: si el cronómetro estaba funcionando al cerrar la página,
    // recupéralo en estado PAUSADO con el tiempo acumulado hasta el cierre,
    // sin añadir el tiempo durante el cual la aplicación estuvo cerrada.
    const restoredRound = { ...parsed.currentRound };
    if (restoredRound.isRunning || restoredRound.timerPhase === 'running') {
      restoredRound.isRunning = false;
      restoredRound.timerPhase = 'paused';
      restoredRound.lastTickWallMs = null;
    }

    // Si el usuario ya había empezado la partida, al volver mostramos la pantalla
    // de bienvenida con "Continuar partida" si no estaba ya en resultados finales,
    // o bien permitimos reanudar exactamente donde lo dejó.
    // Mostramos la tarjeta de "Continuar partida" en welcome si hay progreso, o mantenemos hasStarted.
    return {
      ...parsed,
      currentRound: restoredRound,
      // Si cerró en medio de la batalla, mostramos pantalla de bienvenida con botón "Continuar partida"
      // o si estaba en resultados finales, permitimos ver welcome/continuar fácilmente.
      screen: parsed.hasStarted ? 'welcome' : parsed.screen,
      // Guardamos la pantalla real pendiente? Mejor guardamos una marca o dejamos que welcome muestre "Continuar partida"
      // que restaura directamente la pantalla de juego activa!
    };
  } catch {
    return createInitialGameState();
  }
}

export function getResumeTargetScreen(state: PersistedGameState): PersistedGameState['screen'] {
  if (state.completedRounds.length >= TOTAL_ROUNDS) {
    return 'final_results';
  }
  const r = state.currentRound;
  if (r.razmik.status !== 'pending' && r.gayane.status !== 'pending') {
    return 'round_result';
  }
  return 'battle';
}
