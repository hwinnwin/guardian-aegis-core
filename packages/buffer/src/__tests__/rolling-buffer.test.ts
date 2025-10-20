/**
 * Test suite for RollingBuffer implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RollingBuffer } from '../core/rolling-buffer';
import type { Interaction, Platform } from '../types';

// Helper function to create mock interactions
function createInteraction(
  id: string, 
  text: string, 
  timestamp: number = Date.now(),
  platform: Platform = 'discord'
): Interaction {
  return {
    id,
    text,
    sender: { id: 'user1', name: 'TestUser' },
    platform,
    timestamp,
  };
}

describe('RollingBuffer', () => {
  let buffer: RollingBuffer;

  beforeEach(() => {
    buffer = new RollingBuffer({
      maxInteractions: 5,
      maxDurationMs: 10000, // 10 seconds
      cleanupIntervalMs: 1000, // 1 second
    });
  });

  afterEach(() => {
    buffer.destroy();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      const stats = buffer.getStats();
      expect(stats.size).toBe(0);
      expect(stats.capacity).toBe(5);
      expect(stats.isFull).toBe(false);
    });

    it('should throw error for invalid configuration', () => {
      expect(() => new RollingBuffer({ maxInteractions: 0, maxDurationMs: 1000 }))
        .toThrow('maxInteractions must be greater than 0');

      expect(() => new RollingBuffer({ maxInteractions: 5, maxDurationMs: 0 }))
        .toThrow('maxDurationMs must be greater than 0');
    });
  });

  describe('capture', () => {
    it('should capture interactions correctly', () => {
      const interaction = createInteraction('1', 'Hello');
      buffer.capture(interaction);

      const interactions = buffer.peek();
      expect(interactions).toHaveLength(1);
      expect(interactions[0]).toEqual(interaction);
    });

    it('should throw error for invalid interaction', () => {
      expect(() => buffer.capture({} as Interaction))
        .toThrow('Invalid interaction: missing required fields');
    });

    it('should maintain max interactions limit (circular behavior)', () => {
      buffer.capture(createInteraction('1', 'Message 1'));
      buffer.capture(createInteraction('2', 'Message 2'));
      buffer.capture(createInteraction('3', 'Message 3'));
      buffer.capture(createInteraction('4', 'Message 4'));
      buffer.capture(createInteraction('5', 'Message 5'));

      let stats = buffer.getStats();
      expect(stats.size).toBe(5);
      expect(stats.isFull).toBe(true);

      // Push 6th interaction (should overwrite oldest)
      buffer.capture(createInteraction('6', 'Message 6'));

      stats = buffer.getStats();
      expect(stats.size).toBe(5);

      const interactions = buffer.peek();
      expect(interactions.map(i => i.id)).toEqual(['2', '3', '4', '5', '6']);
    });
  });

  describe('freezeOnThreat', () => {
    it('should create snapshot when threat detected', () => {
      buffer.capture(createInteraction('1', 'Hello'));
      buffer.capture(createInteraction('2', 'How are you?'));

      const snapshot = buffer.freezeOnThreat('HIGH', 'Grooming pattern detected');

      expect(snapshot.id).toBeDefined();
      expect(snapshot.interactions).toHaveLength(2);
      expect(snapshot.threatLevel).toBe('HIGH');
      expect(snapshot.reason).toBe('Grooming pattern detected');
      expect(snapshot.capturedAt).toBeGreaterThan(0);
    });

    it('should store snapshots correctly', () => {
      buffer.capture(createInteraction('1', 'Test message'));

      const snapshot1 = buffer.freezeOnThreat('MEDIUM', 'Suspicious link');
      const snapshot2 = buffer.freezeOnThreat('HIGH', 'Explicit content');

      const allSnapshots = buffer.getAllSnapshots();
      expect(allSnapshots).toHaveLength(2);
      expect(allSnapshots.map(s => s.id)).toContain(snapshot1.id);
      expect(allSnapshots.map(s => s.id)).toContain(snapshot2.id);
    });
  });

  describe('snapshot management', () => {
    it('should retrieve snapshot by ID', () => {
      buffer.capture(createInteraction('1', 'Test'));
      const snapshot = buffer.freezeOnThreat('LOW', 'Test threat');

      const retrieved = buffer.getSnapshot(snapshot.id);
      expect(retrieved).toEqual(snapshot);
    });

    it('should return undefined for non-existent snapshot', () => {
      const retrieved = buffer.getSnapshot('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should delete snapshot correctly', () => {
      buffer.capture(createInteraction('1', 'Test'));
      const snapshot = buffer.freezeOnThreat('LOW', 'Test threat');

      buffer.deleteSnapshot(snapshot.id);
      const retrieved = buffer.getSnapshot(snapshot.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get all snapshots', () => {
      buffer.capture(createInteraction('1', 'Test 1'));
      const snapshot1 = buffer.freezeOnThreat('LOW', 'Threat 1');
      
      buffer.capture(createInteraction('2', 'Test 2'));
      const snapshot2 = buffer.freezeOnThreat('MEDIUM', 'Threat 2');

      const allSnapshots = buffer.getAllSnapshots();
      expect(allSnapshots).toHaveLength(2);
      expect(allSnapshots).toContainEqual(snapshot1);
      expect(allSnapshots).toContainEqual(snapshot2);
    });
  });

  describe('clear', () => {
    it('should clear buffer completely', () => {
      buffer.capture(createInteraction('1', 'Message 1'));
      buffer.capture(createInteraction('2', 'Message 2'));

      buffer.clear();

      const stats = buffer.getStats();
      expect(stats.size).toBe(0);
      expect(buffer.peek()).toHaveLength(0);
    });

    it('should not affect snapshots when clearing buffer', () => {
      buffer.capture(createInteraction('1', 'Test'));
      const snapshot = buffer.freezeOnThreat('LOW', 'Test');

      buffer.clear();

      const retrieved = buffer.getSnapshot(snapshot.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should provide accurate stats', () => {
      const now = Date.now();
      buffer.capture(createInteraction('1', 'First', now));
      buffer.capture(createInteraction('2', 'Second', now + 1000));
      buffer.capture(createInteraction('3', 'Third', now + 2000));

      const stats = buffer.getStats();
      expect(stats.size).toBe(3);
      expect(stats.capacity).toBe(5);
      expect(stats.isFull).toBe(false);
      expect(stats.oldestTimestamp).toBe(now);
      expect(stats.newestTimestamp).toBe(now + 2000);
      expect(stats.memoryUsageBytes).toBeGreaterThan(0);
    });

    it('should handle empty buffer stats', () => {
      const stats = buffer.getStats();
      expect(stats.size).toBe(0);
      expect(stats.oldestTimestamp).toBeNull();
      expect(stats.newestTimestamp).toBeNull();
    });
  });

  describe('auto-cleanup', () => {
    it('should auto-delete interactions older than maxDurationMs', async () => {
      const now = Date.now();
      
      // Add old interaction (11 seconds ago, older than maxDurationMs of 10s)
      buffer.capture(createInteraction('1', 'Old message', now - 11000));
      
      // Add recent interaction
      buffer.capture(createInteraction('2', 'Recent message', now));

      expect(buffer.peek()).toHaveLength(2);

      // Wait for cleanup interval to run (1.5 seconds to be safe)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Old interaction should be removed
      const interactions = buffer.peek();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].id).toBe('2');
    });

    it('should not delete interactions within time window', async () => {
      const now = Date.now();
      
      // Add recent interactions (5 seconds ago, within 10s window)
      buffer.capture(createInteraction('1', 'Message 1', now - 5000));
      buffer.capture(createInteraction('2', 'Message 2', now));

      expect(buffer.peek()).toHaveLength(2);

      // Wait for cleanup interval
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Both should still be there
      const interactions = buffer.peek();
      expect(interactions).toHaveLength(2);
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      buffer.capture(createInteraction('1', 'Test'));
      buffer.freezeOnThreat('LOW', 'Test');

      buffer.destroy();

      expect(buffer.peek()).toHaveLength(0);
      expect(buffer.getAllSnapshots()).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid captures', () => {
      for (let i = 0; i < 100; i++) {
        buffer.capture(createInteraction(`${i}`, `Message ${i}`));
      }

      const interactions = buffer.peek();
      expect(interactions).toHaveLength(5); // Limited by maxInteractions
      
      // Should have the last 5 interactions
      expect(interactions.map(i => i.id)).toEqual(['95', '96', '97', '98', '99']);
    });

    it('should handle multiple platforms', () => {
      buffer.capture(createInteraction('1', 'Discord msg', Date.now(), 'discord'));
      buffer.capture(createInteraction('2', 'Instagram msg', Date.now(), 'instagram'));
      buffer.capture(createInteraction('3', 'TikTok msg', Date.now(), 'tiktok'));

      const interactions = buffer.peek();
      expect(interactions).toHaveLength(3);
      expect(interactions.map(i => i.platform)).toEqual(['discord', 'instagram', 'tiktok']);
    });

    it('should handle interactions with metadata', () => {
      const interaction = createInteraction('1', 'Check this out');
      interaction.metadata = {
        linkUrl: 'https://suspicious.com',
        imageUrl: 'https://image.com/photo.jpg',
      };

      buffer.capture(interaction);
      const result = buffer.peek()[0];
      
      expect(result.metadata?.linkUrl).toBe('https://suspicious.com');
      expect(result.metadata?.imageUrl).toBe('https://image.com/photo.jpg');
    });
  });
});
