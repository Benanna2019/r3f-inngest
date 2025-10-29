import { inngest } from './client';
import { sessionChannel } from './channels';

/**
 * Demo function that shows realtime streaming capabilities
 * Publishes progress updates, text chunks, and final results
 */
export const realtimeDemo = inngest.createFunction(
  { id: 'realtime-demo' },
  { event: 'demo/realtime.test' },
  async ({ event, step, publish }) => {
    const { sessionId } = event.data;

    // Step 1: Publish initial progress
    await step.run('publish-start', async () => {
      await publish(
        sessionChannel(sessionId).progress({
          step: 'initialization',
          status: 'running',
          message: 'Starting realtime demo...',
          progress: 0,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Simulate some work
    await step.sleep('wait-1', '1s');

    // Step 2: Publish progress update
    await step.run('publish-processing', async () => {
      await publish(
        sessionChannel(sessionId).progress({
          step: 'processing',
          status: 'running',
          message: 'Processing your request...',
          progress: 33,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Step 3: Stream some text chunks
    await step.run('stream-text', async () => {
      const textChunks = [
        'Hello, ',
        'this is ',
        'a realtime ',
        'streaming ',
        'demo! ',
        '✨',
      ];

      for (const chunk of textChunks) {
        await publish(
          sessionChannel(sessionId)['text-chunk']({
            chunk,
            isComplete: false,
            timestamp: new Date().toISOString(),
          })
        );
        // Small delay between chunks to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Signal completion
      await publish(
        sessionChannel(sessionId)['text-chunk']({
          chunk: '',
          isComplete: true,
          timestamp: new Date().toISOString(),
        })
      );
    });

    await step.sleep('wait-2', '1s');

    // Step 4: Publish near completion
    await step.run('publish-finalizing', async () => {
      await publish(
        sessionChannel(sessionId).progress({
          step: 'finalizing',
          status: 'running',
          message: 'Finalizing results...',
          progress: 90,
          timestamp: new Date().toISOString(),
        })
      );
    });

    await step.sleep('wait-3', '500ms');

    // Step 5: Publish final result
    await step.run('publish-result', async () => {
      await publish(
        sessionChannel(sessionId).result({
          data: {
            message: 'Demo completed successfully!',
            sessionId,
            duration: '~3s',
          },
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Step 6: Publish completion progress
    await step.run('publish-complete', async () => {
      await publish(
        sessionChannel(sessionId).progress({
          step: 'complete',
          status: 'completed',
          message: 'All done! ✅',
          progress: 100,
          timestamp: new Date().toISOString(),
        })
      );
    });

    return {
      success: true,
      sessionId,
      message: 'Realtime demo completed',
    };
  }
);

