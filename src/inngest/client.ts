import { Inngest } from 'inngest';
import { realtimeMiddleware } from '@inngest/realtime/middleware';
import { schemas } from './types';

export const inngest = new Inngest({ 
  id: 'tanstack-start-example-basic', 
  schemas,
  middleware: [realtimeMiddleware()], // Required for realtime streaming
});