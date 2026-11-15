import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { lookupWordArmenian } from './trabalenguasData';
import { formatStopwatchMs, getPlayerMeta } from './gameHelpers';
import { ActiveRoundState, SpeechSpeed, TrabalenguasItem } from './types';

interface BattleStageProps {
  trabalenguas: TrabalenguasItem;
  round: ActiveRoundState;
  displayMs: number;
  restoredPausedNotice: boolean;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onRetryAttempt: () => void;
  onMarkCorrect: () => void;
  onMarkError: () => void;
  onAcceptErrorTurn: () => void;
  onAdvanceTurn: () => void;
}

const SPEED_RATES: Record<SpeechSpeed, { label: string; rate: number }> = {
  slow: { label: 'Lento', rate: 0.72 },
  normal: { label: 'Normal', rate: 0.96 },
  fast: { label: 'Rápido', rate: 1.24 },
};

export const BattleStage: React.FC<BattleStageProps> = ({
  trabalenguas,
  round,
  displayMs,
  restoredPausedNotice,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onRetryAttempt,
  onMarkCorrect,
  onMarkError,
  onAcceptErrorTurn,
  onAdvanceTurn,
}) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    token: string;
    translation: string;
    index: number;
  } | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const activeMeta = getPlayerMeta(round.activePlayer);
  const isFirstTurn = round.activePlayer === round.firstPlayer;
  const otherPlayer = round.activePlayer === 'razmik' ? 'gayane' : 'razmik';
  const otherMeta = getPlayerMeta(otherPlayer);
  const otherState = round[otherPlayer];

  const isRazmik = round.activePlayer === 'razmik';
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Reset translation & selected word when round or player changes
  useEffect(() => {
    setShowTranslation(false);
    setSelectedWord(null);
  }, [round.roundNumber, round.activePlayer]);

  // Load browser voices
  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) setVoices(list);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [speechSupported]);

  // Stop speech cleanly on unmount or round change
  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [round.roundNumber, speechSupported]);

  const pickSpanishVoice = (): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;
    // Prioridad 1: acento de España (es-ES)
    const spainExact = voices.find((v) => v.lang.toLowerCase() === 'es-es' || v.lang.toLowerCase() === 'es_es');
    if (spainExact) return spainExact;
    const spainStarts = voices.find((v) => v.lang.toLowerCase().startsWith('es-es'));
    if (spainStarts) return spainStarts;
    // Prioridad 2: cualquier voz en español
    const anySpanish = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    return anySpanish ?? null;
  };

  const speakText = (textToSpeak: string, speedOverride?: number) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const chosenVoice = pickSpanishVoice();
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = 'es-ES';
    }
    utterance.rate = speedOverride ?? SPEED_RATES[speechSpeed].rate;
    utterance.pitch = 1.02;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = () => {
    if (!speechSupported) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakText(trabalenguas.text);
    }
  };

  const handleSpeedChange = (speed: SpeechSpeed) => {
    setSpeechSpeed(speed);
    if (isSpeaking && speechSupported) {
      speakText(trabalenguas.text, SPEED_RATES[speed].rate);
    }
  };

  const words = useMemo(() => trabalenguas.text.split(' '), [trabalenguas.text]);

  const bothDoneInRound =
    round.razmik.status !== 'pending' && round.gayane.status !== 'pending';

  return (
    <motion.div
      key={`round-${round.roundNumber}-${round.activePlayer}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col gap-5"
    >
      {/* Active Turn Banner */}
      <div
        className={`rounded-3xl p-4 sm:p-5 border-2 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isRazmik
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-600 text-white'
            : 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-600 text-white'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-4xl shrink-0">
            {activeMeta.emoji}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white/90">
              {isFirstTurn ? 'Primer turno de la ronda' : 'Segundo turno de la ronda'} · Ronda{' '}
              {round.roundNumber} de 20
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
              Turno de {activeMeta.name}
            </h2>
          </div>
        </div>

        {/* Opponent's score in this round if already finished */}
        {otherState.status !== 'pending' && (
          <div className="bg-slate-950/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-sm font-semibold text-white flex items-center gap-2.5 self-start sm:self-center">
            <span>{otherMeta.emoji}</span>
            <span>{otherMeta.name}:</span>
            {otherState.status === 'valid' && otherState.finalMs !== null ? (
              <span className="font-stopwatch text-yellow-300 text-base font-bold">
                {formatStopwatchMs(otherState.finalMs)}
              </span>
            ) : (
              <span className="text-rose-100">Con errores</span>
            )}
          </div>
        )}
      </div>

      {/* Main Trabalenguas Stage Card */}
      <section className="bg-white rounded-3xl border border-sky-200 shadow-md p-5 sm:p-8 flex flex-col gap-5">
        {/* Card Header & Audio Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-sky-700">
              <span>Trabalenguas {trabalenguas.id} de 20</span>
              <span aria-hidden="true">·</span>
              <span>{trabalenguas.soundFocus}</span>
              <span aria-hidden="true">·</span>
              <span>Dificultad: {trabalenguas.difficulty}</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <span aria-hidden="true">{trabalenguas.emoji}</span>
              <span>{trabalenguas.title}</span>
            </h3>
          </div>

          {/* Audio Controls (no effect on timer) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              disabled={!speechSupported}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm inline-flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                isSpeaking
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:brightness-105'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:brightness-105 disabled:opacity-50'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>⏹️ Detener audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>🔊 Escuchar trabalenguas</span>
                </>
              )}
            </button>

            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200"
              role="group"
              aria-label="Velocidad de lectura"
            >
              {(Object.keys(SPEED_RATES) as SpeechSpeed[]).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => handleSpeedChange(sp)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    speechSpeed === sp
                      ? 'bg-white text-sky-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {SPEED_RATES[sp].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clickable Spanish Tongue Twister Text */}
        <div className="relative">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Pulsa cualquier palabra en español para ver su traducción al armenio:
          </p>
          <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-5 sm:p-7">
            <p className="text-2xl sm:text-3xl md:text-[2.1rem] leading-[1.6] font-bold text-slate-900 tracking-tight">
              {words.map((word, idx) => {
                const isSelected = selectedWord?.index === idx;
                return (
                  <React.Fragment key={`${word}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => {
                        const translation = lookupWordArmenian(word);
                        setSelectedWord(
                          isSelected ? null : { token: word, translation, index: idx }
                        );
                      }}
                      className={`inline rounded-lg px-1 -mx-0.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                        isSelected
                          ? 'bg-amber-200 text-slate-950 underline decoration-amber-600 decoration-2 underline-offset-4'
                          : 'hover:bg-sky-200/70 hover:text-sky-950'
                      }`}
                    >
                      {word}
                    </button>
                    {idx < words.length - 1 ? ' ' : ''}
                  </React.Fragment>
                );
              })}
            </p>
          </div>

          {/* Word-Level Armenian Translation Popover */}
          {selectedWord && (
            <div
              role="dialog"
              aria-label="Traducción de palabra al armenio"
              className="mt-3 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 border border-slate-700"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base sm:text-lg font-bold text-amber-300">
                  {selectedWord.token.replace(/[.,;:!?]/g, '')}
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  →
                </span>
                <span className="font-armenian text-base sm:text-lg font-semibold text-white">
                  {selectedWord.translation}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() =>
                      speakText(selectedWord.token.replace(/[.,;:!?¡¿]/g, ''), 0.85)
                    }
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Escuchar palabra</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedWord(null)}
                  className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 inline-flex items-center justify-center cursor-pointer"
                  aria-label="Cerrar traducción de palabra"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Full Eastern Armenian Translation Toggle */}
        <div className="flex flex-col gap-3">
          <div>
            <button
              type="button"
              onClick={() => setShowTranslation((prev) => !prev)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {showTranslation ? (
                <>
                  <EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>🙈 Ocultar traducción</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>👁️ Mostrar traducción</span>
                </>
              )}
            </button>
          </div>

          {showTranslation && (
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-4 sm:p-5">
              <div className="text-xs font-bold text-indigo-700 mb-1">
                Traducción al armenio oriental (Հայերեն)
              </div>
              <p className="font-armenian text-lg sm:text-xl leading-relaxed text-slate-900 font-medium">
                {trabalenguas.armenianTranslation}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Electronic Stopwatch & Judge Panel */}
      <section className="bg-white rounded-3xl border border-sky-200 shadow-md p-5 sm:p-7 flex flex-col items-center gap-5">
        {/* Digital Electronic Clock */}
        <div className="w-full max-w-md rounded-2xl bg-[#0B1120] border-4 border-slate-800 shadow-inner px-6 py-5 text-center">
          <div className="text-xs font-semibold tracking-wider text-slate-400 mb-1">
            CRONÓMETRO OFICIAL · {activeMeta.name.toUpperCase()}
          </div>
          <div
            className="font-stopwatch text-5xl sm:text-6xl md:text-7xl font-extrabold text-yellow-400 tracking-tight select-none"
            aria-live="off"
          >
            {formatStopwatchMs(displayMs)}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-400">
            {round.timerPhase === 'idle' && 'Listo — pulsa «Empezar» cuando empieces a leer'}
            {round.timerPhase === 'running' && '⏱️ Cronómetro en marcha... ¡Lee en voz alta!'}
            {round.timerPhase === 'paused' && '⏸️ Cronómetro en pausa'}
            {round.timerPhase === 'pending_review' && '⏹️ Tiempo detenido — pendiente de confirmación'}
            {round.timerPhase === 'error_feedback' && '⚠️ Intento con errores registrado'}
            {round.timerPhase === 'turn_confirmed' && '✅ Turno confirmado'}
          </div>
        </div>

        {restoredPausedNotice && round.timerPhase === 'paused' && (
          <div className="w-full max-w-xl rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 text-center font-medium">
            Se ha recuperado tu partida en pausa con el tiempo acumulado antes de cerrar la página.
            Pulsa «Continuar» para seguir o «Reintentar» para reiniciar este turno.
          </div>
        )}

        {/* Phase-Specific Controls */}
        {round.timerPhase === 'idle' && (
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button
              type="button"
              onClick={onStartTimer}
              className="min-h-[54px] px-8 py-3 rounded-2xl font-display text-lg sm:text-xl font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 active:scale-[0.98] shadow-md transition-all inline-flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>▶️ Empezar</span>
            </button>
          </div>
        )}

        {round.timerPhase === 'running' && (
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button
              type="button"
              onClick={onPauseTimer}
              className="min-h-[50px] px-6 py-2.5 rounded-2xl font-bold text-base text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-400 hover:brightness-105 active:scale-[0.98] shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-5 h-5" aria-hidden="true" />
              <span>⏸️ Pausar</span>
            </button>

            <button
              type="button"
              onClick={onStopTimer}
              className="min-h-[50px] px-7 py-2.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-105 active:scale-[0.98] shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>⏹️ Terminar</span>
            </button>

            <button
              type="button"
              onClick={onRetryAttempt}
              className="min-h-[50px] px-5 py-2.5 rounded-2xl font-bold text-base text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>🔄 Reintentar</span>
            </button>
          </div>
        )}

        {round.timerPhase === 'paused' && (
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button
              type="button"
              onClick={onResumeTimer}
              className="min-h-[50px] px-6 py-2.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 active:scale-[0.98] shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>▶️ Continuar</span>
            </button>

            <button
              type="button"
              onClick={onStopTimer}
              className="min-h-[50px] px-7 py-2.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-105 active:scale-[0.98] shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>⏹️ Terminar</span>
            </button>

            <button
              type="button"
              onClick={onRetryAttempt}
              className="min-h-[50px] px-5 py-2.5 rounded-2xl font-bold text-base text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>🔄 Reintentar</span>
            </button>
          </div>
        )}

        {round.timerPhase === 'pending_review' && (
          <div className="w-full max-w-2xl rounded-2xl bg-sky-50 border-2 border-sky-200 p-5 text-center flex flex-col items-center gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sky-700">
                Verificación del profesor
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {activeMeta.name}:{' '}
                <span className="font-stopwatch text-sky-700">
                  {formatStopwatchMs(round.lastReviewMs ?? displayMs)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                ¿{activeMeta.name} ha pronunciado el trabalenguas correctamente?
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onMarkCorrect}
                className="min-h-[50px] px-6 py-2.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-105 shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>✅ Correcto</span>
              </button>

              <button
                type="button"
                onClick={onMarkError}
                className="min-h-[50px] px-6 py-2.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-rose-600 hover:brightness-105 shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span>❌ Con errores</span>
              </button>

              <button
                type="button"
                onClick={onRetryAttempt}
                className="min-h-[50px] px-5 py-2.5 rounded-2xl font-bold text-base text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>🔄 Reintentar</span>
              </button>
            </div>
          </div>
        )}

        {round.timerPhase === 'error_feedback' && (
          <div className="w-full max-w-2xl rounded-2xl bg-rose-50 border-2 border-rose-200 p-5 text-center flex flex-col items-center gap-4">
            <div>
              <div className="text-base sm:text-lg font-bold text-rose-900">
                ❌ Intento con errores
              </div>
              <p className="text-sm text-rose-800 mt-1">
                Solo las lecturas confirmadas como «Correcto» suman tiempo válido. Puedes repetir el
                intento ahora o confirmar el turno con error.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onRetryAttempt}
                className={`min-h-[50px] px-6 py-2.5 rounded-2xl font-bold text-base text-white shadow-md transition-all inline-flex items-center gap-2 cursor-pointer ${
                  isRazmik
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-105'
                    : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-105'
                }`}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>🔄 Reintentar</span>
              </button>

              <button
                type="button"
                onClick={onAcceptErrorTurn}
                className="min-h-[50px] px-5 py-2.5 rounded-2xl font-bold text-sm sm:text-base text-rose-900 bg-white hover:bg-rose-100 border border-rose-300 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                <span>Confirmar turno con error</span>
              </button>
            </div>
          </div>
        )}

        {round.timerPhase === 'turn_confirmed' && (
          <div className="w-full max-w-2xl rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-5 text-center flex flex-col items-center gap-4">
            {round[round.activePlayer].status === 'valid' ? (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  ¡Lectura confirmada!
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {activeMeta.emoji} {activeMeta.name}:{' '}
                  <span className="font-stopwatch text-emerald-700">
                    {formatStopwatchMs(round[round.activePlayer].finalMs ?? 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-base font-bold text-rose-800">
                  {activeMeta.emoji} {activeMeta.name} — turno cerrado con errores
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onAdvanceTurn}
              className="min-h-[52px] px-7 py-3 rounded-2xl font-display text-lg font-extrabold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:brightness-105 shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>
                {bothDoneInRound ? '🏆 Ver resultados de la ronda' : '➡️ Siguiente turno'}
              </span>
            </button>
          </div>
        )}
      </section>
    </motion.div>
  );
};
