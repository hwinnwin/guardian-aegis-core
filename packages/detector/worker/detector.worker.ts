import { analyze, configure } from "../src/index";

export type WorkerMessage =
  | { type: "configure"; config: Record<string, unknown> }
  | { type: "analyze"; payload: { text?: string; metadata?: Record<string, unknown>; ts?: number } };

export type WorkerResponse =
  | { type: "configured" }
  | { type: "result"; result: ReturnType<typeof analyze> };

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === "configure") {
    configure((message.config as any) || {});
    self.postMessage({ type: "configured" } satisfies WorkerResponse);
    return;
  }

  if (message.type === "analyze") {
    const result = analyze(message.payload || {});
    self.postMessage({ type: "result", result } satisfies WorkerResponse);
  }
};
