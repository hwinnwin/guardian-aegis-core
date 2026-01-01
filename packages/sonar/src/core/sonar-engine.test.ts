import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SonarEngine, createSonarEngine } from './sonar-engine';
import type { AcousticSignature, GeoCoordinate } from '../types';

describe('SonarEngine', () => {
  let engine: SonarEngine;

  beforeEach(() => {
    engine = createSonarEngine();
  });

  afterEach(() => {
    engine.stopScanning();
  });

  describe('executePing', () => {
    it('should execute a ping and return results', () => {
      const location: GeoCoordinate = {
        latitude: -28.0027,
        longitude: 153.4310,
        depth: 5,
      };

      const ping = engine.executePing(location, 'active_ping');

      expect(ping).toBeDefined();
      expect(ping.id).toBeTruthy();
      expect(ping.timestamp).toBeGreaterThan(0);
      expect(ping.location).toEqual(location);
      expect(ping.mode).toBe('active_ping');
      expect(ping.frequency).toBe(50000);
      expect(typeof ping.signalStrength).toBe('number');
    });

    it('should store pings in history', () => {
      const location: GeoCoordinate = { latitude: -28.0027, longitude: 153.4310 };

      engine.executePing(location);
      engine.executePing(location);
      engine.executePing(location);

      const history = engine.getPingHistory();
      expect(history.length).toBe(3);
    });

    it('should limit ping history to 1000 entries', () => {
      const location: GeoCoordinate = { latitude: -28.0, longitude: 153.4 };

      for (let i = 0; i < 1005; i++) {
        engine.executePing(location);
      }

      const history = engine.getPingHistory();
      expect(history.length).toBe(1000);
    });
  });

  describe('analyzeSignature', () => {
    it('should identify human-like signature with high confidence', () => {
      const humanSignature: AcousticSignature = {
        frequencyProfile: [100, 300, 600, 1200, 2000],
        amplitudeProfile: [0.4, 0.6, 0.8, 0.6, 0.3],
        temporalPattern: 'active_motion',
      };

      const result = engine.analyzeSignature(humanSignature);

      expect(result.isLikelyHuman).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should reject non-human signature', () => {
      const nonHumanSignature: AcousticSignature = {
        frequencyProfile: [5000, 10000, 15000],
        amplitudeProfile: [0.1, 0.1, 0.1],
      };

      const result = engine.analyzeSignature(nonHumanSignature);

      expect(result.isLikelyHuman).toBe(false);
    });
  });

  describe('classifyObject', () => {
    it('should classify moving human correctly', () => {
      const signature: AcousticSignature = {
        frequencyProfile: [100, 300, 600, 1200, 2000],
        amplitudeProfile: [0.4, 0.6, 0.8, 0.6, 0.3],
      };

      const result = engine.classifyObject(signature, {
        speed: 1.5,
        heading: 90,
        pattern: 'swimming',
      });

      expect(result.classification).toBe('human_moving');
    });

    it('should classify floating human correctly', () => {
      const signature: AcousticSignature = {
        frequencyProfile: [20, 50, 100, 150],
        amplitudeProfile: [0.6, 0.8, 0.5, 0.3],
      };

      const result = engine.classifyObject(signature, {
        speed: 0.2,
        heading: 180,
        pattern: 'drifting',
      });

      expect(result.classification).toBe('human_floating');
    });
  });

  describe('calculateSearchPattern', () => {
    it('should generate expanding spiral pattern', () => {
      const center: GeoCoordinate = { latitude: -28.0027, longitude: 153.4310 };
      const pattern = engine.calculateSearchPattern(center, 500, 'active_ping');

      expect(pattern.length).toBeGreaterThan(0);
      expect(pattern[0].latitude).toBe(center.latitude);
      expect(pattern[0].longitude).toBe(center.longitude);
    });
  });

  describe('detection management', () => {
    it('should return empty human detections initially', () => {
      const detections = engine.getHumanDetections();
      expect(detections).toEqual([]);
    });

    it('should return all detections', () => {
      const detections = engine.getAllDetections();
      expect(Array.isArray(detections)).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      engine.updateConfig({ pingIntervalMs: 2000 });
      const config = engine.getConfig();
      expect(config.pingIntervalMs).toBe(2000);
    });

    it('should preserve other config values when updating', () => {
      const original = engine.getConfig();
      engine.updateConfig({ pingIntervalMs: 2000 });
      const updated = engine.getConfig();

      expect(updated.maxDepthMeters).toBe(original.maxDepthMeters);
      expect(updated.defaultMode).toBe(original.defaultMode);
    });
  });
});
