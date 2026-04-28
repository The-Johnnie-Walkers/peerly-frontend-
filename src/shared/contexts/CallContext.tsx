import { createContext, useContext, type ReactNode } from 'react';
import { useCall, type CallType } from '@/features/messaging/hooks/useCall';
import { CallModal } from '@/features/messaging/components/CallModal';
import { useCurrentUser } from './CurrentUserContext';
import { authService } from '@/features/auth/services/auth.service';

interface CallContextType {
  initiateCall: (calleeId: string, type: CallType) => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const { userData } = useCurrentUser();
  const token    = authService.getToken() ?? '';
  const userId   = userData?.id ?? '';
  const userName = userData ? `${userData.name} ${userData.lastname ?? ''}`.trim() : '';

  const {
    callState, callType, incomingCall, remoteStream, localStreamRef,
    initiateCall, acceptCall, rejectCall, endCall,
  } = useCall(userId, userName, token);

  return (
    <CallContext.Provider value={{ initiateCall }}>
      <CallModal
        callState={callState}
        callType={callType}
        incomingCall={incomingCall}
        remoteStream={remoteStream}
        localStreamRef={localStreamRef}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
      />
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}
