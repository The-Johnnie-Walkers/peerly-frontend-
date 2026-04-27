import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
  import SimplePeer from 'simple-peer';
import { CONNECTIONS_MGMT_URL } from '@/shared/lib/api';

  export type CallType  = 'audio' | 'video';
  export type CallState = 'idle' | 'calling' | 'incoming' | 'active';

  export interface IncomingCallInfo {
    callerId:   string;
    callerName: string;
    type:       CallType;
  }

export function useCall(userId: string, userName: string, token: string) {
    const socketRef      = useRef<Socket | null>(null);
    const peerRef        = useRef<SimplePeer.Instance | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const callTypeRef    = useRef<CallType>('video');

    const [callState,   setCallState]   = useState<CallState>('idle');
    const [callType,    setCallType]    = useState<CallType>('video');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
    const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

    const cleanup = useCallback(() => {
      peerRef.current?.destroy();
      peerRef.current = null;
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

    const createPeer = useCallback((initiator: boolean, targetUserId: string, initialSignal?: SimplePeer.SignalData) => {
      const stream = localStreamRef.current!;

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      });

      peer.on('signal', (signal) => {
        socketRef.current?.emit('call:signal', { targetUserId, signal });
      });

      peer.on('stream', (stream) => {
        setRemoteStream(stream);
        setCallState('active');
      });

      peer.on('close', cleanup);
      peer.on('error', cleanup);

      if (initialSignal) peer.signal(initialSignal);

      peerRef.current = peer;
    }, [cleanup]);

    useEffect(() => {
      if (!userId || !token) return;

      const socket = io(`${CONNECTIONS_MGMT_URL}/calls`, {
        auth: { token, userId, userName },
      });
      socketRef.current = socket;

      socket.on('call:incoming', (data: IncomingCallInfo) => {
        callTypeRef.current = data.type;
        setCallType(data.type);
        setIncomingCall(data);
        setCallState('incoming');
      });

      socket.on('call:accepted', ({ calleeId }: { calleeId: string }) => {
        setRemoteUserId(calleeId);
        createPeer(true, calleeId);
      });

      socket.on('call:rejected', () => {
        cleanup();
      });

      socket.on('call:signal', ({ fromUserId, signal }: { fromUserId: string; signal: SimplePeer.SignalData }) => {
        if (peerRef.current) {
          peerRef.current.signal(signal);
        } else {
          setRemoteUserId(fromUserId);
          createPeer(false, fromUserId, signal);
        }
      });

      socket.on('call:ended', () => cleanup());

      socket.on('call:unavailable', () => {
        cleanup();
      });

      return () => { socket.disconnect(); };
    }, [userId, token, userName, createPeer, cleanup]);


    const initiateCall = useCallback(async (calleeId: string, type: CallType) => {
      callTypeRef.current = type;
      setCallType(type);
      setRemoteUserId(calleeId);
      setCallState('calling');
      await getMedia(type);
      socketRef.current?.emit('call:initiate', { calleeId, type });
    }, [getMedia]);

    const acceptCall = useCallback(async () => {
      if (!incomingCall) return;
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

