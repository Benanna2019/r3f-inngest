import { useState, useEffect } from 'react';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { getSessionSubscriptionToken } from '../inngest/subscription-tokens';
import { AnimatedSentience, type AnimationState } from './AnimatedSentience';

interface AIOrbProps {
  sessionId: string;
  onComplete?: (result: any) => void;
}

export function AIOrb({ sessionId, onComplete }: AIOrbProps) {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Subscribe to realtime updates
  const { freshData, error: subscriptionError, state: connectionState } = useInngestSubscription({
    refreshToken: async () => {
      const token = await getSessionSubscriptionToken({ data: sessionId });
      return token;
    },
  });

  // Process incoming realtime updates and update animation state
  useEffect(() => {
    if (!freshData || freshData.length === 0) return;

    freshData.forEach((update) => {
      console.log('AI Orb received:', update.topic, update.data);

      switch (update.topic) {
        case 'progress':
          // Update status message
          setCurrentStatus(update.data.message);
          
          // Set animation based on progress
          if (update.data.status === 'running') {
            if (update.data.progress < 30) {
              setAnimationState('processing');
            } else {
              setAnimationState('processing'); // Keep processing until streaming
            }
          } else if (update.data.status === 'completed') {
            setAnimationState('complete');
          }
          break;

        case 'text-chunk':
          if (update.data.isComplete) {
            setIsStreaming(false);
            setAnimationState('complete');
            // After a delay, return to idle
            setTimeout(() => {
              setAnimationState('idle');
            }, 2000);
          } else {
            setIsStreaming(true);
            setAnimationState('streaming');
            setStreamedText((prev) => prev + update.data.chunk);
          }
          break;

        case 'result':
          setAnimationState('complete');
          if (onComplete) {
            onComplete(update.data.data);
          }
          // Return to idle after showing complete state
          setTimeout(() => {
            setAnimationState('idle');
          }, 3000);
          break;

        case 'error':
          setError(update.data.error);
          setAnimationState('idle');
          break;
      }
    });
  }, [freshData, onComplete]);

  // Show subscription error
  if (subscriptionError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="font-semibold">Connection Error</p>
          <p className="text-sm">{subscriptionError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Animated Sentience Orb - Full background */}
      <div className="absolute inset-0">
        <AnimatedSentience animationState={animationState} />
      </div>

      {/* Overlay content - centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="max-w-2xl w-full px-8 space-y-4">
          {/* Connection Status Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm pointer-events-auto">
            <div
              className={`w-2 h-2 rounded-full ${
                String(connectionState) === 'connected'
                  ? 'bg-green-400'
                  : String(connectionState) === 'connecting'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
              }`}
            />
            <span className="text-white/80 capitalize">{String(connectionState)}</span>
          </div>

          {/* Status Message */}
          {currentStatus && (
            <div className="text-center">
              <p className="text-white/90 text-lg font-medium backdrop-blur-sm bg-black/20 rounded-lg px-4 py-2 inline-block">
                {currentStatus}
              </p>
            </div>
          )}

          {/* Streamed Text */}
          {(streamedText || isStreaming) && (
            <div className="backdrop-blur-md bg-black/40 rounded-2xl p-6 shadow-2xl border border-white/10 max-h-96 overflow-y-auto pointer-events-auto">
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                {streamedText}
                {isStreaming && <span className="inline-block animate-pulse ml-1">▊</span>}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="backdrop-blur-md bg-red-500/20 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
              <p className="text-red-100 font-semibold mb-1">Error</p>
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Animation State Debug (optional - can remove in production) */}
          <div className="text-center">
            <span className="text-white/50 text-xs backdrop-blur-sm bg-black/20 rounded px-2 py-1 inline-block">
              State: {animationState}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

