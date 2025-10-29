import { createServerFn } from '@tanstack/react-start';
import { getSubscriptionToken } from '@inngest/realtime';
import { inngest } from './client';
import { sessionChannel, globalChannel } from './channels';

/**
 * Generate a subscription token for a specific session
 * This token allows the client to subscribe to realtime updates for that session
 */
export const getSessionSubscriptionToken = createServerFn({ method: 'GET' })
  .inputValidator((sessionId: string) => sessionId)
  .handler(async ({ data }) => {
    // TODO: Add authentication/authorization checks here
    // Verify the current user has access to this session
    
    const token = await getSubscriptionToken(inngest, {
      channel: sessionChannel(data) as any, // Type assertion needed (known Inngest typing issue)
      topics: ['progress', 'text-chunk', 'result', 'error'],
    });
    
    return token;
  });

/**
 * Generate a subscription token for global notifications
 */
export const getGlobalSubscriptionToken = createServerFn({ method: 'GET' }).handler(async () => {
  const token = await getSubscriptionToken(inngest, {
    channel: globalChannel as any,
    topics: ['notification'],
  });
  
  return token;
});

/**
 * Trigger a realtime demo event
 * This server function sends an event to Inngest which triggers the realtime demo workflow
 */
export const triggerRealtimeDemo = createServerFn({ method: 'POST' })
  .inputValidator((sessionId: string) => sessionId)
  .handler(async ({ data }) => {
    // Send event to Inngest to trigger the realtime demo function
    await inngest.send({
      name: 'demo/realtime.test',
      data: {
        sessionId: data,
      },
    });
    
    return { success: true, sessionId: data };
  });

/**
 * Ask an AI question with streaming response
 * This server function sends the question to Inngest which triggers the AI response workflow
 */
export const askAIQuestion = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; question: string }) => data)
  .handler(async ({ data }) => {
    // Validate inputs
    if (!data.question || data.question.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }

    // Send event to Inngest to trigger the AI response function
    await inngest.send({
      name: 'ai/question.asked',
      data: {
        sessionId: data.sessionId,
        question: data.question,
      },
    });
    
    return { success: true, sessionId: data.sessionId };
  });

