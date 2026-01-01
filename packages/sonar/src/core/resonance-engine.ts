/**
 * Resonance Mapping Engine
 * Detects objects using acoustic resonance signatures
 * Can detect breathing, heartbeat, and identify humans even when buried or submerged
 */

import { nanoid } from 'nanoid';
import type {
  ResonanceScan,
  ResonanceSignature,
  ResonanceMode,
  ResonanceConfig,
  ResonancePattern,
  ResonanceClassification,
  GeoCoordinate,
  ConfidenceLevel,
} from '../types';

/** Human body resonance patterns */
const HUMAN_RESONANCE_PATTERNS: ResonancePattern[] = [
  {
    name: 'chest_cavity',
    fundamentalHz: { min: 40, max: 80 },
    harmonicRatios: [2, 3, 4],
    expectedQFactor: { min: 5, max: 15 },
    classification: 'human_body',
  },
  {
    name: 'breathing_rhythm',
    fundamentalHz: { min: 0.2, max: 0.5 }, // 12-30 breaths/min
    harmonicRatios: [2, 3],
    expectedQFactor: { min: 2, max: 8 },
    classification: 'human_breathing',
  },
  {
    name: 'heartbeat',
    fundamentalHz: { min: 0.8, max: 2.5 }, // 48-150 bpm
    harmonicRatios: [2, 3, 4, 5],
    expectedQFactor: { min: 3, max: 10 },
    classification: 'human_heartbeat',
  },
  {
    name: 'submerged_body',
    fundamentalHz: { min: 30, max: 60 }, // Lower in water
    harmonicRatios: [2, 2.5, 3],
    expectedQFactor: { min: 3, max: 10 },
    classification: 'human_submerged',
  },
  {
    name: 'buried_body',
    fundamentalHz: { min: 20, max: 50 }, // Damped by sand/debris
    harmonicRatios: [2, 3],
    expectedQFactor: { min: 2, max: 6 },
    classification: 'human_buried',
  },
];

/** Default resonance configuration */
const DEFAULT_CONFIG: ResonanceConfig = {
  defaultMode: 'swept_frequency',
  frequencyRangeHz: { min: 0.1, max: 500 },
  scanIntervalMs: 2000,
  sensitivityDb: -60,
  humanResonancePatterns: HUMAN_RESONANCE_PATTERNS,
  detectBreathing: true,
  detectHeartbeat: true,
  estimateBodyMass: true,
};

export class ResonanceEngine {
  private config: ResonanceConfig;
  private activeSignatures: Map<string, ResonanceSignature> = new Map();
  private scanHistory: ResonanceScan[] = [];
  private isScanning = false;
  private scanIntervalId?: ReturnType<typeof setInterval>;

  constructor(config: Partial<ResonanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Start continuous resonance scanning */
  startScanning(location: GeoCoordinate): void {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;

    this.scanIntervalId = setInterval(() => {
      this.performScan(location);
    }, this.config.scanIntervalMs);
  }

  /** Stop continuous scanning */
  stopScanning(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = undefined;
    }
    this.isScanning = false;
  }

  /** Perform a single resonance scan */
  performScan(
    location: GeoCoordinate,
    mode: ResonanceMode = this.config.defaultMode
  ): ResonanceScan {
    const scan: ResonanceScan = {
      id: nanoid(),
      timestamp: Date.now(),
      location,
      mode,
      frequencyRangeHz: this.config.frequencyRangeHz,
      scanDurationMs: this.getScanDuration(mode),
      detectedResonances: [],
    };

    // In production, this would process actual acoustic data
    // For now, we maintain tracked signatures
    for (const signature of this.activeSignatures.values()) {
      if (this.isInRange(signature.location, location, 500)) {
        signature.lastDetectedAt = Date.now();
        scan.detectedResonances.push(signature);
      }
    }

    this.scanHistory.push(scan);

    // Keep last 500 scans
    if (this.scanHistory.length > 500) {
      this.scanHistory = this.scanHistory.slice(-500);
    }

    return scan;
  }

  /**
   * Analyze frequency spectrum to detect resonance signatures
   * In production, this would process actual FFT data from hydrophones
   */
  analyzeSpectrum(
    frequencyData: number[],
    amplitudeData: number[],
    location: GeoCoordinate
  ): ResonanceSignature | null {
    // Find peaks in the spectrum (resonant frequencies)
    const peaks = this.findSpectralPeaks(frequencyData, amplitudeData);

    if (peaks.length === 0) {
      return null;
    }

    // Get fundamental frequency (strongest peak)
    const fundamental = peaks.reduce((a, b) =>
      b.amplitude > a.amplitude ? b : a
    );

    // Find harmonics
    const harmonics = this.findHarmonics(peaks, fundamental.frequency);

    // Calculate Q factor
    const qFactor = this.calculateQFactor(
      frequencyData,
      amplitudeData,
      fundamental.frequency
    );

    // Classify based on resonance pattern
    const classification = this.classifyResonance(
      fundamental.frequency,
      harmonics,
      qFactor
    );

    // Estimate body mass if human
    const bodyMass = classification.classification.includes('human')
      ? this.estimateBodyMass(fundamental.frequency, qFactor)
      : undefined;

    const signature: ResonanceSignature = {
      id: nanoid(),
      location,
      fundamentalFrequencyHz: fundamental.frequency,
      harmonics: harmonics.map(h => h.frequency),
      qualityFactor: qFactor,
      dampingRatio: 1 / (2 * qFactor),
      amplitudeProfile: peaks.map(p => p.amplitude),
      phaseProfile: peaks.map(() => Math.random() * 360), // Placeholder
      classification: classification.classification,
      confidence: classification.confidence,
      bodyMassEstimateKg: bodyMass,
      firstDetectedAt: Date.now(),
      lastDetectedAt: Date.now(),
    };

    this.activeSignatures.set(signature.id, signature);
    return signature;
  }

  /**
   * Register a resonance detection from external source
   */
  registerDetection(
    location: GeoCoordinate,
    fundamentalHz: number,
    harmonics: number[],
    qFactor: number,
    amplitudeProfile: number[]
  ): ResonanceSignature {
    const classification = this.classifyResonance(
      fundamentalHz,
      harmonics.map(h => ({ frequency: h, amplitude: 1 })),
      qFactor
    );

    const signature: ResonanceSignature = {
      id: nanoid(),
      location,
      fundamentalFrequencyHz: fundamentalHz,
      harmonics,
      qualityFactor: qFactor,
      dampingRatio: 1 / (2 * qFactor),
      amplitudeProfile,
      phaseProfile: harmonics.map(() => 0),
      classification: classification.classification,
      confidence: classification.confidence,
      bodyMassEstimateKg: this.estimateBodyMass(fundamentalHz, qFactor),
      firstDetectedAt: Date.now(),
      lastDetectedAt: Date.now(),
    };

    this.activeSignatures.set(signature.id, signature);
    return signature;
  }

  /** Get all human-classified resonance signatures */
  getHumanSignatures(): ResonanceSignature[] {
    return Array.from(this.activeSignatures.values()).filter(
      s => s.classification.startsWith('human')
    );
  }

  /** Get signatures with breathing detected */
  getBreathingDetections(): ResonanceSignature[] {
    return Array.from(this.activeSignatures.values()).filter(
      s => s.classification === 'human_breathing'
    );
  }

  /** Get signatures with heartbeat detected */
  getHeartbeatDetections(): ResonanceSignature[] {
    return Array.from(this.activeSignatures.values()).filter(
      s => s.classification === 'human_heartbeat'
    );
  }

  /** Get all active signatures */
  getAllSignatures(): ResonanceSignature[] {
    return Array.from(this.activeSignatures.values());
  }

  /** Confirm a signature detection */
  confirmSignature(id: string): boolean {
    const signature = this.activeSignatures.get(id);
    if (signature) {
      signature.confidence = 'confirmed';
      this.activeSignatures.set(id, signature);
      return true;
    }
    return false;
  }

  /** Dismiss a false detection */
  dismissSignature(id: string): boolean {
    return this.activeSignatures.delete(id);
  }

  /** Get scan history */
  getScanHistory(limit?: number): ResonanceScan[] {
    if (limit) {
      return this.scanHistory.slice(-limit);
    }
    return [...this.scanHistory];
  }

  /**
   * Check if person is alive based on resonance signatures
   * Looks for breathing and/or heartbeat patterns
   */
  checkVitalSigns(signatureId: string): {
    isAlive: boolean;
    breathingDetected: boolean;
    heartbeatDetected: boolean;
    estimatedHeartRateBpm?: number;
    estimatedBreathingRate?: number;
    confidence: number;
  } {
    const signature = this.activeSignatures.get(signatureId);

    if (!signature) {
      return {
        isAlive: false,
        breathingDetected: false,
        heartbeatDetected: false,
        confidence: 0,
      };
    }

    const breathingDetected =
      signature.classification === 'human_breathing' ||
      this.detectBreathingInSignature(signature);

    const heartbeatDetected =
      signature.classification === 'human_heartbeat' ||
      this.detectHeartbeatInSignature(signature);

    const isAlive = breathingDetected || heartbeatDetected;

    return {
      isAlive,
      breathingDetected,
      heartbeatDetected,
      estimatedHeartRateBpm: heartbeatDetected
        ? Math.round(signature.fundamentalFrequencyHz * 60)
        : undefined,
      estimatedBreathingRate: breathingDetected
        ? Math.round(signature.fundamentalFrequencyHz * 60)
        : undefined,
      confidence: this.confidenceToScore(signature.confidence),
    };
  }

  /** Update configuration */
  updateConfig(config: Partial<ResonanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Get current configuration */
  getConfig(): ResonanceConfig {
    return { ...this.config };
  }

  // Private helper methods

  private getScanDuration(mode: ResonanceMode): number {
    const durations: Record<ResonanceMode, number> = {
      acoustic_resonance: 500,
      harmonic_analysis: 1000,
      swept_frequency: 2000,
      pulse_resonance: 200,
      continuous_wave: 5000,
    };
    return durations[mode];
  }

  private findSpectralPeaks(
    frequencies: number[],
    amplitudes: number[]
  ): Array<{ frequency: number; amplitude: number }> {
    const peaks: Array<{ frequency: number; amplitude: number }> = [];
    const threshold = Math.max(...amplitudes) * 0.3;

    for (let i = 1; i < amplitudes.length - 1; i++) {
      if (
        amplitudes[i] > amplitudes[i - 1] &&
        amplitudes[i] > amplitudes[i + 1] &&
        amplitudes[i] > threshold
      ) {
        peaks.push({
          frequency: frequencies[i],
          amplitude: amplitudes[i],
        });
      }
    }

    return peaks.sort((a, b) => b.amplitude - a.amplitude);
  }

  private findHarmonics(
    peaks: Array<{ frequency: number; amplitude: number }>,
    fundamental: number
  ): Array<{ frequency: number; amplitude: number }> {
    const tolerance = 0.1; // 10% tolerance
    const harmonics: Array<{ frequency: number; amplitude: number }> = [];

    for (let n = 2; n <= 5; n++) {
      const expectedFreq = fundamental * n;
      const harmonic = peaks.find(
        p => Math.abs(p.frequency - expectedFreq) / expectedFreq < tolerance
      );
      if (harmonic) {
        harmonics.push(harmonic);
      }
    }

    return harmonics;
  }

  private calculateQFactor(
    frequencies: number[],
    amplitudes: number[],
    peakFreq: number
  ): number {
    // Find -3dB points to calculate bandwidth
    const peakIdx = frequencies.findIndex(f => Math.abs(f - peakFreq) < 0.5);
    if (peakIdx < 0) return 10; // Default Q factor

    const peakAmp = amplitudes[peakIdx];
    const halfPower = peakAmp * 0.707; // -3dB point

    // Find lower and upper -3dB frequencies
    let lowerIdx = peakIdx;
    let upperIdx = peakIdx;

    while (lowerIdx > 0 && amplitudes[lowerIdx] > halfPower) lowerIdx--;
    while (upperIdx < amplitudes.length - 1 && amplitudes[upperIdx] > halfPower) upperIdx++;

    const bandwidth = frequencies[upperIdx] - frequencies[lowerIdx];
    return bandwidth > 0 ? peakFreq / bandwidth : 10;
  }

  private classifyResonance(
    fundamental: number,
    harmonics: Array<{ frequency: number; amplitude: number }>,
    qFactor: number
  ): { classification: ResonanceClassification; confidence: ConfidenceLevel } {
    let bestMatch: ResonancePattern | null = null;
    let bestScore = 0;

    for (const pattern of this.config.humanResonancePatterns) {
      let score = 0;

      // Check fundamental frequency match
      if (
        fundamental >= pattern.fundamentalHz.min &&
        fundamental <= pattern.fundamentalHz.max
      ) {
        score += 0.4;
      }

      // Check Q factor match
      if (
        qFactor >= pattern.expectedQFactor.min &&
        qFactor <= pattern.expectedQFactor.max
      ) {
        score += 0.3;
      }

      // Check harmonics match
      const harmonicRatios = harmonics.map(h => h.frequency / fundamental);
      const matchingHarmonics = pattern.harmonicRatios.filter(expected =>
        harmonicRatios.some(actual => Math.abs(actual - expected) < 0.15)
      );
      score += 0.3 * (matchingHarmonics.length / pattern.harmonicRatios.length);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    if (bestMatch && bestScore > 0.5) {
      return {
        classification: bestMatch.classification,
        confidence: bestScore > 0.8 ? 'high' : bestScore > 0.65 ? 'medium' : 'low',
      };
    }

    // Non-human classifications
    if (fundamental > 200) {
      return { classification: 'debris_metal', confidence: 'low' };
    }
    if (qFactor < 2) {
      return { classification: 'debris_organic', confidence: 'low' };
    }

    return { classification: 'unknown', confidence: 'low' };
  }

  private estimateBodyMass(fundamental: number, qFactor: number): number {
    // Empirical formula: body mass correlates with resonant frequency
    // Lower frequency = larger mass
    // Human chest cavity: ~40-80 Hz for 50-100 kg
    const baseMass = 75; // kg at 60 Hz
    const baseFreq = 60;

    // Mass roughly inversely proportional to frequency squared
    const massEstimate = baseMass * Math.pow(baseFreq / fundamental, 2);

    // Clamp to reasonable human range
    return Math.max(30, Math.min(150, massEstimate));
  }

  private detectBreathingInSignature(signature: ResonanceSignature): boolean {
    // Look for low frequency modulation in the 0.2-0.5 Hz range
    return signature.harmonics.some(h => h >= 0.2 && h <= 0.5);
  }

  private detectHeartbeatInSignature(signature: ResonanceSignature): boolean {
    // Look for ~1-2 Hz component (60-120 bpm)
    return signature.harmonics.some(h => h >= 0.8 && h <= 2.5);
  }

  private isInRange(a: GeoCoordinate, b: GeoCoordinate, rangeMeters: number): boolean {
    const R = 6371000;
    const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
    const dLon = (b.longitude - a.longitude) * (Math.PI / 180);
    const lat1 = a.latitude * (Math.PI / 180);
    const lat2 = b.latitude * (Math.PI / 180);

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c <= rangeMeters;
  }

  private confidenceToScore(confidence: ConfidenceLevel): number {
    const scores: Record<ConfidenceLevel, number> = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      confirmed: 1.0,
    };
    return scores[confidence];
  }
}

/** Create a new resonance engine instance */
export function createResonanceEngine(config?: Partial<ResonanceConfig>): ResonanceEngine {
  return new ResonanceEngine(config);
}
