// packages/buffer/bench/bench-buffer.ts
// Run with: pnpm bench:buffer
// Requires Node with --expose-gc flag for accurate memory measurements

import type { BufferConfig } from "../src/types";

// ========================================
// Type Definitions
// ========================================

interface BufferLike<T = unknown> {
  // Push methods (different implementations may use different names)
  push?: (item: T) => void;
  add?: (item: T) => void;
  enqueue?: (item: T) => void;
  capture?: (item: T) => void;
  
  // Snapshot methods
  snapshot?: (count: number) => T[];
  getRecent?: (count: number) => T[];
  toArray?: () => T[];
  
  // Internal state (for fallback access)
  _array?: T[];
  _buf?: T[];
  buffer?: T[];
}

interface BenchmarkResult {
  name: string;
  value: number;
  unit: string;
  formatted: string;
  metadata?: Record<string, unknown>;
}

interface Interaction {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    isAdult: boolean;
  };
  recipient?: {
    id: string;
    name: string;
  };
  platform: string;
  timestamp: number;
  meta: {
    channel: string;
    severity: number;
    probability: number;
  };
}

interface ProcessWithInternals extends NodeJS.Process {
  _getActiveHandles?: () => unknown[];
  _getActiveRequests?: () => unknown[];
}

type GlobalWithGc = typeof globalThis & {
  gc?: () => void;
};

// ========================================
// Imports with Better Error Handling
// ========================================

let CircularBuffer: new <T>(capacity: number) => BufferLike<T> | undefined;
let RollingBuffer: new <T>(options: BufferConfig | number) => BufferLike<T> | undefined;

const importErrors: string[] = [];

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require("../src/core/circular-buffer");
  CircularBuffer = module.CircularBuffer || module.default;
  if (!CircularBuffer) {
    importErrors.push("CircularBuffer: exported but undefined");
  }
} catch (e) {
  importErrors.push(`CircularBuffer: ${e instanceof Error ? e.message : String(e)}`);
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require("../src/core/rolling-buffer");
  RollingBuffer = module.RollingBuffer || module.default;
  if (!RollingBuffer) {
    importErrors.push("RollingBuffer: exported but undefined");
  }
} catch (e) {
  importErrors.push(`RollingBuffer: ${e instanceof Error ? e.message : String(e)}`);
}

if (!CircularBuffer && !RollingBuffer) {
  console.error("❌ Failed to import buffer implementations:\n");
  importErrors.forEach(err => console.error(`  - ${err}`));
  console.error("\nExpected paths:");
  console.error("  - packages/buffer/src/core/circular-buffer.ts");
  console.error("  - packages/buffer/src/core/rolling-buffer.ts");
  process.exit(1);
}

// ========================================
// Timing & Formatting Utilities
// ========================================

const nowNs = (): bigint => process.hrtime.bigint();

const nsToMs = (ns: bigint): number => Number(ns) / 1_000_000;

const formatLatency = (nsPerOp: number): string => {
  if (nsPerOp < 1_000) return `${nsPerOp.toFixed(1)} ns/op`;
  if (nsPerOp < 1_000_000) return `${(nsPerOp / 1_000).toFixed(2)} µs/op`;
  return `${(nsPerOp / 1_000_000).toFixed(2)} ms/op`;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const gc = (): void => {
  const globalWithGc = globalThis as GlobalWithGc;
  if (typeof globalWithGc.gc === "function") {
    globalWithGc.gc();
    return;
  }
  console.warn("⚠️  GC not available. Run with --expose-gc for accurate memory measurements.");
};

// ========================================
// Buffer Method Adapters (Cached)
// ========================================

class BufferAdapter<T> {
  private pushMethod: ((item: T) => void) | null = null;
  private snapshotMethod: ((count: number) => T[]) | null = null;
  
  constructor(private buffer: BufferLike<T>) {
    // Cache method lookups once during construction
    this.pushMethod = 
      buffer.capture?.bind(buffer) ||
      buffer.push?.bind(buffer) || 
      buffer.add?.bind(buffer) || 
      buffer.enqueue?.bind(buffer) || 
      null;
    
    this.snapshotMethod = 
      buffer.snapshot?.bind(buffer) || 
      buffer.getRecent?.bind(buffer) || 
      null;
    
    if (!this.pushMethod) {
      throw new Error("Buffer has no capture/push/add/enqueue method");
    }
  }
  
  push(item: T): void {
    this.pushMethod!(item);
  }
  
  snapshot(count: number): T[] {
    if (this.snapshotMethod) {
      return this.snapshotMethod(count);
    }
    
    // Fallback to toArray
    if (this.buffer.toArray) {
      const arr = this.buffer.toArray();
      return arr.slice(Math.max(0, arr.length - count));
    }
    
    // Last resort: try internal arrays
    const internalArray = 
      this.buffer._array || 
      this.buffer._buf || 
      this.buffer.buffer;
    
    if (Array.isArray(internalArray)) {
      return internalArray.slice(Math.max(0, internalArray.length - count));
    }
    
    throw new Error("Buffer has no snapshot/getRecent/toArray method and no accessible internal array");
  }
}

// ========================================
// Test Data Generator
// ========================================

function createInteraction(id: number): Interaction {
  // Target: ~500-700 bytes per interaction
  // Using fixed structure for V8 optimization (monomorphic inline caches)
  return {
    id: `interaction_${id}`,
    text: `Message ${id} ${"x".repeat(420)}`, // Padding for realistic size
    sender: {
      id: `user_${id % 1000}`,
      name: `User ${id % 1000}`,
      isAdult: id % 2 === 0,
    },
    recipient: {
      id: `contact_${id % 500}`,
      name: `Contact ${id % 500}`,
    },
    platform: id % 2 === 0 ? "discord" : "instagram",
    timestamp: Date.now(),
    meta: {
      channel: "benchmark",
      severity: id % 5,
      probability: (id % 100) / 100,
    }
  };
}

// ========================================
// Benchmark Functions
// ========================================

async function benchPushLatency(
  iterations: number = 2_000_000,
  capacity: number = 8192
): Promise<BenchmarkResult | null> {
  if (!CircularBuffer) {
    console.log("⏭️  Skipping push benchmark (CircularBuffer not available)");
    return null;
  }
  
  const buffer = new CircularBuffer<Interaction>(capacity);
  const adapter = new BufferAdapter(buffer);
  
  // Warmup: let JIT optimize
  for (let i = 0; i < 100_000; i++) {
    adapter.push(createInteraction(i));
  }
  
  gc();
  
  const start = nowNs();
  for (let i = 0; i < iterations; i++) {
    adapter.push(createInteraction(i));
  }
  const end = nowNs();
  
  const nsPerOp = Number(end - start) / iterations;
  const formatted = formatLatency(nsPerOp);
  
  console.log(`✓ Push latency: ${formatted} (N=${iterations.toLocaleString()}, cap=${capacity.toLocaleString()})`);
  
  return {
    name: "push_latency",
    value: nsPerOp,
    unit: "ns/op",
    formatted
  };
}

async function benchSnapshotLatency(
  windowSizes: number[] = [128, 512, 2048, 8192],
  capacity: number = 8192
): Promise<BenchmarkResult[]> {
  if (!CircularBuffer) {
    console.log("⏭️  Skipping snapshot benchmark (CircularBuffer not available)");
    return [];
  }
  
  const buffer = new CircularBuffer<Interaction>(capacity);
  const adapter = new BufferAdapter(buffer);
  
  // Fill buffer to capacity
  for (let i = 0; i < capacity; i++) {
    adapter.push(createInteraction(i));
  }
  
  const results: BenchmarkResult[] = [];
  
  console.log("✓ Snapshot latency:");
  for (const size of windowSizes) {
    gc();
    
    const start = nowNs();
    const snapshot = adapter.snapshot(size);
    const end = nowNs();
    
    // Verify correctness
    if (snapshot.length !== size) {
      throw new Error(
        `Snapshot returned wrong size: expected ${size}, got ${snapshot.length}`
      );
    }
    
    const ms = nsToMs(end - start);
    console.log(`  - k=${size.toString().padStart(4)}: ${ms.toFixed(3)} ms`);
    
    results.push({
      name: `snapshot_k${size}`,
      value: ms,
      unit: "ms",
      formatted: `${ms.toFixed(3)} ms`
    });
  }
  
  return results;
}

async function benchMemoryPerInteraction(
  sampleSize: number = 100_000
): Promise<BenchmarkResult | null> {
  const BufferImpl = RollingBuffer || CircularBuffer;
  
  if (!BufferImpl) {
    console.log("⏭️  Skipping memory benchmark (no buffer implementation available)");
    return null;
  }
  
  gc();
  await new Promise(resolve => setTimeout(resolve, 100)); // Let GC settle
  
  const heapBefore = process.memoryUsage().heapUsed;
  
  // Create buffer with enough capacity
  let buffer: BufferLike<Interaction>;
  try {
    // Try RollingBuffer constructor
    buffer = new BufferImpl({ 
      maxInteractions: sampleSize + 1000,
      maxDurationMs: 60_000,
    });
  } catch {
    // Fallback to CircularBuffer constructor
    buffer = new BufferImpl(sampleSize + 1000);
  }
  
  const adapter = new BufferAdapter(buffer);
  
  // Fill with sample data
  for (let i = 0; i < sampleSize; i++) {
    adapter.push(createInteraction(i));
  }
  
  gc();
  await new Promise(resolve => setTimeout(resolve, 100)); // Let GC settle
  
  const heapAfter = process.memoryUsage().heapUsed;
  const totalBytes = heapAfter - heapBefore;
  const bytesPerInteraction = totalBytes / sampleSize;
  
  console.log(`✓ Memory: ${formatBytes(bytesPerInteraction)}/interaction (N=${sampleSize.toLocaleString()})`);
  console.log(`  Total heap delta: ${formatBytes(totalBytes)}`);
  
  return {
    name: "memory_per_interaction",
    value: bytesPerInteraction,
    unit: "bytes",
    formatted: formatBytes(bytesPerInteraction),
    metadata: {
      totalBytes,
    },
  };
}

// ========================================
// Main Execution
// ========================================

async function main() {
  console.log("━".repeat(60));
  console.log("🔬 Lumen Guardian — Buffer Benchmarks");
  console.log("━".repeat(60));
  console.log(`Node: ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("━".repeat(60));
  console.log();
  
  const results: BenchmarkResult[] = [];
  
  try {
    // Run benchmarks
    const pushResult = await benchPushLatency();
    if (pushResult) results.push(pushResult);
    
    console.log();
    
    const snapshotResults = await benchSnapshotLatency();
    results.push(...snapshotResults);
    
    console.log();
    
    const memoryResult = await benchMemoryPerInteraction();
    if (memoryResult) results.push(memoryResult);
    
    console.log();
    console.log("━".repeat(60));
    console.log("✅ Benchmarks complete");
    console.log("━".repeat(60));
    
    // Optional: Output JSON for parsing
    if (process.env.JSON_OUTPUT) {
      const pushResult = results.find((result) => result.name === "push_latency");
      const snapshot8192 = results.find((result) => result.name === "snapshot_k8192");
      const memoryResult = results.find((result) => result.name === "memory_per_interaction");
      const summary = {
        type: "summary",
        metrics: {
          throughputPerSec:
            typeof pushResult?.value === "number" && pushResult.value > 0
              ? 1_000_000_000 / pushResult.value
              : undefined,
          latency: {
            p95Ms: snapshot8192?.value,
          },
          memory: {
            bytesPerInteraction: memoryResult?.value,
          },
          rssPeakMB:
            typeof memoryResult?.metadata?.totalBytes === "number"
              ? memoryResult.metadata.totalBytes / (1024 * 1024)
              : undefined,
        },
      };
      console.log("\nJSON Results:");
      console.log(JSON.stringify(results));
      console.log(JSON.stringify(summary));
    }
    
  } catch (error) {
    console.error("\n❌ Benchmark failed:");
    console.error(error);
    process.exit(1);
  }
}

// === Clean exit & diagnostics (production-safe) ===
// Supports: --force-exit, --dump-handles
// CI path: set BENCH_FORCE_EXIT=1 to force exit post-run.
async function __benchCleanup() {
  const argv = process.argv.slice(2);
  const hasArg = (name: string) => argv.includes(name);
  const FORCE = hasArg("--force-exit") || process.env.BENCH_FORCE_EXIT === "1";
  const DUMP = hasArg("--dump-handles") || process.env.DUMP_HANDLES === "1";

  await new Promise((resolve) => setTimeout(resolve, 25));

  if (DUMP) {
    const proc = process as ProcessWithInternals;
    const handles = proc._getActiveHandles?.() ?? [];
    const requests = proc._getActiveRequests?.() ?? [];
    const name = (handle: unknown) =>
      (handle as { constructor?: { name?: string } } | undefined)?.constructor?.name ?? typeof handle;
    console.error("\n[bench] Active handles:", handles.map(name));
    console.error("[bench] Active requests:", requests.map(name));
  }

  if (FORCE) {
    await new Promise((resolve) => setImmediate(resolve));
    process.exit(0);
  }
}

main().finally(() => {
  void __benchCleanup();
});
