import { analyze } from "../src/index";
export type WorkerMessage = {
    type: "configure";
    config: Record<string, unknown>;
} | {
    type: "analyze";
    payload: {
        text?: string;
        metadata?: Record<string, unknown>;
        ts?: number;
    };
};
export type WorkerResponse = {
    type: "configured";
} | {
    type: "result";
    result: ReturnType<typeof analyze>;
};
