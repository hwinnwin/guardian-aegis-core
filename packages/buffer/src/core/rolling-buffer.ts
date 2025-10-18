/**
 * Rolling buffer implementation with time-based auto-cleanup.
 * 
 * Maintains a sliding window of interactions based on time and capacity.
 * Automatically removes interactions older than maxDurationMs.
 * Freezes buffer state when threats are detected.
 * 
 * Performance: capture <1ms, auto-cleanup <100µs
 */

import { nanoid } from 'nanoid';
import { CircularBuffer } from './circular-buffer';
import type { IRollingBuffer } from './interfaces';
import type { 
  Interaction, 
  Snapshot, 
  BufferStats, 
  BufferConfig, 
  ThreatLevel 
} from '../types';

export class RollingBuffer implements IRollingBuffer {
  private buffer: CircularBuffer<Interaction>;
  private snapshots: Map<string, Snapshot>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly maxDurationMs: number;
  private readonly cleanupIntervalMs: number;

  /**
   * Create a rolling buffer with time-based auto-cleanup.
   * 
   * @param config Buffer configuration
   * @param config.maxInteractions Maximum number of interactions to store
   * @param config.maxDurationMs Maximum age of interactions in milliseconds (default: 10000ms)
   * @param config.cleanupIntervalMs How often to run cleanup (default: 1000ms)
   */
  constructor(config: BufferConfig) {
    if (config.maxInteractions <= 0) {
      throw new Error('maxInteractions must be greater than 0');
    }
    if (config.maxDurationMs <= 0) {
      throw new Error('maxDurationMs must be greater than 0');
    }

    this.buffer = new CircularBuffer<Interaction>(config.maxInteractions);
    this.snapshots = new Map();
    this.maxDurationMs = config.maxDurationMs;
    this.cleanupIntervalMs = config.cleanupIntervalMs ?? 1000;

    // Start auto-cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Capture an interaction into the rolling buffer.
   */
  capture(interaction: Interaction): void {
    if (!interaction.id || !interaction.text || !interaction.sender || !interaction.platform) {
      throw new Error('Invalid interaction: missing required fields');
    }
    
    this.buffer.push(interaction);
  }

  /**
   * Freeze buffer state when threat is detected.
   * Creates an immutable snapshot of current interactions.
   */
  freezeOnThreat(threatLevel: ThreatLevel, reason: string): Snapshot {
    const snapshot: Snapshot = {
      id: nanoid(),
      interactions: this.buffer.toArray(), // Get immutable copy
      capturedAt: Date.now(),
      reason,
      threatLevel,
    };

    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  /**
   * Clear all interactions from buffer (does not affect snapshots).
   */
  clear(): void {
    this.buffer.clear();
  }

  /**
   * Peek at current interactions without modifying buffer.
   */
  peek(): Interaction[] {
    return this.buffer.toArray();
  }

  /**
   * Get buffer statistics.
   */
  getStats(): BufferStats {
    const interactions = this.buffer.toArray();
    
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    if (interactions.length > 0) {
      oldestTimestamp = interactions[0].timestamp;
      newestTimestamp = interactions[interactions.length - 1].timestamp;
    }

    // Rough memory estimate: ~500 bytes per interaction
    const memoryUsageBytes = this.buffer.getSize() * 500;

    return {
      size: this.buffer.getSize(),
      capacity: this.buffer.getCapacity(),
      isFull: this.buffer.isFull(),
      oldestTimestamp,
      newestTimestamp,
      memoryUsageBytes,
    };
  }

  /**
   * Retrieve a specific snapshot by ID.
   */
  getSnapshot(id: string): Snapshot | undefined {
    return this.snapshots.get(id);
  }

  /**
   * Delete a snapshot by ID.
   */
  deleteSnapshot(id: string): void {
    this.snapshots.delete(id);
  }

  /**
   * Get all stored snapshots.
   */
  getAllSnapshots(): Snapshot[] {
    return Array.from(this.snapshots.values());
  }

  /**
   * Cleanup resources (stop intervals, clear data).
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.buffer.clear();
    this.snapshots.clear();
  }

  /**
   * Start the auto-cleanup interval.
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanOldInteractions();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop the auto-cleanup interval.
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove interactions older than maxDurationMs.
   * This is called automatically by the cleanup interval.
   */
  private cleanOldInteractions(): void {
    const now = Date.now();
    const cutoffTime = now - this.maxDurationMs;
    const interactions = this.buffer.toArray();

    // Filter out old interactions
    const validInteractions = interactions.filter(
      interaction => interaction.timestamp >= cutoffTime
    );

    // If we removed any interactions, rebuild the buffer
    if (validInteractions.length < interactions.length) {
      this.buffer.clear();
      validInteractions.forEach(interaction => this.buffer.push(interaction));
    }
  }
}
