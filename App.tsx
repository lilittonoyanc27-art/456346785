import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Play, RotateCcw, Rocket, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { BattleStage } from './BattleStage';
import {
  FinalResultsView,
  LiveResultsModal,
  MilestoneStandingsView,
  RoundResultView,
} from './ResultsView';
import { ScoreboardHeader } from './ScoreboardHeader';
import {
  TOTAL_ROUNDS,
  createInitialGameState,
  createRoundState,
  evaluateRoundOutcome,
  getPlayerMeta,
  getResumeTargetScreen,
  loadGameState,
  saveGameState,
} from './gameHelpers';
import {
  launchConfetti,
  playCorrectChime,
  playErrorBuzz,
  playStartBeep,
  playStopBeep,
  playVictoryFanfare,
} from './soundAndConfetti';
import { TRABALENGUAS_LIST } from './trabalenguasData';
import { PersistedGameState } from './types';

export default function App() {
  const [initialSetup] = useState(() => {
    const loaded = loadGameState();
    const hadPausedOnLoad =
      loaded.hasStarted &&
      loaded.currentRound.timerPhase === 'paused' &&
      loaded.currentRound.accumulatedMs > 0;
    return { loaded, hadPausedOnLoad };
  });

  const [gameState, setGameState] = useState<PersistedGameState>(initialSetup.loaded);
  const [displayMs, setDisplayMs] = useState<number>(
    initialSetup.loaded.currentRound.accumulatedMs
  );
  const [restoredPausedNotice, setRestoredPausedNotice] = useState<boolean>(
    initialSetup.hadPausedOnLoad
  );
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  const startPerfRef = useRef<number | null>(null);
  const lastStorageSnapshotRef = useRef<number>(0);
  const latestStateRef = useRef<PersistedGameState>(gameState);

  useEffect(() => {
    latestStateRef.current = gameState;
    saveGameState(gameState);
  }, [gameState]);

  // High-precision rAF loop for stopwatch + periodic safe snapshot to localStorage
  useEffect(() => {
    const { isRunning, accumulatedMs } = gameState.currentRound;
    if (!isRunning) {
      setDisplayMs(accumulatedMs);
      startPerfRef.current = null;
      return;
    }

    if (startPerfRef.current === null) {
      startPerfRef.current = performance.now();
    }

    let rafId = 0;
    const tick = (now: number) => {
      const basePerf = startPerfRef.current ?? now;
      const currentElapsed = accumulatedMs + Math.max(0, now - basePerf);
      setDisplayMs(currentElapsed);

      // Periodic snapshot every 200ms so unexpected tab termination preserves elapsed time
      if (now - lastStorageSnapshotRef.current >= 200) {
        lastStorageSnapshotRef.current = now;
        const snapshotState: PersistedGameState = {
          ...latestStateRef.current,
          currentRound: {
            ...latestStateRef.current.currentRound,
            accumulatedMs: currentElapsed,
            lastTickWallMs: Date.now(),
          },
        };
        saveGameState(snapshotState);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [gameState.currentRound.isRunning, gameState.currentRound.accumulatedMs]);

  // Flush exact accumulated ms in paused-ready state when closing/reloading page
  useEffect(() => {
    const flushOnUnload = () => {
      const cur = latestStateRef.current;
      if (cur.currentRound.isRunning && startPerfRef.current !== null) {
        const currentElapsed =
          cur.currentRound.accumulatedMs + Math.max(0, performance.now() - startPerfRef.current);
        saveGameState({
          ...cur,
          currentRound: {
            ...cur.currentRound,
            isRunning: false,
            timerPhase: 'paused',
            accumulatedMs: currentElapsed,
            lastTickWallMs: null,
          },
        });
      } else {
        saveGameState(cur);
      }
    };

    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
    return () => {
      window.removeEventListener('beforeunload', flushOnUnload);
      window.removeEventListener('pagehide', flushOnUnload);
    };
  }, []);

  const getExactCurrentElapsed = (): number => {
    const { isRunning, accumulatedMs } = gameState.currentRound;
    if (isRunning && startPerfRef.current !== null) {
      return accumulatedMs + Math.max(0, performance.now() - startPerfRef.current);
    }
    return accumulatedMs;
  };

  const handleStartNewBattle = () => {
    setRestoredPausedNotice(false);
    setGameState((prev) => ({
      ...prev,
      hasStarted: true,
      screen: 'battle',
    }));
  };

  const handleContinueSavedGame = () => {
    const targetScreen = getResumeTargetScreen(gameState);
    setGameState((prev) => ({
      ...prev,
      hasStarted: true,
      screen: targetScreen,
    }));
  };

  const handleStartTimer = () => {
    if (gameState.currentRound.timerPhase !== 'idle') return;
    playStartBeep();
    setRestoredPausedNotice(false);
    startPerfRef.current = performance.now();
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        timerPhase: 'running',
        isRunning: true,
        accumulatedMs: 0,
        lastReviewMs: null,
        lastTickWallMs: Date.now(),
      },
    }));
  };

  const handlePauseTimer = () => {
    if (!gameState.currentRound.isRunning) return;
    const elapsed = getExactCurrentElapsed();
    startPerfRef.current = null;
    setDisplayMs(elapsed);
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        timerPhase: 'paused',
        isRunning: false,
        accumulatedMs: elapsed,
        lastTickWallMs: null,
      },
    }));
  };

  const handleResumeTimer = () => {
    if (gameState.currentRound.timerPhase !== 'paused') return;
    playStartBeep();
    setRestoredPausedNotice(false);
    startPerfRef.current = performance.now();
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        timerPhase: 'running',
        isRunning: true,
        lastTickWallMs: Date.now(),
      },
    }));
  };

  const handleStopTimer = () => {
    if (
      gameState.currentRound.timerPhase !== 'running' &&
      gameState.currentRound.timerPhase !== 'paused'
    ) {
      return;
    }
    const elapsed = getExactCurrentElapsed();
    startPerfRef.current = null;
    setDisplayMs(elapsed);
    setRestoredPausedNotice(false);
    playStopBeep();

    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        timerPhase: 'pending_review',
        isRunning: false,
        accumulatedMs: elapsed,
        lastReviewMs: elapsed,
        lastTickWallMs: null,
      },
    }));
  };

  const handleRetryAttempt = () => {
    startPerfRef.current = null;
    setDisplayMs(0);
    setRestoredPausedNotice(false);
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        timerPhase: 'idle',
        isRunning: false,
        accumulatedMs: 0,
        lastReviewMs: null,
        lastTickWallMs: null,
      },
    }));
  };

  const handleMarkCorrect = () => {
    const r = gameState.currentRound;
    if (r.timerPhase !== 'pending_review') return;
    const finalElapsed = r.lastReviewMs ?? r.accumulatedMs;
    const player = r.activePlayer;

    playCorrectChime();

    setGameState((prev) => {
      const curTurn = prev.currentRound[player];
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          timerPhase: 'turn_confirmed',
          [player]: {
            status: 'valid',
            finalMs: finalElapsed,
            attempts: [
              ...curTurn.attempts,
              { elapsedMs: finalElapsed, status: 'valid', recordedAt: Date.now() },
            ],
          },
        },
      };
    });
  };

  const handleMarkError = () => {
    const r = gameState.currentRound;
    if (r.timerPhase !== 'pending_review') return;
    const finalElapsed = r.lastReviewMs ?? r.accumulatedMs;
    const player = r.activePlayer;

    playErrorBuzz();

    setGameState((prev) => {
      const curTurn = prev.currentRound[player];
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          timerPhase: 'error_feedback',
          [player]: {
            ...curTurn,
            attempts: [
              ...curTurn.attempts,
              { elapsedMs: finalElapsed, status: 'error', recordedAt: Date.now() },
            ],
          },
        },
      };
    });
  };

  const handleAcceptErrorTurn = () => {
    const r = gameState.currentRound;
    if (r.timerPhase !== 'error_feedback') return;
    const player = r.activePlayer;

    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        timerPhase: 'turn_confirmed',
        [player]: {
          ...prev.currentRound[player],
          status: 'error',
          finalMs: null,
        },
      },
    }));
  };

  const handleAdvanceTurn = () => {
    const r = gameState.currentRound;
    if (r[r.activePlayer].status === 'pending') return;

    const otherPlayer = r.activePlayer === 'razmik' ? 'gayane' : 'razmik';
    const otherDone = r[otherPlayer].status !== 'pending';

    if (!otherDone) {
      // Switch to second participant for the same tongue twister
      startPerfRef.current = null;
      setDisplayMs(0);
      setRestoredPausedNotice(false);
      setGameState((prev) => ({
        ...prev,
        currentRound: {
          ...prev.currentRound,
          activePlayer: otherPlayer,
          timerPhase: 'idle',
          accumulatedMs: 0,
          lastReviewMs: null,
          isRunning: false,
          lastTickWallMs: null,
        },
      }));
      return;
    }

    // Both participants completed this round -> evaluate and show round results
    const outcome = evaluateRoundOutcome(r);
    if (outcome.winner !== 'none') {
      launchConfetti('round');
      playCorrectChime();
    }

    setGameState((prev) => {
      const alreadyRecorded = prev.completedRounds.some(
        (item) => item.roundNumber === outcome.roundNumber
      );
      if (alreadyRecorded) {
        return { ...prev, screen: 'round_result' };
      }

      return {
        ...prev,
        screen: 'round_result',
        scores: {
          razmik: prev.scores.razmik + outcome.pointsAwarded.razmik,
          gayane: prev.scores.gayane + outcome.pointsAwarded.gayane,
        },
        completedRounds: [...prev.completedRounds, outcome],
        lastCompletedRoundNumber: outcome.roundNumber,
      };
    });
  };

  const handleContinueAfterRoundResult = () => {
    const latestOutcome = gameState.completedRounds[gameState.completedRounds.length - 1];
    if (!latestOutcome) return;

    if (latestOutcome.roundNumber >= TOTAL_ROUNDS) {
      playVictoryFanfare();
      launchConfetti('grand');
      setGameState((prev) => ({
        ...prev,
        screen: 'final_results',
      }));
      return;
    }

    if (latestOutcome.roundNumber % 5 === 0) {
      setGameState((prev) => ({
        ...prev,
        screen: 'milestone',
      }));
      return;
    }

    startPerfRef.current = null;
    setDisplayMs(0);
    setGameState((prev) => ({
      ...prev,
      screen: 'battle',
      currentRound: createRoundState(latestOutcome.roundNumber + 1),
    }));
  };

  const handleContinueAfterMilestone = () => {
    const lastNum = gameState.lastCompletedRoundNumber ?? gameState.completedRounds.length;
    const nextNum = Math.min(TOTAL_ROUNDS, lastNum + 1);
    startPerfRef.current = null;
    setDisplayMs(0);
    setGameState((prev) => ({
      ...prev,
      screen: 'battle',
      currentRound: createRoundState(nextNum),
    }));
  };

  const handleManualSaveFlash = () => {
    saveGameState(gameState);
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1800);
  };

  const handleConfirmResetAll = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    startPerfRef.current = null;
    const fresh = createInitialGameState();
    setGameState(fresh);
    setDisplayMs(0);
    setRestoredPausedNotice(false);
    setShowResetConfirm(false);
    setShowResultsModal(false);
    saveGameState(fresh);
  };

  const currentTwister =
    TRABALENGUAS_LIST.find((t) => t.id === gameState.currentRound.roundNumber) ??
    TRABALENGUAS_LIST[0];
  const latestOutcome = gameState.completedRounds[gameState.completedRounds.length - 1];

  const activeMeta = getPlayerMeta(gameState.currentRound.activePlayer);

  return (
    <div className="min-h-screen flex flex-col bg-[#E6F4FE] text-slate-900">
      <ScoreboardHeader
        screen={gameState.screen}
        scores={gameState.scores}
        currentRound={gameState.currentRound}
        completedCount={gameState.completedRounds.length}
        saveFlash={saveFlash}
        onSaveClick={handleManualSaveFlash}
        onOpenResults={() => setShowResultsModal(true)}
        onRequestReset={() => setShowResetConfirm(true)}
      />

      <main className="flex-1">
        {/* Welcome / Resume Screen */}
        {gameState.screen === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
          >
            <div className="bg-white rounded-3xl border border-sky-200 shadow-xl p-6 sm:p-10 flex flex-col gap-7">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm font-bold text-sky-700">
                  <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  <span>Concurso de pronunciación en español · 20 rondas</span>
                </div>
                <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2 text-balance">
                  🏆 ¡Batalla de Trabalenguas!
                </h2>
                <p className="text-base sm:text-lg text-slate-600 font-medium mt-2">
                  Razmik contra Gayane — ¿Quién habla más rápido y con mejor pronunciación?
                </p>
              </div>

              {/* Competitors Spotlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white p-5 shadow-md flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shrink-0">
                    ⚽
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold">Razmik</div>
                    <div className="text-sm text-orange-50 font-medium">
                      Empieza las rondas impares (1, 3, 5…)
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white p-5 shadow-md flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shrink-0">
                    🌸
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold">Gayane</div>
                    <div className="text-sm text-pink-50 font-medium">
                      Empieza las rondas pares (2, 4, 6…)
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules Overview */}
              <div className="rounded-2xl bg-sky-50/80 border border-sky-100 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-700">
                <div>
                  <div className="font-display font-bold text-slate-900 text-base mb-1">
                    1. Mismo reto
                  </div>
                  <p>
                    En cada una de las 20 rondas, ambos participantes leen exactamente el mismo
                    trabalenguas por turnos.
                  </p>
                </div>
                <div>
                  <div className="font-display font-bold text-slate-900 text-base mb-1">
                    2. Cronómetro real
                  </div>
                  <p>
                    Pulsa «Empezar» para activar el cronómetro, «Terminar» al acabar y el profesor
                    confirma si fue correcto.
                  </p>
                </div>
                <div>
                  <div className="font-display font-bold text-slate-900 text-base mb-1">
                    3. Ayuda en armenio
                  </div>
                  <p>
                    Escucha la pronunciación en español y pulsa cualquier palabra o el botón de
                    traducción al armenio cuando lo necesites.
                  </p>
                </div>
              </div>

              {/* Primary CTA: Start OR Continue Saved Match */}
              {!gameState.hasStarted ? (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleStartNewBattle}
                    className="min-h-[60px] px-9 py-4 rounded-2xl font-display text-xl sm:text-2xl font-extrabold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:brightness-105 active:scale-[0.99] shadow-lg transition-all inline-flex items-center gap-3 cursor-pointer"
                  >
                    <Rocket className="w-6 h-6" aria-hidden="true" />
                    <span>🚀 ¡Empezar la batalla!</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-5 flex flex-col items-center gap-4 text-center">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Partida guardada encontrada
                    </div>
                    <div className="font-display text-xl font-extrabold text-slate-900 mt-1">
                      {gameState.completedRounds.length >= TOTAL_ROUNDS
                        ? `Competición completada · Razmik ${gameState.scores.razmik} — ${gameState.scores.gayane} Gayane`
                        : `Ronda ${gameState.currentRound.roundNumber} de ${TOTAL_ROUNDS} · Turno de ${activeMeta.emoji} ${activeMeta.name} · Marcador: ${gameState.scores.razmik}–${gameState.scores.gayane}`}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleContinueSavedGame}
                      className="min-h-[54px] px-7 py-3 rounded-2xl font-display text-lg font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                      <span>▶️ Continuar partida</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowResultsModal(true)}
                      className="min-h-[54px] px-6 py-3 rounded-2xl font-bold text-base text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer"
                    >
                      📊 Ver resultados
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="min-h-[54px] px-6 py-3 rounded-2xl font-bold text-base text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                    >
                      🔄 Reiniciar competición
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Active Battle Stage */}
        {gameState.screen === 'battle' && (
          <BattleStage
            trabalenguas={currentTwister}
            round={gameState.currentRound}
            displayMs={displayMs}
            restoredPausedNotice={restoredPausedNotice}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onStopTimer={handleStopTimer}
            onRetryAttempt={handleRetryAttempt}
            onMarkCorrect={handleMarkCorrect}
            onMarkError={handleMarkError}
            onAcceptErrorTurn={handleAcceptErrorTurn}
            onAdvanceTurn={handleAdvanceTurn}
          />
        )}

        {/* Round Result Screen */}
        {gameState.screen === 'round_result' && latestOutcome && (
          <RoundResultView
            outcome={latestOutcome}
            onContinue={handleContinueAfterRoundResult}
          />
        )}

        {/* Every-5-Rounds Milestone Screen */}
        {gameState.screen === 'milestone' && (
          <MilestoneStandingsView
            afterRound={gameState.lastCompletedRoundNumber ?? gameState.completedRounds.length}
            completedRounds={gameState.completedRounds}
            scores={gameState.scores}
            onContinue={handleContinueAfterMilestone}
          />
        )}

        {/* Final Results Ceremony */}
        {gameState.screen === 'final_results' && (
          <FinalResultsView
            completedRounds={gameState.completedRounds}
            scores={gameState.scores}
            onRequestRestart={() => setShowResetConfirm(true)}
          />
        )}
      </main>

      {/* Live Standings Modal */}
      <LiveResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        completedRounds={gameState.completedRounds}
        scores={gameState.scores}
      />

      {/* Safe Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="reset-dialog-title"
                className="font-display text-2xl font-extrabold text-slate-900"
              >
                ¿Reiniciar la competición?
              </h3>
              <p className="text-sm text-slate-600 mt-1.5">
                Se borrarán todos los puntos, tiempos registrados y el progreso guardado de las 20
                rondas. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[46px] px-5 py-2 rounded-xl font-bold text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAll}
                className="min-h-[46px] px-5 py-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-105 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Sí, reiniciar todo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
