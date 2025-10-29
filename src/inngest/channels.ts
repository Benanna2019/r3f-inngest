import { channel, topic } from '@inngest/realtime';

/**
 * Session-scoped channel for realtime updates
 * Each session gets its own isolated channel for progress, text streaming, and results
 */
export const sessionChannel = channel((sessionId: string) => `session-${sessionId}`)
  // Progress updates for multi-step workflows
  .addTopic(
    topic('progress').type<{
      step: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      message: string;
      progress: number; // 0-100
      timestamp: string;
      metadata?: Record<string, string | number | boolean>;
    }>()
  )
  // Text streaming (e.g., AI responses)
  .addTopic(
    topic('text-chunk').type<{
      chunk: string;
      isComplete: boolean;
      timestamp: string;
    }>()
  )
  // Final results
  .addTopic(
    topic('result').type<{
      data: any;
      timestamp: string;
    }>()
  )
  // Error notifications
  .addTopic(
    topic('error').type<{
      error: string;
      recoverable: boolean;
      timestamp: string;
    }>()
  );

/**
 * Global channel for system-wide notifications
 */
export const globalChannel = channel('global-updates')
  .addTopic(
    topic('notification').type<{
      message: string;
      type: 'info' | 'warning' | 'error' | 'success';
      timestamp: string;
    }>()
  );

