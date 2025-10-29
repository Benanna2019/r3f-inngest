import { EventSchemas } from "inngest";

type DemoEventSent = {
  name: "demo/event.sent";
  data: {
    message: string;
  };
};

type DemoRealtimeTest = {
  name: "demo/realtime.test";
  data: {
    sessionId: string;
  };
};

type AIQuestionAsked = {
  name: "ai/question.asked";
  data: {
    sessionId: string;
    question: string;
  };
};

export const schemas = new EventSchemas().fromUnion<
  DemoEventSent | DemoRealtimeTest | AIQuestionAsked
>();