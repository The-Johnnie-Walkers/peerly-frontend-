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

const log = (...args: unknown[]) => console.log('[useCall]', ...args);
const err = (...args: unknown[]) => console.error('[useCall]', ...args);

export function useCall(userId: string, userName: string, token: string) {
  const socketRef   = useRef<Socket | null>(null);
  const pcRef       = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const [callState,    setCallState]    = useState<CallState>('idle');
  const [callType,     setCallType]     = useState<CallType>('video');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    log('cleanup called');
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
    log('getMedia', type);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    log('getMedia OK — tracks:', stream.getTracks().map(t => t.kind));
    localStreamRef.current = stream;
    return stream;
  }, []);

  const buildPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    log('buildPeerConnection for', targetUserId);
    const pc = new RTCPeerConnection(ICE_CONFIG);

    const tracks = localStreamRef.current?.getTracks() ?? [];
    log('adding local tracks:', tracks.map(t => t.kind));
    tracks.forEach(track => pc.addTrack(track, localStreamRef.current!));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        log('ICE candidate generated → sending to', targetUserId);
        socketRef.current?.emit('call:signal', {
          targetUserId,
          signal: { type: 'candidate', candidate },
        });
      } else {
        log('ICE gathering complete');
      }
    };

    pc.onicegatheringstatechange = () =>
      log('ICE gathering state:', pc.iceGatheringState);

    pc.oniceconnectionstatechange = () =>
      log('ICE connection state:', pc.iceConnectionState);

    pc.onconnectionstatechange = () => {
      log('PeerConnection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        err('Connection failed/disconnected → cleanup');
        cleanup();
      }
    };

    pc.onsignalingstatechange = () =>
      log('Signaling state:', pc.signalingState);

    pc.ontrack = ({ streams, track }) => {
      log('ontrack fired! kind:', track.kind, 'streams:', streams.length);
      setRemoteStream(streams[0]);
      setCallState('active');
    };

    pcRef.current = pc;
    return pc;
  }, [cleanup]);

  useEffect(() => {
    if (!userId || !token) return;

    log('connecting socket, userId:', userId);
    const socket = io(`${CONNECTIONS_MGMT_URL}/calls`, {
      auth: { token, userId, userName },
    });
    socketRef.current = socket;

    socket.on('connect', () => log('socket connected, id:', socket.id));
    socket.on('disconnect', reason => log('socket disconnected:', reason));
    socket.on('connect_error', e => err('socket connect_error:', e.message));

    socket.on('call:incoming', (data: IncomingCallInfo) => {
      log('call:incoming from', data.callerId, 'type:', data.type);
      setCallType(data.type);
      setIncomingCall(data);
      setCallState('incoming');
    });

    socket.on('call:accepted', async ({ calleeId }: { calleeId: string }) => {
      log('call:accepted — callee:', calleeId, '— creating offer');
      try {
        setRemoteUserId(calleeId);
        const pc = buildPeerConnection(calleeId);
        const offer = await pc.createOffer();
        log('offer created, setting local description');
        await pc.setLocalDescription(offer);
        log('local description set — sending offer to', calleeId);
        socket.emit('call:signal', {
          targetUserId: calleeId,
          signal: { type: 'offer', sdp: pc.localDescription!.sdp },
        });
      } catch (e) {
        err('call:accepted handler error:', e);
        cleanup();
      }
    });

    socket.on('call:rejected', () => { log('call:rejected'); cleanup(); });

    socket.on('call:signal', async ({ fromUserId, signal }: { fromUserId: string; signal: any }) => {
      log('call:signal received, type:', signal?.type, 'from:', fromUserId);
      try {
        if (signal.type === 'offer') {
          log('processing offer — building PC for', fromUserId);
          setRemoteUserId(fromUserId);
          const pc = buildPeerConnection(fromUserId);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          log('remote description (offer) set — draining ICE queue:', iceCandidateQueueRef.current.length);
          for (const c of iceCandidateQueueRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidateQueueRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          log('answer created — sending to', fromUserId);
          socket.emit('call:signal', {
            targetUserId: fromUserId,
            signal: { type: 'answer', sdp: pc.localDescription!.sdp },
          });

        } else if (signal.type === 'answer') {
          log('processing answer from', fromUserId);
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
          log('remote description (answer) set — draining ICE queue:', iceCandidateQueueRef.current.length);
          for (const c of iceCandidateQueueRef.current) {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidateQueueRef.current = [];

        } else if (signal.type === 'candidate') {
          if (pcRef.current?.remoteDescription) {
            log('adding ICE candidate from', fromUserId);
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            log('queuing ICE candidate (no remote description yet)');
            iceCandidateQueueRef.current.push(signal.candidate);
          }
        } else {
          err('unknown signal type:', signal?.type);
        }
      } catch (e) {
        err('call:signal handler error:', e);
      }
    });

    socket.on('call:ended',      () => { log('call:ended'); cleanup(); });
    socket.on('call:unavailable', () => { log('call:unavailable'); cleanup(); });

    return () => {
      log('disconnecting socket');
      socket.disconnect();
    };
  }, [userId, token, userName, buildPeerConnection, cleanup]);

  const initiateCall = useCallback(async (calleeId: string, type: CallType) => {
    log('initiateCall → calleeId:', calleeId, 'type:', type);
    setCallType(type);
    setRemoteUserId(calleeId);
    setCallState('calling');
    await getMedia(type);
    log('emitting call:initiate');
    socketRef.current?.emit('call:initiate', { calleeId, type });
  }, [getMedia]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    log('acceptCall — callerId:', incomingCall.callerId);
    setCallState('calling');
    await getMedia(incomingCall.type);
    log('emitting call:accept');
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
