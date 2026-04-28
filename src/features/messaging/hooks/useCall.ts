import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CONNECTIONS_MGMT_URL } from '@/shared/lib/api';

export type CallType  = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'incoming' | 'active';

export interface IncomingCallInfo {
  callerId:   string;
  callerName: string;
  type:       CallType;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useCall(userId: string, userName: string, token: string) {
  const socketRef   = useRef<Socket | null>(null);
  const pcRef       = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Queue ICE candidates that arrive before remote description is set
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const [callState,    setCallState]    = useState<CallState>('idle');
  const [callType,     setCallType]     = useState<CallType>('video');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    iceCandidateQueueRef.current = [];
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCall(null);
    setRemoteUserId(null);
  }, []);

  const getMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const buildPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    localStreamRef.current?.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current!),
    );

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current?.emit('call:signal', {
          targetUserId,
          signal: { type: 'candidate', candidate },
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      setRemoteStream(streams[0]);
      setCallState('active');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanup]);

  useEffect(() => {
    if (!userId || !token) return;

    const socket = io(`${CONNECTIONS_MGMT_URL}/calls`, {
      auth: { token, userId, userName },
    });
    socketRef.current = socket;

    socket.on('call:incoming', (data: IncomingCallInfo) => {
      setCallType(data.type);
      setIncomingCall(data);
      setCallState('incoming');
    });

    // Caller: callee accepted → create & send SDP offer
    socket.on('call:accepted', async ({ calleeId }: { calleeId: string }) => {
      try {
        setRemoteUserId(calleeId);
        const pc = buildPeerConnection(calleeId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:signal', {
          targetUserId: calleeId,
          signal: { type: 'offer', sdp: offer.sdp },
        });
      } catch (err) {
        console.error('[useCall] call:accepted error:', err);
        cleanup();
      }
    });

    socket.on('call:rejected', () => cleanup());

    socket.on('call:signal', async ({ fromUserId, signal }: { fromUserId: string; signal: any }) => {
      try {
        if (signal.type === 'offer') {
          // Callee: received offer → create & send answer
          setRemoteUserId(fromUserId);
          const pc = buildPeerConnection(fromUserId);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          // Drain any ICE candidates that arrived early
          for (const c of iceCandidateQueueRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidateQueueRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:signal', {
            targetUserId: fromUserId,
            signal: { type: 'answer', sdp: answer.sdp },
          });
        } else if (signal.type === 'answer') {
          // Caller: received answer
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
          for (const c of iceCandidateQueueRef.current) {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidateQueueRef.current = [];
        } else if (signal.type === 'candidate') {
          if (pcRef.current?.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            iceCandidateQueueRef.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('[useCall] call:signal error:', err);
      }
    });

    socket.on('call:ended',      () => cleanup());
    socket.on('call:unavailable', () => cleanup());

    return () => { socket.disconnect(); };
  }, [userId, token, userName, buildPeerConnection, cleanup]);

  const initiateCall = useCallback(async (calleeId: string, type: CallType) => {
    setCallType(type);
    setRemoteUserId(calleeId);
    setCallState('calling');
    await getMedia(type);
    socketRef.current?.emit('call:initiate', { calleeId, type });
  }, [getMedia]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    setCallState('calling'); // Fix: show "connecting" UI instead of black screen
    await getMedia(incomingCall.type);
    socketRef.current?.emit('call:accept', { callerId: incomingCall.callerId });
    setIncomingCall(null);
  }, [incomingCall, getMedia]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('call:reject', { callerId: incomingCall.callerId });
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (remoteUserId) {
      socketRef.current?.emit('call:end', { targetUserId: remoteUserId });
    }
    cleanup();
  }, [remoteUserId, cleanup]);

  return {
    callState,
    callType,
    incomingCall,
    remoteStream,
    localStreamRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
