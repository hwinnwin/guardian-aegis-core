/**
 * High-performance circular buffer implementation.
 * 
 * Array-based circular buffer with O(1) push operation.
 * Automatically overwrites oldest items when full.
 * 
 * Performance: push <10ns, toArray <1ms
 */

import type { ICircularBuffer } from './interfaces';

export class CircularBuffer<T> implements ICircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;  // Next write position
  private tail: number = 0;  // Oldest item position
  private size: number = 0;  // Current number of items
  private readonly capacity: number;

  /**
   * Create a circular buffer with fixed capacity.
   * @param capacity Maximum number of items to store
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add item to buffer (O(1) operation).
   * Overwrites oldest item if buffer is full.
   */
  push(item: T): void {
    this.buffer[this.head] = item;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Buffer is full, move tail forward (overwriting oldest)
      this.tail = (this.tail + 1) % this.capacity;
    }
    
    this.head = (this.head + 1) % this.capacity;
  }

  /**
   * Get all items in chronological order (oldest to newest).
   * Returns a new array without modifying the buffer.
   */
  toArray(): T[] {
    if (this.size === 0) {
      return [];
    }

    const result: T[] = [];
    let current = this.tail;
    
    for (let i = 0; i < this.size; i++) {
      const item = this.buffer[current];
      if (item !== undefined) {
        result.push(item);
      }
      current = (current + 1) % this.capacity;
    }
    
    return result;
  }

  /**
   * Clear all items from buffer.
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Get current number of items in buffer.
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get maximum capacity of buffer.
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Check if buffer is at capacity.
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }
}
