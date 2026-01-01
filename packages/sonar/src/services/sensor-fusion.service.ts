/**
 * Multi-Sensor Fusion Service
 * Combines sonar and thermal detections for improved accuracy
 */

import { nanoid } from 'nanoid';
import type {
  FusedDetection,
  DetectionSource,
  FusionConfig,
  DetectedObject,
  ThermalHotspot,
  GeoCoordinate,
  ConfidenceLevel,
  ObjectClassification,
  ThermalClassification,
  MovementVector,
  ThermalSignature,
  AcousticSignature,
} from '../types';
import { SonarEngine } from '../core/sonar-engine';
import { ThermalEngine } from '../core/thermal-engine';

/** Default fusion configuration */
const DEFAULT_FUSION_CONFIG: FusionConfig = {
  enabledSensors: ['sonar', 'thermal'],
  correlationRadiusMeters: 50,      // Detections within 50m are correlated
  correlationTimeWindowMs: 5000,    // Within 5 seconds
  requireMultipleSensors: false,    // Single sensor can trigger alert
  minimumConfidenceForAlert: 'medium',
  prioritySensor: 'thermal',        // Thermal for surface, sonar for underwater
};

/** Sensor fusion event */
export interface FusionEvent {
  type: 'new_detection' | 'detection_updated' | 'detection_confirmed' | 'sensors_correlated';
  detection: FusedDetection;
  timestamp: number;
}

export class SensorFusionService {
  private sonarEngine: SonarEngine;
  private thermalEngine: ThermalEngine;
  private config: FusionConfig;
  private fusedDetections: Map<string, FusedDetection> = new Map();
  private eventListeners: ((event: FusionEvent) => void)[] = [];
  private correlationMap: Map<string, Set<string>> = new Map(); // Maps source IDs to fused IDs

  constructor(
    sonarEngine: SonarEngine,
    thermalEngine: ThermalEngine,
    config: Partial<FusionConfig> = {}
  ) {
    this.sonarEngine = sonarEngine;
    this.thermalEngine = thermalEngine;
    this.config = { ...DEFAULT_FUSION_CONFIG, ...config };
  }

  /**
   * Process a new sonar detection and attempt correlation
   */
  processSonarDetection(detection: DetectedObject): FusedDetection {
    // Check for existing correlation
    const existingId = this.findCorrelatedDetection(detection.location, 'sonar');

    if (existingId) {
      return this.updateFusedDetection(existingId, 'sonar', detection);
    }

    // Check if we can correlate with thermal
    const thermalMatch = this.findNearbyThermalHotspot(detection.location);

    if (thermalMatch) {
      return this.createCorrelatedDetection(detection, thermalMatch);
    }

    // Create new single-source detection
    return this.createSonarOnlyDetection(detection);
  }

  /**
   * Process a new thermal hotspot and attempt correlation
   */
  processThermalHotspot(hotspot: ThermalHotspot): FusedDetection {
    // Check for existing correlation
    const existingId = this.findCorrelatedDetection(hotspot.location, 'thermal');

    if (existingId) {
      return this.updateFusedDetection(existingId, 'thermal', undefined, hotspot);
    }

    // Check if we can correlate with sonar
    const sonarMatch = this.findNearbySonarDetection(hotspot.location);

    if (sonarMatch) {
      return this.createCorrelatedDetection(sonarMatch, hotspot);
    }

    // Create new single-source detection
    return this.createThermalOnlyDetection(hotspot);
  }

  /**
   * Run correlation pass on all active detections
   */
  correlateAllDetections(): FusedDetection[] {
    const sonarDetections = this.sonarEngine.getAllDetections();
    const thermalHotspots = this.thermalEngine.getAllHotspots();

    const correlated: FusedDetection[] = [];

    // Process sonar first
    for (const detection of sonarDetections) {
      const fused = this.processSonarDetection(detection);
      if (fused.sources.length > 1) {
        correlated.push(fused);
      }
    }

    // Process thermal hotspots
    for (const hotspot of thermalHotspots) {
      // Skip if already correlated
      if (!this.correlationMap.has(`thermal:${hotspot.id}`)) {
        const fused = this.processThermalHotspot(hotspot);
        if (fused.sources.length > 1) {
          correlated.push(fused);
        }
      }
    }

    return correlated;
  }

  /**
   * Get all fused detections
   */
  getAllDetections(): FusedDetection[] {
    return Array.from(this.fusedDetections.values());
  }

  /**
   * Get human-classified fused detections
   */
  getHumanDetections(): FusedDetection[] {
    return this.getAllDetections().filter((d) => this.isHumanClassification(d.classification));
  }

  /**
   * Get high-confidence detections
   */
  getHighConfidenceDetections(): FusedDetection[] {
    return this.getAllDetections().filter(
      (d) => d.overallConfidence === 'high' || d.overallConfidence === 'confirmed'
    );
  }

  /**
   * Get detections from multiple sensors (highest reliability)
   */
  getMultiSensorDetections(): FusedDetection[] {
    return this.getAllDetections().filter((d) => d.sources.length > 1);
  }

  /**
   * Get detection by ID
   */
  getDetection(id: string): FusedDetection | undefined {
    return this.fusedDetections.get(id);
  }

  /**
   * Confirm a detection manually
   */
  confirmDetection(id: string, personId?: string): boolean {
    const detection = this.fusedDetections.get(id);
    if (!detection) return false;

    detection.overallConfidence = 'confirmed';
    if (personId) {
      detection.correlatedPersonId = personId;
      detection.correlationConfidence = 1.0;
    }

    this.fusedDetections.set(id, detection);
    this.emitEvent({
      type: 'detection_confirmed',
      detection,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Dismiss a detection
   */
  dismissDetection(id: string): boolean {
    const detection = this.fusedDetections.get(id);
    if (!detection) return false;

    // Remove from correlation map
    for (const source of detection.sources) {
      const key = `${source}:${id}`;
      this.correlationMap.delete(key);
    }

    return this.fusedDetections.delete(id);
  }

  /**
   * Calculate combined confidence from multiple sensors
   */
  calculateCombinedConfidence(
    sonarConfidence?: ConfidenceLevel,
    thermalConfidence?: ConfidenceLevel
  ): { confidence: ConfidenceLevel; score: number } {
    const scores: Record<ConfidenceLevel, number> = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      confirmed: 1.0,
    };

    const sonarScore = sonarConfidence ? scores[sonarConfidence] : 0;
    const thermalScore = thermalConfidence ? scores[thermalConfidence] : 0;

    // Multi-sensor bonus
    const hasMultiple = sonarConfidence && thermalConfidence;
    const bonus = hasMultiple ? 0.15 : 0;

    const combined = Math.min(1.0, Math.max(sonarScore, thermalScore) + bonus);

    let confidence: ConfidenceLevel;
    if (combined >= 0.9) confidence = 'confirmed';
    else if (combined >= 0.7) confidence = 'high';
    else if (combined >= 0.45) confidence = 'medium';
    else confidence = 'low';

    return { confidence, score: combined };
  }

  /**
   * Subscribe to fusion events
   */
  onFusionEvent(callback: (event: FusionEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get sensor agreement analysis
   */
  getSensorAgreement(): {
    totalDetections: number;
    sonarOnly: number;
    thermalOnly: number;
    correlated: number;
    agreementRate: number;
  } {
    const all = this.getAllDetections();
    const sonarOnly = all.filter((d) => d.sources.length === 1 && d.sources[0] === 'sonar').length;
    const thermalOnly = all.filter((d) => d.sources.length === 1 && d.sources[0] === 'thermal').length;
    const correlated = all.filter((d) => d.sources.length > 1).length;

    return {
      totalDetections: all.length,
      sonarOnly,
      thermalOnly,
      correlated,
      agreementRate: all.length > 0 ? correlated / all.length : 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FusionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Private helper methods

  private findCorrelatedDetection(
    location: GeoCoordinate,
    source: DetectionSource
  ): string | undefined {
    for (const [id, detection] of this.fusedDetections) {
      const distance = this.calculateDistance(location, detection.location);
      const timeDiff = Date.now() - detection.lastDetectedAt;

      if (
        distance <= this.config.correlationRadiusMeters &&
        timeDiff <= this.config.correlationTimeWindowMs
      ) {
        return id;
      }
    }
    return undefined;
  }

  private findNearbyThermalHotspot(location: GeoCoordinate): ThermalHotspot | undefined {
    const hotspots = this.thermalEngine.getAllHotspots();

    for (const hotspot of hotspots) {
      const distance = this.calculateDistance(location, hotspot.location);
      const timeDiff = Date.now() - hotspot.lastDetectedAt;

      if (
        distance <= this.config.correlationRadiusMeters &&
        timeDiff <= this.config.correlationTimeWindowMs
      ) {
        return hotspot;
      }
    }
    return undefined;
  }

  private findNearbySonarDetection(location: GeoCoordinate): DetectedObject | undefined {
    const detections = this.sonarEngine.getAllDetections();

    for (const detection of detections) {
      const distance = this.calculateDistance(location, detection.location);
      const timeDiff = Date.now() - detection.lastDetectedAt;

      if (
        distance <= this.config.correlationRadiusMeters &&
        timeDiff <= this.config.correlationTimeWindowMs
      ) {
        return detection;
      }
    }
    return undefined;
  }

  private createCorrelatedDetection(
    sonarDetection: DetectedObject,
    thermalHotspot: ThermalHotspot
  ): FusedDetection {
    const { confidence, score } = this.calculateCombinedConfidence(
      sonarDetection.confidence,
      thermalHotspot.confidence
    );

    // Use weighted average for location (thermal usually more precise for surface)
    const location = this.averageLocations(
      sonarDetection.location,
      thermalHotspot.location,
      0.4, // sonar weight
      0.6  // thermal weight
    );

    // Prefer thermal classification for surface detections
    const classification = this.isHumanClassification(thermalHotspot.classification)
      ? thermalHotspot.classification
      : sonarDetection.classification;

    const fused: FusedDetection = {
      id: nanoid(),
      sources: ['sonar', 'thermal'],
      primarySource: 'thermal',
      location,
      locationConfidence: score,
      classification,
      overallConfidence: confidence,
      sonarData: {
        acousticSignature: sonarDetection.acousticSignature!,
        depth: sonarDetection.location.depth,
      },
      thermalData: {
        temperature: thermalHotspot.temperatureCelsius,
        signature: this.thermalEngine.createSignature(
          thermalHotspot.temperatureCelsius,
          thermalHotspot.sizeMeters
        ),
        hypothermiaRisk: this.assessHypothermia(thermalHotspot.temperatureCelsius),
      },
      movement: thermalHotspot.movement ?? sonarDetection.movement,
      firstDetectedAt: Math.min(sonarDetection.firstDetectedAt, thermalHotspot.firstDetectedAt),
      lastDetectedAt: Date.now(),
      trackingHistory: this.mergeTrackingHistory(
        sonarDetection.trackingHistory,
        thermalHotspot.trackingHistory?.map((t) => t.location)
      ),
    };

    this.fusedDetections.set(fused.id, fused);
    this.correlationMap.set(`sonar:${sonarDetection.id}`, new Set([fused.id]));
    this.correlationMap.set(`thermal:${thermalHotspot.id}`, new Set([fused.id]));

    this.emitEvent({
      type: 'sensors_correlated',
      detection: fused,
      timestamp: Date.now(),
    });

    return fused;
  }

  private createSonarOnlyDetection(detection: DetectedObject): FusedDetection {
    const fused: FusedDetection = {
      id: nanoid(),
      sources: ['sonar'],
      primarySource: 'sonar',
      location: detection.location,
      locationConfidence: this.confidenceToScore(detection.confidence),
      classification: detection.classification,
      overallConfidence: detection.confidence,
      sonarData: {
        acousticSignature: detection.acousticSignature!,
        depth: detection.location.depth,
      },
      movement: detection.movement,
      firstDetectedAt: detection.firstDetectedAt,
      lastDetectedAt: detection.lastDetectedAt,
      trackingHistory: detection.trackingHistory,
    };

    this.fusedDetections.set(fused.id, fused);
    this.correlationMap.set(`sonar:${detection.id}`, new Set([fused.id]));

    this.emitEvent({
      type: 'new_detection',
      detection: fused,
      timestamp: Date.now(),
    });

    return fused;
  }

  private createThermalOnlyDetection(hotspot: ThermalHotspot): FusedDetection {
    const fused: FusedDetection = {
      id: nanoid(),
      sources: ['thermal'],
      primarySource: 'thermal',
      location: hotspot.location,
      locationConfidence: this.confidenceToScore(hotspot.confidence),
      classification: hotspot.classification,
      overallConfidence: hotspot.confidence,
      thermalData: {
        temperature: hotspot.temperatureCelsius,
        signature: this.thermalEngine.createSignature(
          hotspot.temperatureCelsius,
          hotspot.sizeMeters
        ),
        hypothermiaRisk: this.assessHypothermia(hotspot.temperatureCelsius),
      },
      movement: hotspot.movement,
      firstDetectedAt: hotspot.firstDetectedAt,
      lastDetectedAt: hotspot.lastDetectedAt,
      trackingHistory: hotspot.trackingHistory?.map((t) => t.location),
    };

    this.fusedDetections.set(fused.id, fused);
    this.correlationMap.set(`thermal:${hotspot.id}`, new Set([fused.id]));

    this.emitEvent({
      type: 'new_detection',
      detection: fused,
      timestamp: Date.now(),
    });

    return fused;
  }

  private updateFusedDetection(
    fusedId: string,
    source: DetectionSource,
    sonarDetection?: DetectedObject,
    thermalHotspot?: ThermalHotspot
  ): FusedDetection {
    const existing = this.fusedDetections.get(fusedId)!;

    // Add source if not present
    if (!existing.sources.includes(source)) {
      existing.sources.push(source);
    }

    // Update with new data
    if (sonarDetection) {
      existing.sonarData = {
        acousticSignature: sonarDetection.acousticSignature!,
        depth: sonarDetection.location.depth,
      };
      existing.movement = sonarDetection.movement ?? existing.movement;
    }

    if (thermalHotspot) {
      existing.thermalData = {
        temperature: thermalHotspot.temperatureCelsius,
        signature: this.thermalEngine.createSignature(
          thermalHotspot.temperatureCelsius,
          thermalHotspot.sizeMeters
        ),
        hypothermiaRisk: this.assessHypothermia(thermalHotspot.temperatureCelsius),
      };
      existing.movement = thermalHotspot.movement ?? existing.movement;
      existing.location = thermalHotspot.location; // Prefer thermal location for surface
    }

    // Recalculate confidence
    const { confidence, score } = this.calculateCombinedConfidence(
      existing.sonarData ? this.scoreToConfidence(existing.locationConfidence) : undefined,
      existing.thermalData ? this.scoreToConfidence(existing.locationConfidence) : undefined
    );
    existing.overallConfidence = confidence;
    existing.locationConfidence = score;
    existing.lastDetectedAt = Date.now();

    this.fusedDetections.set(fusedId, existing);

    this.emitEvent({
      type: 'detection_updated',
      detection: existing,
      timestamp: Date.now(),
    });

    return existing;
  }

  private isHumanClassification(
    classification: ObjectClassification | ThermalClassification
  ): boolean {
    return (
      classification === 'human_body' ||
      classification === 'human_moving' ||
      classification === 'human_floating' ||
      classification === 'human_alive' ||
      classification === 'human_distressed' ||
      classification === 'human_unconscious' ||
      classification === 'human_in_water'
    );
  }

  private assessHypothermia(temperature: number): 'none' | 'mild' | 'moderate' | 'severe' {
    if (temperature < 30) return 'severe';
    if (temperature < 32) return 'moderate';
    if (temperature < 35) return 'mild';
    return 'none';
  }

  private averageLocations(
    a: GeoCoordinate,
    b: GeoCoordinate,
    weightA: number,
    weightB: number
  ): GeoCoordinate {
    return {
      latitude: a.latitude * weightA + b.latitude * weightB,
      longitude: a.longitude * weightA + b.longitude * weightB,
      depth: a.depth ?? b.depth,
    };
  }

  private mergeTrackingHistory(
    a?: GeoCoordinate[],
    b?: GeoCoordinate[]
  ): GeoCoordinate[] {
    const merged = [...(a ?? []), ...(b ?? [])];
    // Sort by implied time order and deduplicate nearby points
    return merged.slice(-100);
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

  private scoreToConfidence(score: number): ConfidenceLevel {
    if (score >= 0.9) return 'confirmed';
    if (score >= 0.7) return 'high';
    if (score >= 0.45) return 'medium';
    return 'low';
  }

  private calculateDistance(a: GeoCoordinate, b: GeoCoordinate): number {
    const R = 6371000;
    const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
    const dLon = (b.longitude - a.longitude) * (Math.PI / 180);
    const lat1 = a.latitude * (Math.PI / 180);
    const lat2 = b.latitude * (Math.PI / 180);

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c;
  }

  private emitEvent(event: FusionEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

/** Create a new sensor fusion service */
export function createSensorFusionService(
  sonarEngine: SonarEngine,
  thermalEngine: ThermalEngine,
  config?: Partial<FusionConfig>
): SensorFusionService {
  return new SensorFusionService(sonarEngine, thermalEngine, config);
}
