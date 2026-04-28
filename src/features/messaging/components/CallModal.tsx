import { useEffect, useRef } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
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
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Conectar el stream local al elemento <video> (muted para no hacer eco)
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localStreamRef]);

  const isVisible = callState !== 'idle';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
        >
          {/* ── Llamada entrante ── */}
          {callState === 'incoming' && incomingCall && (
            <div className="flex flex-col items-center gap-6 text-white">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-5xl">
                {callType === 'video' ? '📹' : '📞'}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{incomingCall.callerName}</p>
                <p className="text-sm text-white/60 mt-1">
                  {callType === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante'}
                </p>
              </div>
              <div className="flex gap-8">
                <button
                  onClick={onReject}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
                >
                  <PhoneOff size={28} className="text-white" />
                </button>
                <button
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Phone size={28} className="text-white" />
                </button>
              </div>
            </div>
          )}

          {/* ── Esperando que conteste ── */}
          {callState === 'calling' && (
            <div className="flex flex-col items-center gap-6 text-white">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse text-5xl">
                {callType === 'video' ? '📹' : '📞'}
              </div>
              <p className="text-xl font-bold">Llamando...</p>
              <button
                onClick={onEnd}
                className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            </div>
          )}

          {/* ── Llamada activa ── */}
          {callState === 'active' && (
            <div className="relative w-full h-full">
              {/* Video remoto (pantalla completa) */}
              {callType === 'video' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <audio ref={remoteAudioRef} autoPlay playsInline />
                  <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-7xl">
                    🎙️
                  </div>
                </div>
              )}

              {/* Video local (esquina inferior derecha) */}
              {callType === 'video' && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-24 right-4 w-32 h-48 object-cover rounded-2xl border-2 border-white/20 shadow-lg"
                />
              )}

              {/* Controles */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                <button
                  onClick={onEnd}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                >
                  <PhoneOff size={26} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
