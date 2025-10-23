import { analyze, configure } from "../src/index";
self.onmessage = (event) => {
    const message = event.data;
    if (message.type === "configure") {
        configure(message.config || {});
        self.postMessage({ type: "configured" });
        return;
    }
    if (message.type === "analyze") {
        const result = analyze(message.payload || {});
        self.postMessage({ type: "result", result });
    }
};
