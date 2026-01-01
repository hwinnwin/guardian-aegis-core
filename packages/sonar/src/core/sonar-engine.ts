/**
 * Sonar Detection Engine
 * Core engine for underwater and surface detection of missing persons
 */

import { nanoid } from 'nanoid';
import type {
  SonarPing,
  DetectedObject,
  SonarMode,
  GeoCoordinate,
  ObjectClassification,
  ConfidenceLevel,
  AcousticSignature,
  MovementVector,
  SonarConfig,
  WaterConditions,
} from '../types';

/** Default human acoustic signature patterns */
const HUMAN_SIGNATURE_PATTERNS: AcousticSignature[] = [
  {
    // Breathing/movement at surface
    frequencyProfile: [50, 100, 200, 500, 1000],
    amplitudeProfile: [0.3, 0.5, 0.7, 0.4, 0.2],
    temporalPattern: 'rhythmic_surface',
    matchConfidence: 0.85,
  },
  {
    // Submerged body drift
    frequencyProfile: [20, 50, 100, 150],
    amplitudeProfile: [0.6, 0.8, 0.5, 0.3],
    temporalPattern: 'passive_drift',
    matchConfidence: 0.7,
  },
  {
    // Active swimming/struggling
    frequencyProfile: [100, 300, 600, 1200, 2000],
    amplitudeProfile: [0.4, 0.6, 0.8, 0.6, 0.3],
    temporalPattern: 'active_motion',
    matchConfidence: 0.9,
  },
];

/** Default sonar configuration */
const DEFAULT_CONFIG: SonarConfig = {
  defaultMode: 'active_ping',
  pingIntervalMs: 1000,
  maxDepthMeters: 100,
  frequencyRangeHz: { min: 20, max: 200000 },
  sensitivityThreshold: 0.3,
  humanSignaturePatterns: HUMAN_SIGNATURE_PATTERNS,
  autoExpandSearch: true,
  driftPredictionEnabled: true,
  recognitionIntegrations: [],
};

export class SonarEngine {
  private config: SonarConfig;
  private activeDetections: Map<string, DetectedObject> = new Map();
  private pingHistory: SonarPing[] = [];
  private isScanning = false;
  private scanIntervalId?: ReturnType<typeof setInterval>;

  constructor(config: Partial<SonarConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Start continuous sonar scanning */
  startScanning(location: GeoCoordinate, mode?: SonarMode): void {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    const scanMode = mode ?? this.config.defaultMode;

    this.scanIntervalId = setInterval(() => {
      this.executePing(location, scanMode);
    }, this.config.pingIntervalMs);
  }

  /** Stop continuous scanning */
  stopScanning(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = undefined;
    }
    this.isScanning = false;
  }

  /** Execute a single sonar ping */
  executePing(
    location: GeoCoordinate,
    mode: SonarMode = this.config.defaultMode
  ): SonarPing {
    const ping: SonarPing = {
      id: nanoid(),
      timestamp: Date.now(),
      location,
      mode,
      frequency: this.getFrequencyForMode(mode),
      signalStrength: this.calculateSignalStrength(location, mode),
      returnTime: mode === 'active_ping' ? this.simulateReturnTime() : undefined,
      detectedObjects: [],
    };

    // Simulate object detection based on mode
    const detections = this.processReturns(ping);
    ping.detectedObjects = detections;

    // Update tracking for detected objects
    for (const detection of detections) {
      this.updateTracking(detection);
    }

    this.pingHistory.push(ping);

    // Keep only last 1000 pings
    if (this.pingHistory.length > 1000) {
      this.pingHistory = this.pingHistory.slice(-1000);
    }

    return ping;
  }

  /** Analyze acoustic signature against human patterns */
  analyzeSignature(signature: AcousticSignature): {
    isLikelyHuman: boolean;
    confidence: number;
    matchedPattern?: string;
  } {
    let bestMatch = 0;
    let matchedPattern: string | undefined;

    for (const pattern of this.config.humanSignaturePatterns) {
      const similarity = this.calculateSignatureSimilarity(signature, pattern);
      if (similarity > bestMatch) {
        bestMatch = similarity;
        matchedPattern = pattern.temporalPattern;
      }
    }

    return {
      isLikelyHuman: bestMatch >= this.config.sensitivityThreshold,
      confidence: bestMatch,
      matchedPattern,
    };
  }

  /** Classify detected object based on acoustic properties */
  classifyObject(
    signature: AcousticSignature,
    movement?: MovementVector,
    conditions?: WaterConditions
  ): { classification: ObjectClassification; confidence: ConfidenceLevel } {
    const analysis = this.analyzeSignature(signature);

    if (analysis.isLikelyHuman) {
      // Determine if moving, floating, or submerged
      if (movement) {
        if (movement.pattern === 'swimming' || movement.pattern === 'struggling') {
          return {
            classification: 'human_moving',
            confidence: this.getConfidenceLevel(analysis.confidence),
          };
        }
        if (movement.pattern === 'drifting' || movement.pattern === 'stationary') {
          return {
            classification: 'human_floating',
            confidence: this.getConfidenceLevel(analysis.confidence),
          };
        }
      }
      return {
        classification: 'human_body',
        confidence: this.getConfidenceLevel(analysis.confidence),
      };
    }

    // Non-human classifications
    if (this.isMarineLifeSignature(signature)) {
      return { classification: 'marine_life', confidence: 'medium' };
    }

    if (this.isDebrisSignature(signature)) {
      return { classification: 'debris', confidence: 'low' };
    }

    return { classification: 'unknown', confidence: 'low' };
  }

  /** Get all active detections classified as human */
  getHumanDetections(): DetectedObject[] {
    return Array.from(this.activeDetections.values()).filter(
      (d) =>
        d.classification === 'human_body' ||
        d.classification === 'human_moving' ||
        d.classification === 'human_floating'
    );
  }

  /** Get all active detections */
  getAllDetections(): DetectedObject[] {
    return Array.from(this.activeDetections.values());
  }

  /** Get detection by ID */
  getDetection(id: string): DetectedObject | undefined {
    return this.activeDetections.get(id);
  }

  /** Confirm a detection (human verification) */
  confirmDetection(id: string): boolean {
    const detection = this.activeDetections.get(id);
    if (detection) {
      detection.confidence = 'confirmed';
      this.activeDetections.set(id, detection);
      return true;
    }
    return false;
  }

  /** Dismiss a false positive detection */
  dismissDetection(id: string): boolean {
    return this.activeDetections.delete(id);
  }

  /** Get ping history */
  getPingHistory(limit?: number): SonarPing[] {
    if (limit) {
      return this.pingHistory.slice(-limit);
    }
    return [...this.pingHistory];
  }

  /** Calculate optimal search pattern for area */
  calculateSearchPattern(
    center: GeoCoordinate,
    radiusMeters: number,
    mode: SonarMode
  ): GeoCoordinate[] {
    const pattern: GeoCoordinate[] = [];
    const effectiveRange = this.getEffectiveRange(mode);
    const spacing = effectiveRange * 0.8; // 20% overlap for coverage

    // Expanding spiral pattern
    let distance = 0;
    let angle = 0;

    while (distance < radiusMeters) {
      const lat = center.latitude + (distance / 111320) * Math.cos(angle);
      const lng = center.longitude + (distance / (111320 * Math.cos(center.latitude * Math.PI / 180))) * Math.sin(angle);

      pattern.push({
        latitude: lat,
        longitude: lng,
        depth: center.depth,
      });

      angle += spacing / Math.max(distance, spacing);
      distance = (spacing * angle) / (2 * Math.PI);
    }

    return pattern;
  }

  /** Update configuration */
  updateConfig(config: Partial<SonarConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Get current configuration */
  getConfig(): SonarConfig {
    return { ...this.config };
  }

  // Private helper methods

  private getFrequencyForMode(mode: SonarMode): number {
    const frequencies: Record<SonarMode, number> = {
      active_ping: 50000, // 50 kHz
      passive_listen: 0,
      side_scan: 100000, // 100 kHz
      multi_beam: 200000, // 200 kHz
      synthetic_aperture: 150000, // 150 kHz
    };
    return frequencies[mode];
  }

  private calculateSignalStrength(location: GeoCoordinate, mode: SonarMode): number {
    // Simulate signal strength based on depth and mode
    const baseStrength = 100;
    const depthAttenuation = (location.depth ?? 0) * 0.5;
    const modeModifier = mode === 'active_ping' ? 1 : 0.7;

    return Math.max(0, (baseStrength - depthAttenuation) * modeModifier);
  }

  private simulateReturnTime(): number {
    // Simulate return time in milliseconds (speed of sound in water ~1500 m/s)
    return Math.random() * 100 + 10;
  }

  private processReturns(ping: SonarPing): DetectedObject[] {
    // In a real system, this would process actual sonar returns
    // For now, we return empty array - real detections come from hardware
    return [];
  }

  private updateTracking(detection: DetectedObject): void {
    const existing = this.activeDetections.get(detection.id);

    if (existing) {
      // Update existing detection with new data
      existing.lastDetectedAt = detection.lastDetectedAt;
      existing.location = detection.location;
      existing.movement = detection.movement;

      // Add to tracking history
      if (!existing.trackingHistory) {
        existing.trackingHistory = [];
      }
      existing.trackingHistory.push(detection.location);

      // Keep last 100 positions
      if (existing.trackingHistory.length > 100) {
        existing.trackingHistory = existing.trackingHistory.slice(-100);
      }

      this.activeDetections.set(detection.id, existing);
    } else {
      // New detection
      this.activeDetections.set(detection.id, detection);
    }
  }

  private calculateSignatureSimilarity(
    sig1: AcousticSignature,
    sig2: AcousticSignature
  ): number {
    // Cosine similarity between frequency/amplitude profiles
    const freqSim = this.cosineSimilarity(sig1.frequencyProfile, sig2.frequencyProfile);
    const ampSim = this.cosineSimilarity(sig1.amplitudeProfile, sig2.amplitudeProfile);

    return (freqSim + ampSim) / 2;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.9) return 'confirmed';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private isMarineLifeSignature(signature: AcousticSignature): boolean {
    // Marine life typically has higher frequency components and erratic patterns
    const avgFreq = signature.frequencyProfile.reduce((a, b) => a + b, 0) / signature.frequencyProfile.length;
    return avgFreq > 1000;
  }

  private isDebrisSignature(signature: AcousticSignature): boolean {
    // Debris typically has very low amplitude and no temporal pattern
    const avgAmp = signature.amplitudeProfile.reduce((a, b) => a + b, 0) / signature.amplitudeProfile.length;
    return avgAmp < 0.2 && !signature.temporalPattern;
  }

  private getEffectiveRange(mode: SonarMode): number {
    const ranges: Record<SonarMode, number> = {
      active_ping: 500,
      passive_listen: 200,
      side_scan: 150,
      multi_beam: 100,
      synthetic_aperture: 300,
    };
    return ranges[mode];
  }
}

/** Create a new sonar engine instance */
export function createSonarEngine(config?: Partial<SonarConfig>): SonarEngine {
  return new SonarEngine(config);
}
