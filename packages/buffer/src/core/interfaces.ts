/**
 * Interface contracts for buffer implementations.
 */

import type { Interaction, Snapshot, BufferStats, ThreatLevel } from '../types';

/**
 * Generic circular buffer interface.
 */
export interface ICircularBuffer<T> {
  /**
   * Add item to buffer (overwrites oldest if full).
   */
  push(item: T): void;

  /**
   * Get all items in order (oldest to newest).
   */
  toArray(): T[];

  /**
   * Clear all items from buffer.
   */
  clear(): void;

  /**
   * Get current number of items.
   */
  getSize(): number;

  /**
   * Get maximum capacity.
   */
  getCapacity(): number;

  /**
   * Check if buffer is at capacity.
   */
  isFull(): boolean;
}

/**
 * Rolling buffer interface for interaction management.
 */
export interface IRollingBuffer {
  /**
   * Capture an interaction into the rolling buffer.
   */
  capture(interaction: Interaction): void;

  /**
   * Freeze buffer state when threat is detected.
   * Returns a snapshot of current interactions.
   */
  freezeOnThreat(threatLevel: ThreatLevel, reason: string): Snapshot;

  /**
   * Clear all interactions from buffer.
   */
  clear(): void;

  /**
   * Peek at current interactions without modifying buffer.
   */
  peek(): Interaction[];

  /**
   * Get buffer statistics.
   */
  getStats(): BufferStats;

  /**
   * Retrieve a specific snapshot by ID.
   */
  getSnapshot(id: string): Snapshot | undefined;

  /**
   * Delete a snapshot by ID.
   */
  deleteSnapshot(id: string): void;

  /**
   * Get all stored snapshots.
   */
  getAllSnapshots(): Snapshot[];

  /**
   * Cleanup resources (stop intervals, clear data).
   */
  destroy(): void;
}
