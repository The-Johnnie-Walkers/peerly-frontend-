import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Phone, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CallState, CallType, IncomingCallInfo } from '../hooks/useCall';

interface Props {
    callState:    CallState;
    callType:     CallType;
    incomingCall: IncomingCallInfo | null;
    remoteStream: MediaStream | null;
    localStreamRef: React.RefObject<MediaStream | null>;
    onAccept:  () => void;
    onReject:  () => void;
    onEnd:     () => void;
}

function CallerAvatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className={`rounded-full bg-primary/15 border-2 border-primary/25 flex items-center justify-center font-display font-bold text-primary select-none ${className}`}>
      {initials}
    </div>
  );
}

function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function CallModal({
  callState,
  callType,
  incomingCall,
  remoteStream,
  localStreamRef,
  onAccept,
  onReject,
  onEnd,
}: Props) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const timer = useCallTimer(callState === 'active');

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current && remoteStream)  remoteAudioRef.current.srcObject  = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localStreamRef]);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }, [muted, localStreamRef]);

  const callerName = incomingCall?.callerName ?? '';
  const isVideo    = callType === 'video';
  const isVisible  = callState !== 'idle';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'hsl(0 0% 6% / 0.92)', backdropFilter: 'blur(20px)' }}
        >

          {/* ── Llamada entrante ── */}
          {callState === 'incoming' && incomingCall && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-xs mx-4 bg-card rounded-3xl shadow-elevated overflow-hidden"
            >
              {/* Franja de color superior */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />

              <div className="px-8 pt-8 pb-6 flex flex-col items-center gap-5">
                {/* Avatar con pulso */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-primary/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.32, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-primary/10"
                  />
                  <CallerAvatar name={callerName} className="relative w-24 h-24 text-3xl" />
                </div>

                <div className="text-center">
                  <p className="font-display font-extrabold text-xl text-foreground">{callerName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isVideo ? 'Videollamada entrante' : 'Llamada de voz entrante'}
                  </p>
                </div>

                <div className="flex gap-6 mt-1">
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={onReject}
                      className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive"
                    >
                      <PhoneOff size={26} />
                    </motion.button>
                    <span className="text-xs text-muted-foreground font-medium">Rechazar</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={onAccept}
                      className="w-16 h-16 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary-foreground"
                    >
                      <Phone size={26} className="text-secondary" />
                    </motion.button>
                    <span className="text-xs text-muted-foreground font-medium">Aceptar</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Esperando que conteste ── */}
          {callState === 'calling' && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-xs mx-4 bg-card rounded-3xl shadow-elevated overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />

              <div className="px-8 pt-8 pb-6 flex flex-col items-center gap-5">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/30"
                  />
                  <CallerAvatar name="?" className="relative w-24 h-24 text-3xl" />
                </div>

                <div className="text-center">
                  <p className="font-display font-extrabold text-xl text-foreground">Llamando…</p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      {isVideo ? 'Videollamada' : 'Llamada de voz'}
                    </motion.span>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 mt-1">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onEnd}
                    className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive"
                  >
                    <PhoneOff size={26} />
                  </motion.button>
                  <span className="text-xs text-muted-foreground font-medium">Cancelar</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Llamada activa — VIDEO ── */}
          {callState === 'active' && isVideo && (
            <div className="relative w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Video local */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-6 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-elevated"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Controles */}
              <div className="absolute bottom-0 left-0 right-0 pb-10 pt-16 flex flex-col items-center gap-4"
                style={{ background: 'linear-gradient(to top, hsl(0 0% 6% / 0.75) 0%, transparent 100%)' }}
              >
                <p className="text-white/60 text-sm font-mono tracking-widest">{timer}</p>
                <div className="flex gap-4">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setMuted(m => !m)}
                    className={`w-14 h-14 rounded-full border flex items-center justify-center ${
                      muted
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/10 border-white/20 text-white/70'
                    }`}
                  >
                    {muted ? <MicOff size={22} /> : <Mic size={22} />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onEnd}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff size={26} className="text-white" />
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* ── Llamada activa — AUDIO ── */}
          {callState === 'active' && !isVideo && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xs mx-4 flex flex-col items-center gap-6"
            >
              <audio ref={remoteAudioRef} autoPlay playsInline />

              {/* Ondas de audio animadas */}
              <div className="relative flex items-center justify-center">
                {[1, 1.5, 2].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4 + i * 0.15, 1], opacity: [0.25, 0, 0.25] }}
                    transition={{ duration: 2, repeat: Infinity, delay: delay * 0.35 }}
                    className="absolute rounded-full bg-primary/20"
                    style={{ width: `${96 + i * 40}px`, height: `${96 + i * 40}px` }}
                  />
                ))}
                <CallerAvatar name={callerName} className="relative w-24 h-24 text-3xl" />
              </div>

              <div className="text-center">
                <p className="font-display font-extrabold text-2xl text-white">{callerName}</p>
                <p className="text-sm text-white/50 mt-1 font-mono tracking-widest">{timer}</p>
              </div>

              <div className="flex gap-4 mt-2">
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setMuted(m => !m)}
                    className={`w-14 h-14 rounded-full border flex items-center justify-center ${
                      muted
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/10 border-white/20 text-white/60'
                    }`}
                  >
                    {muted ? <MicOff size={22} /> : <Mic size={22} />}
                  </motion.button>
                  <span className="text-xs text-white/40 font-medium">{muted ? 'Activar' : 'Silenciar'}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onEnd}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff size={26} className="text-white" />
                  </motion.button>
                  <span className="text-xs text-white/40 font-medium">Colgar</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60"
                  >
                    <Volume2 size={22} />
                  </motion.button>
                  <span className="text-xs text-white/40 font-medium">Altavoz</span>
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
