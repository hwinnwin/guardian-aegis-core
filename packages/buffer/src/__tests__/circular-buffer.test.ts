/**
 * Test suite for CircularBuffer implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CircularBuffer } from '../core/circular-buffer';

describe('CircularBuffer', () => {
  let buffer: CircularBuffer<number>;

  beforeEach(() => {
    buffer = new CircularBuffer<number>(5);
  });

  describe('initialization', () => {
    it('should initialize with correct capacity', () => {
      expect(buffer.getCapacity()).toBe(5);
      expect(buffer.getSize()).toBe(0);
      expect(buffer.isFull()).toBe(false);
    });

    it('should throw error for invalid capacity', () => {
      expect(() => new CircularBuffer<number>(0)).toThrow('Capacity must be greater than 0');
      expect(() => new CircularBuffer<number>(-1)).toThrow('Capacity must be greater than 0');
    });
  });

  describe('push and toArray', () => {
    it('should push items correctly', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.getSize()).toBe(3);
      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it('should overwrite oldest items when buffer is full', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);
      expect(buffer.isFull()).toBe(true);
      expect(buffer.toArray()).toEqual([1, 2, 3, 4, 5]);

      // Push 6th item (should overwrite 1)
      buffer.push(6);
      expect(buffer.getSize()).toBe(5);
      expect(buffer.toArray()).toEqual([2, 3, 4, 5, 6]);
    });

    it('should handle multiple overwrites correctly', () => {
      // Fill buffer
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      // Overwrite with 3 more items
      buffer.push(6);
      buffer.push(7);
      buffer.push(8);

      expect(buffer.getSize()).toBe(5);
      expect(buffer.toArray()).toEqual([4, 5, 6, 7, 8]);
    });

    it('should return empty array when buffer is empty', () => {
      expect(buffer.toArray()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all items from buffer', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.clear();

      expect(buffer.getSize()).toBe(0);
      expect(buffer.toArray()).toEqual([]);
      expect(buffer.isFull()).toBe(false);
    });

    it('should allow pushing after clear', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.clear();

      buffer.push(3);
      buffer.push(4);

      expect(buffer.getSize()).toBe(2);
      expect(buffer.toArray()).toEqual([3, 4]);
    });
  });

  describe('getSize and isFull', () => {
    it('should track size correctly', () => {
      expect(buffer.getSize()).toBe(0);

      buffer.push(1);
      expect(buffer.getSize()).toBe(1);

      buffer.push(2);
      expect(buffer.getSize()).toBe(2);
    });

    it('should correctly identify when buffer is full', () => {
      expect(buffer.isFull()).toBe(false);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      expect(buffer.isFull()).toBe(false);

      buffer.push(5);
      expect(buffer.isFull()).toBe(true);

      buffer.push(6); // Overwrite
      expect(buffer.isFull()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle buffer of size 1', () => {
      const smallBuffer = new CircularBuffer<string>(1);
      
      smallBuffer.push('a');
      expect(smallBuffer.toArray()).toEqual(['a']);

      smallBuffer.push('b');
      expect(smallBuffer.toArray()).toEqual(['b']);
    });

    it('should handle complex data types', () => {
      type TestObject = { id: number; name: string };
      const objBuffer = new CircularBuffer<TestObject>(3);

      objBuffer.push({ id: 1, name: 'Alice' });
      objBuffer.push({ id: 2, name: 'Bob' });
      objBuffer.push({ id: 3, name: 'Charlie' });

      const result = objBuffer.toArray();
      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]);
    });

    it('should maintain order through multiple wraps', () => {
      const buf = new CircularBuffer<number>(3);
      
      // First wrap
      buf.push(1);
      buf.push(2);
      buf.push(3);
      buf.push(4); // Overwrites 1
      expect(buf.toArray()).toEqual([2, 3, 4]);

      // Second wrap
      buf.push(5); // Overwrites 2
      buf.push(6); // Overwrites 3
      expect(buf.toArray()).toEqual([4, 5, 6]);

      // Third wrap
      buf.push(7); // Overwrites 4
      expect(buf.toArray()).toEqual([5, 6, 7]);
    });
  });
});
