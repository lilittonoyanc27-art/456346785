import React from 'react';
import { Award, CheckCircle2, Clock, Medal, RotateCcw, Trophy, X } from 'lucide-react';
import { motion } from 'motion/react';
import { TRABALENGUAS_LIST } from './trabalenguasData';
import {
  TOTAL_ROUNDS,
  computePlayerStats,
  formatReadableDuration,
  formatStopwatchMs,
} from './gameHelpers';
import { PlayerTurnState, RoundResult } from './types';

function renderTurnBadge(turn: PlayerTurnState) {
  if (turn.status === 'valid' && turn.finalMs !== null) {
    return (
      <span className="font-stopwatch font-bold text-slate-900">
        {formatStopwatchMs(turn.finalMs)}
      </span>
    );
  }
  if (turn.status === 'error') {
    return <span className="text-rose-700 font-semibold text-xs sm:text-sm">Con errores</span>;
  }
  return <span className="text-slate-400 text-xs sm:text-sm">Pendiente</span>;
}

interface RoundResultViewProps {
  outcome: RoundResult;
  onContinue: () => void;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({ outcome, onContinue }) => {
  const twister = TRABALENGUAS_LIST.find((t) => t.id === outcome.trabalenguasId);
  const isMilestone = outcome.roundNumber % 5 === 0 && outcome.roundNumber < TOTAL_ROUNDS;
  const isFinal = outcome.roundNumber >= TOTAL_ROUNDS;

  let buttonLabel = '➡️ Siguiente ronda';
  if (isMilestone) buttonLabel = `📊 Ver clasificación (Rondas 1–${outcome.roundNumber})`;
  if (isFinal) buttonLabel = '🏆 Ver resultados finales';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
    >
      <div className="bg-white rounded-3xl border border-sky-200 shadow-lg p-6 sm:p-8 flex flex-col gap-6 text-center">
        <div>
          <div className="text-sm font-bold text-sky-700">
            Ronda {outcome.roundNumber} de {TOTAL_ROUNDS} · {twister?.emoji} {twister?.title}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            Ronda {outcome.roundNumber} — Resultados
          </h2>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`rounded-2xl p-5 border-2 flex flex-col items-center gap-2 ${
              outcome.winner === 'razmik' || outcome.winner === 'tie'
                ? 'bg-orange-50 border-orange-500 shadow-sm'
                : 'bg-orange-50/50 border-orange-200'
            }`}
          >
            <div className="text-3xl" aria-hidden="true">
              ⚽
            </div>
            <div className="font-display text-xl font-extrabold text-slate-900">Razmik</div>
            <div className="font-stopwatch text-3xl sm:text-4xl font-extrabold text-orange-600">
              {outcome.razmik.status === 'valid' && outcome.razmik.finalMs !== null
                ? formatStopwatchMs(outcome.razmik.finalMs)
                : 'Con errores'}
            </div>
            {outcome.pointsAwarded.razmik > 0 && (
              <div className="text-sm font-bold text-emerald-700">+1 punto</div>
            )}
          </div>

          <div
            className={`rounded-2xl p-5 border-2 flex flex-col items-center gap-2 ${
              outcome.winner === 'gayane' || outcome.winner === 'tie'
                ? 'bg-pink-50 border-pink-500 shadow-sm'
                : 'bg-pink-50/50 border-pink-200'
            }`}
          >
            <div className="text-3xl" aria-hidden="true">
              🌸
            </div>
            <div className="font-display text-xl font-extrabold text-slate-900">Gayane</div>
            <div className="font-stopwatch text-3xl sm:text-4xl font-extrabold text-pink-600">
              {outcome.gayane.status === 'valid' && outcome.gayane.finalMs !== null
                ? formatStopwatchMs(outcome.gayane.finalMs)
                : 'Con errores'}
            </div>
            {outcome.pointsAwarded.gayane > 0 && (
              <div className="text-sm font-bold text-emerald-700">+1 punto</div>
            )}
          </div>
        </div>

        {/* Winner Announcement */}
        <div
          className={`rounded-2xl p-5 border-2 ${
            outcome.winner === 'razmik'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-600 text-white'
              : outcome.winner === 'gayane'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-600 text-white'
              : outcome.winner === 'tie'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-500 border-sky-600 text-white'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          <div className="font-display text-2xl sm:text-3xl font-extrabold">
            {outcome.winner === 'razmik' && '🏆 ¡Gana Razmik!'}
            {outcome.winner === 'gayane' && '🏆 ¡Gana Gayane!'}
            {outcome.winner === 'tie' && '🤝 ¡Empate exacto! ¡1 punto para cada uno!'}
            {outcome.winner === 'none' && '😅 Ronda sin puntos (ambos con errores)'}
          </div>
          {outcome.differenceMs !== null && (
            <div className="mt-1.5 text-sm sm:text-base font-semibold opacity-95">
              {outcome.differenceMs === 0
                ? 'Diferencia de tiempo: 00:00.00 (¡idénticos hasta la centésima!)'
                : `Diferencia de tiempo: ${formatStopwatchMs(outcome.differenceMs)} (${formatReadableDuration(
                    outcome.differenceMs
                  )})`}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onContinue}
            className="min-h-[54px] px-8 py-3 rounded-2xl font-display text-lg font-extrabold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-105 shadow-md transition-all cursor-pointer"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface MilestoneViewProps {
  afterRound: number;
  completedRounds: RoundResult[];
  scores: { razmik: number; gayane: number };
  onContinue: () => void;
}

export const MilestoneStandingsView: React.FC<MilestoneViewProps> = ({
  afterRound,
  completedRounds,
  scores,
  onContinue,
}) => {
  const rStats = computePlayerStats('razmik', completedRounds, scores.razmik);
  const gStats = computePlayerStats('gayane', completedRounds, scores.gayane);

  const leaderText =
    scores.razmik > scores.gayane
      ? '⚽ Razmik va en cabeza'
      : scores.gayane > scores.razmik
      ? '🌸 Gayane va en cabeza'
      : '🤝 ¡Empate técnico en el marcador!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
    >
      <div className="bg-white rounded-3xl border border-sky-200 shadow-lg p-6 sm:p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
            <Medal className="w-5 h-5" aria-hidden="true" />
            <span>Clasificación intermedia · Bloque de 5 rondas</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            Clasificación tras {afterRound} rondas
          </h2>
          <p className="text-base sm:text-lg font-bold text-sky-700 mt-1">{leaderText}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[rStats, gStats].map((st) => {
            const isRazmik = st.player === 'razmik';
            return (
              <div
                key={st.player}
                className={`rounded-2xl p-5 border-2 ${
                  isRazmik ? 'bg-orange-50/80 border-orange-300' : 'bg-pink-50/80 border-pink-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl" aria-hidden="true">
                      {isRazmik ? '⚽' : '🌸'}
                    </span>
                    <span className="font-display text-2xl font-extrabold text-slate-900">
                      {isRazmik ? 'Razmik' : 'Gayane'}
                    </span>
                  </div>
                  <div
                    className={`font-display text-3xl font-extrabold tabular-nums ${
                      isRazmik ? 'text-orange-600' : 'text-pink-600'
                    }`}
                  >
                    {st.points} pts
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Rondas ganadas:</span>
                    <strong className="tabular-nums">{st.roundsWon}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mejor tiempo:</span>
                    <strong className="font-stopwatch">
                      {st.bestTimeMs !== null ? formatStopwatchMs(st.bestTimeMs) : '—'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Promedio válido:</span>
                    <strong className="font-stopwatch">
                      {st.averageValidMs !== null ? formatStopwatchMs(st.averageValidMs) : '—'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onContinue}
            className="min-h-[54px] px-8 py-3 rounded-2xl font-display text-lg font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 shadow-md transition-all cursor-pointer"
          >
            ➡️ Continuar a la ronda {afterRound + 1}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface FinalResultsViewProps {
  completedRounds: RoundResult[];
  scores: { razmik: number; gayane: number };
  onRequestRestart: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  completedRounds,
  scores,
  onRequestRestart,
}) => {
  const rStats = computePlayerStats('razmik', completedRounds, scores.razmik);
  const gStats = computePlayerStats('gayane', completedRounds, scores.gayane);

  const isTie = scores.razmik === scores.gayane;
  const champion = scores.razmik > scores.gayane ? 'razmik' : 'gayane';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6"
    >
      {/* Winner / Tie Celebration Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-10 text-center text-white shadow-xl border-2 ${
          isTie
            ? 'bg-gradient-to-br from-sky-500 via-indigo-500 to-blue-600 border-indigo-400'
            : champion === 'razmik'
            ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 border-orange-400'
            : 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 border-pink-400'
        }`}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-4">
          <Trophy className="w-9 h-9 text-yellow-200" aria-hidden="true" />
        </div>

        {isTie ? (
          <>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              🤝 ¡La competición terminó en empate!
            </h2>
            <p className="mt-3 text-lg sm:text-xl font-semibold text-white/95 max-w-2xl mx-auto">
              ⚽ Razmik y 🌸 Gayane terminaron con {scores.razmik} puntos cada uno. ¡Ambos son
              campeones de los trabalenguas!
            </p>
          </>
        ) : (
          <>
            <div className="text-base sm:text-lg font-bold text-yellow-100">
              {champion === 'razmik' ? '⚽ ¡Razmik gana la competición!' : '🌸 ¡Gayane gana la competición!'}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-balance">
              🏆 ¡Enhorabuena! ¡Eres el campeón de los trabalenguas!
            </h2>
            <p className="mt-3 text-base sm:text-lg font-semibold text-white/95">
              Marcador final: Razmik {scores.razmik} — {scores.gayane} Gayane
            </p>
          </>
        )}
      </div>

      {/* Detailed Statistics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[rStats, gStats].map((st) => {
          const isRazmik = st.player === 'razmik';
          return (
            <div
              key={st.player}
              className={`bg-white rounded-3xl border-2 p-6 shadow-md flex flex-col gap-4 ${
                isRazmik ? 'border-orange-300' : 'border-pink-300'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden="true">
                    {isRazmik ? '⚽' : '🌸'}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-extrabold text-slate-900">
                      {isRazmik ? 'Razmik' : 'Gayane'}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {st.validAttemptsCount} de {TOTAL_ROUNDS} lecturas válidas
                    </p>
                  </div>
                </div>
                <div
                  className={`font-display text-4xl font-extrabold tabular-nums ${
                    isRazmik ? 'text-orange-600' : 'text-pink-600'
                  }`}
                >
                  {st.points} <span className="text-base font-bold">pts</span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  <dt className="text-slate-500 font-medium">Rondas ganadas</dt>
                  <dd className="font-display text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                    {st.roundsWon}
                    {st.ties > 0 ? ` (+${st.ties} emp.)` : ''}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  <dt className="text-slate-500 font-medium">Tiempo total válido</dt>
                  <dd className="font-stopwatch text-lg font-extrabold text-slate-900 mt-0.5">
                    {st.validAttemptsCount > 0 ? formatReadableDuration(st.totalValidMs) : '—'}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  <dt className="text-slate-500 font-medium">Mejor tiempo individual</dt>
                  <dd className="font-stopwatch text-lg font-extrabold text-emerald-700 mt-0.5">
                    {st.bestTimeMs !== null ? formatStopwatchMs(st.bestTimeMs) : '—'}
                  </dd>
                  {st.bestRoundTitle && (
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Ronda {st.bestRoundNumber}: {st.bestRoundTitle}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  <dt className="text-slate-500 font-medium">Promedio por trabalenguas</dt>
                  <dd className="font-stopwatch text-lg font-extrabold text-sky-700 mt-0.5">
                    {st.averageValidMs !== null ? formatStopwatchMs(st.averageValidMs) : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </section>

      {/* Complete 20-Round Matchup History */}
      <section className="bg-white rounded-3xl border border-sky-200 shadow-md p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
            Historial completo de los 20 enfrentamientos
          </h3>
          <button
            type="button"
            onClick={onRequestRestart}
            className="min-h-[44px] px-5 py-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-105 shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>🔄 Reiniciar competición</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="py-3 pr-3 font-bold">Ronda</th>
                <th className="py-3 px-3 font-bold">Trabalenguas</th>
                <th className="py-3 px-3 font-bold">⚽ Razmik</th>
                <th className="py-3 px-3 font-bold">🌸 Gayane</th>
                <th className="py-3 pl-3 font-bold">Ganador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedRounds.map((r) => {
                const item = TRABALENGUAS_LIST.find((t) => t.id === r.trabalenguasId);
                return (
                  <tr key={r.roundNumber} className="hover:bg-sky-50/50">
                    <td className="py-3 pr-3 font-bold text-slate-700 tabular-nums">
                      #{r.roundNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item?.emoji} {item?.title}
                    </td>
                    <td className="py-3 px-3">{renderTurnBadge(r.razmik)}</td>
                    <td className="py-3 px-3">{renderTurnBadge(r.gayane)}</td>
                    <td className="py-3 pl-3 font-bold">
                      {r.winner === 'razmik' && <span className="text-orange-600">⚽ Razmik</span>}
                      {r.winner === 'gayane' && <span className="text-pink-600">🌸 Gayane</span>}
                      {r.winner === 'tie' && <span className="text-sky-700">🤝 Empate</span>}
                      {r.winner === 'none' && <span className="text-slate-400">Sin punto</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};

interface LiveResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedRounds: RoundResult[];
  scores: { razmik: number; gayane: number };
}

export const LiveResultsModal: React.FC<LiveResultsModalProps> = ({
  isOpen,
  onClose,
  completedRounds,
  scores,
}) => {
  if (!isOpen) return null;

  const rStats = computePlayerStats('razmik', completedRounds, scores.razmik);
  const gStats = computePlayerStats('gayane', completedRounds, scores.gayane);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Resultados y clasificación actual"
    >
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-500" aria-hidden="true" />
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
              Resultados y clasificación ({completedRounds.length}/{TOTAL_ROUNDS} rondas)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center justify-center cursor-pointer"
            aria-label="Cerrar resultados"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[rStats, gStats].map((st) => {
              const isRazmik = st.player === 'razmik';
              return (
                <div
                  key={st.player}
                  className={`rounded-2xl p-4 border-2 ${
                    isRazmik ? 'bg-orange-50 border-orange-200' : 'bg-pink-50 border-pink-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl font-extrabold text-slate-900">
                      {isRazmik ? '⚽ Razmik' : '🌸 Gayane'}
                    </span>
                    <span
                      className={`font-display text-2xl font-extrabold tabular-nums ${
                        isRazmik ? 'text-orange-600' : 'text-pink-600'
                      }`}
                    >
                      {st.points} pts
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      Ganadas: <strong>{st.roundsWon}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                      Mejor:{' '}
                      <strong className="font-stopwatch">
                        {st.bestTimeMs !== null ? formatStopwatchMs(st.bestTimeMs) : '—'}
                      </strong>
                    </span>
                    <span>
                      Promedio:{' '}
                      <strong className="font-stopwatch">
                        {st.averageValidMs !== null ? formatStopwatchMs(st.averageValidMs) : '—'}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rounds Table */}
          {completedRounds.length === 0 ? (
            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-8 text-center text-slate-600 font-medium">
              Todavía no se ha completado ninguna ronda. ¡Empieza la batalla para registrar los
              primeros tiempos!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                    <th className="py-2.5 pr-3 font-bold">Ronda</th>
                    <th className="py-2.5 px-3 font-bold">Trabalenguas</th>
                    <th className="py-2.5 px-3 font-bold">⚽ Razmik</th>
                    <th className="py-2.5 px-3 font-bold">🌸 Gayane</th>
                    <th className="py-2.5 pl-3 font-bold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedRounds.map((r) => {
                    const item = TRABALENGUAS_LIST.find((t) => t.id === r.trabalenguasId);
                    return (
                      <tr key={r.roundNumber}>
                        <td className="py-2.5 pr-3 font-bold text-slate-700 tabular-nums">
                          #{r.roundNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item?.emoji} {item?.title}
                        </td>
                        <td className="py-2.5 px-3">{renderTurnBadge(r.razmik)}</td>
                        <td className="py-2.5 px-3">{renderTurnBadge(r.gayane)}</td>
                        <td className="py-2.5 pl-3 font-bold">
                          {r.winner === 'razmik' && (
                            <span className="text-orange-600">⚽ Razmik</span>
                          )}
                          {r.winner === 'gayane' && (
                            <span className="text-pink-600">🌸 Gayane</span>
                          )}
                          {r.winner === 'tie' && <span className="text-sky-700">🤝 Empate</span>}
                          {r.winner === 'none' && (
                            <span className="text-slate-400">Sin punto</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
