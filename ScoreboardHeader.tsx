import React from 'react';
import { BarChart3, Check, RotateCcw, Save, Trophy } from 'lucide-react';
import { TOTAL_ROUNDS, formatStopwatchMs } from './gameHelpers';
import { ActiveRoundState, GameScreen, PlayerId } from './types';

interface ScoreboardHeaderProps {
  screen: GameScreen;
  scores: { razmik: number; gayane: number };
  currentRound: ActiveRoundState;
  completedCount: number;
  saveFlash: boolean;
  onSaveClick: () => void;
  onOpenResults: () => void;
  onRequestReset: () => void;
}

export const ScoreboardHeader: React.FC<ScoreboardHeaderProps> = ({
  screen,
  scores,
  currentRound,
  completedCount,
  saveFlash,
  onSaveClick,
  onOpenResults,
  onRequestReset,
}) => {
  const showLiveMatchup =
    screen === 'battle' || screen === 'round_result' || screen === 'milestone';

  const progressPct = Math.min(100, Math.round((completedCount / TOTAL_ROUNDS) * 100));

  const renderPlayerSubstatus = (player: PlayerId) => {
    if (screen !== 'battle') {
      return (
        <span className="text-xs font-medium text-slate-600">
          {player === 'razmik' ? 'Equipo Naranja' : 'Equipo Rosa'}
        </span>
      );
    }

    const turnState = currentRound[player];
    const isActive = currentRound.activePlayer === player;

    if (isActive) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold ${
            player === 'razmik' ? 'text-orange-700' : 'text-pink-700'
          }`}
        >
          <span>▶</span>
          <span>Turno actual</span>
        </span>
      );
    }

    if (turnState.status === 'valid' && turnState.finalMs !== null) {
      return (
        <span className="text-xs font-semibold text-emerald-700 font-stopwatch">
          ✓ {formatStopwatchMs(turnState.finalMs)}
        </span>
      );
    }

    if (turnState.status === 'error') {
      return <span className="text-xs font-semibold text-rose-700">✕ Con errores</span>;
    }

    return <span className="text-xs font-medium text-slate-500">En espera</span>;
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-sky-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
        {/* Top Row: Brand + 3 Utility Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Trophy className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
                ¡Batalla de Trabalenguas!
              </h1>
              <p className="text-xs text-slate-600 truncate">
                Razmik contra Gayane — ¿Quién habla más rápido?
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSaveClick}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                saveFlash
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-900'
              }`}
              title="El progreso se guarda automáticamente en este navegador"
            >
              {saveFlash ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
              )}
              <span>{saveFlash ? '¡Guardado!' : '💾 Progreso guardado'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenResults}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
              <span>📊 Ver resultados</span>
            </button>

            <button
              type="button"
              onClick={onRequestReset}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <span>🔄 Reiniciar competición</span>
            </button>
          </div>
        </div>

        {/* Live Scoreboard Strip */}
        {showLiveMatchup && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2.5 items-stretch">
            {/* Razmik Card (Orange) */}
            <div
              className={`rounded-2xl px-4 py-2.5 border-2 transition-all flex items-center justify-between gap-3 ${
                screen === 'battle' && currentRound.activePlayer === 'razmik'
                  ? 'bg-gradient-to-r from-orange-100 via-orange-50 to-amber-50 border-orange-500 shadow-md ring-2 ring-orange-300/60'
                  : 'bg-orange-50/70 border-orange-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl shrink-0" aria-hidden="true">
                  ⚽
                </span>
                <div className="min-w-0">
                  <div className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Razmik
                  </div>
                  {renderPlayerSubstatus('razmik')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-orange-600 tabular-nums leading-none">
                  {scores.razmik}
                </div>
                <div className="text-[11px] font-semibold text-orange-800">
                  {scores.razmik === 1 ? 'punto' : 'puntos'}
                </div>
              </div>
            </div>

            {/* Center Round & Progress */}
            <div className="rounded-2xl bg-sky-50 border border-sky-200 px-4 py-2 flex flex-col justify-center items-center min-w-[190px]">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 whitespace-nowrap">
                <span>
                  Ronda {Math.min(currentRound.roundNumber, TOTAL_ROUNDS)} de {TOTAL_ROUNDS}
                </span>
                <span aria-hidden="true" className="text-sky-400">
                  ·
                </span>
                <span className="text-sky-800 tabular-nums">
                  Progreso: {completedCount}/{TOTAL_ROUNDS}
                </span>
              </div>
              <div
                className="w-full h-2.5 bg-sky-200/80 rounded-full overflow-hidden mt-1.5"
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={TOTAL_ROUNDS}
                aria-label={`Progreso: ${completedCount} de ${TOTAL_ROUNDS} rondas`}
              >
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Gayane Card (Pink) */}
            <div
              className={`rounded-2xl px-4 py-2.5 border-2 transition-all flex items-center justify-between gap-3 ${
                screen === 'battle' && currentRound.activePlayer === 'gayane'
                  ? 'bg-gradient-to-r from-pink-100 via-pink-50 to-rose-50 border-pink-500 shadow-md ring-2 ring-pink-300/60'
                  : 'bg-pink-50/70 border-pink-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl shrink-0" aria-hidden="true">
                  🌸
                </span>
                <div className="min-w-0">
                  <div className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Gayane
                  </div>
                  {renderPlayerSubstatus('gayane')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-pink-600 tabular-nums leading-none">
                  {scores.gayane}
                </div>
                <div className="text-[11px] font-semibold text-pink-800">
                  {scores.gayane === 1 ? 'punto' : 'puntos'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
