import { useState, useEffect } from 'react';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { getSessionSubscriptionToken } from '../inngest/subscription-tokens';

interface RealtimeDemoProps {
  sessionId: string;
}

export function RealtimeDemo({ sessionId }: RealtimeDemoProps) {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [progressSteps, setProgressSteps] = useState<Array<{
    step: string;
    status: string;
    message: string;
    progress: number;
    timestamp: string;
  }>>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to realtime updates
  const { freshData, data, error: subscriptionError, state } = useInngestSubscription({
    refreshToken: async () => {
      const token = await getSessionSubscriptionToken({ data: sessionId });
      return token;
    },
  });

  // Process incoming realtime updates
  useEffect(() => {
    if (!freshData || freshData.length === 0) return;

    freshData.forEach((update) => {
      console.log('Received update:', update.topic, update.data);

      switch (update.topic) {
        case 'progress':
          setProgressSteps((prev) => {
            // Update existing step or add new one
            const existingIndex = prev.findIndex((s) => s.step === update.data.step);
            if (existingIndex >= 0) {
              const newSteps = [...prev];
              newSteps[existingIndex] = update.data;
              return newSteps;
            }
            return [...prev, update.data];
          });
          break;

        case 'text-chunk':
          if (update.data.isComplete) {
            setIsStreaming(false);
          } else {
            setIsStreaming(true);
            setStreamedText((prev) => prev + update.data.chunk);
          }
          break;

        case 'result':
          setResult(update.data.data);
          break;

        case 'error':
          setError(update.data.error);
          break;
      }
    });
  }, [freshData]); // Use freshData to only process new updates!

  // Show subscription error
  if (subscriptionError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">Subscription Error</h3>
        <p className="text-red-600">{subscriptionError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            String(state) === 'connected'
              ? 'bg-green-500'
              : String(state) === 'connecting'
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}
        />
        <span className="capitalize">{String(state)}</span>
      </div>

      {/* Progress Steps */}
      {progressSteps.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Progress</h3>
          <div className="space-y-2">
            {progressSteps.map((step, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{step.step}</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      step.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : step.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : step.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{step.message}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{step.progress}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streamed Text */}
      {(streamedText || isStreaming) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Streamed Response</h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="whitespace-pre-wrap">
              {streamedText}
              {isStreaming && <span className="inline-block animate-pulse">▊</span>}
            </p>
          </div>
        </div>
      )}

      {/* Final Result */}
      {result && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Result</h3>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Debug: All Updates */}
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-gray-600 hover:text-gray-800">
          Debug: All Updates ({data.length})
        </summary>
        <div className="mt-2 p-3 bg-gray-100 rounded max-h-64 overflow-auto">
          <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}

