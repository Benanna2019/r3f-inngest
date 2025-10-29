import { inngest } from './client';
import { sessionChannel } from './channels';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * AI Response Function using Vercel AI SDK
 * Streams text responses from OpenAI and publishes chunks in realtime
 */
export const generateAIResponse = inngest.createFunction(
  {
    id: 'ai-response',
    name: 'Generate AI Response',
  },
  { event: 'ai/question.asked' },
  async ({ event, step, publish }: any) => {
    const { sessionId, question } = event.data;

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      await step.run('publish-error', async () => {
        await publish(
          sessionChannel(sessionId).error({
            error: 'OpenAI API key not configured',
            recoverable: false,
            timestamp: new Date().toISOString(),
          })
        );
      });
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Publish start
    await step.run('publish-start', async () => {
      await publish(
        sessionChannel(sessionId).progress({
          step: 'initialization',
          status: 'running',
          message: 'Thinking about your question...',
          progress: 10,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Generate AI response with streaming
    await step.run('stream-ai-response', async () => {
      try {
        // Publish processing status
        await publish(
          sessionChannel(sessionId).progress({
            step: 'processing',
            status: 'running',
            message: 'Processing your question...',
            progress: 30,
            timestamp: new Date().toISOString(),
          })
        );

        // Stream response using AI SDK
        const result = await streamText({
          model: openai('gpt-4o-mini'), // Fast, cost-effective model
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful, friendly AI assistant. Provide thoughtful, clear, and concise responses.',
            },
            {
              role: 'user',
              content: question,
            },
          ],
          temperature: 0.7,
        });

        let fullResponse = '';
        let chunkCount = 0;

        // Stream text chunks
        for await (const chunk of result.textStream) {
          fullResponse += chunk;
          chunkCount++;

          // Publish chunk (fire-and-forget to avoid blocking)
          publish(
            sessionChannel(sessionId)['text-chunk']({
              chunk,
              isComplete: false,
              timestamp: new Date().toISOString(),
            })
          ).catch((err: Error) => console.error('Error publishing chunk:', err.message));

          // Update progress every 10 chunks
          if (chunkCount % 10 === 0) {
            publish(
              sessionChannel(sessionId).progress({
                step: 'streaming',
                status: 'running',
                message: 'Streaming response...',
                progress: Math.min(50 + chunkCount, 90),
                timestamp: new Date().toISOString(),
              })
            ).catch((err: Error) => console.error('Error publishing progress:', err.message));
          }
        }

        // Signal completion
        await publish(
          sessionChannel(sessionId)['text-chunk']({
            chunk: '',
            isComplete: true,
            timestamp: new Date().toISOString(),
          })
        );

        // Publish result
        await publish(
          sessionChannel(sessionId).result({
            data: {
              response: fullResponse,
              model: 'gpt-4o-mini',
              chunks: chunkCount,
            },
            timestamp: new Date().toISOString(),
          })
        );

        // Publish completion
        await publish(
          sessionChannel(sessionId).progress({
            step: 'complete',
            status: 'completed',
            message: 'Response complete! ✨',
            progress: 100,
            timestamp: new Date().toISOString(),
          })
        );

        return {
          success: true,
          response: fullResponse,
          chunks: chunkCount,
        };
      } catch (error) {
        console.error('Error generating AI response:', error);

        // Publish error
        await publish(
          sessionChannel(sessionId).error({
            error: error instanceof Error ? error.message : 'Failed to generate response',
            recoverable: true,
            timestamp: new Date().toISOString(),
          })
        );

        throw error;
      }
    });

    return {
      success: true,
      sessionId,
    };
  }
);
