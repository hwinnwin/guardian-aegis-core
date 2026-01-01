/**
 * Thermal Imaging Engine
 * Detects human heat signatures for surface and aerial search operations
 */

import { nanoid } from 'nanoid';
import type {
  ThermalFrame,
  ThermalHotspot,
  ThermalMode,
  ThermalPlatform,
  ThermalConfig,
  ThermalEnvironment,
  ThermalThresholds,
  ThermalSignature,
  ThermalClassification,
  ThermalPattern,
  ThermalTrackPoint,
  HotspotShape,
  GeoCoordinate,
  ConfidenceLevel,
  MovementVector,
} from '../types';

/** Default thermal detection thresholds */
const DEFAULT_THRESHOLDS: ThermalThresholds = {
  minHumanTemp: 28,           // Minimum skin temp in water
  maxHumanTemp: 37,           // Normal body temp
  hypothermiaWarning: 33,     // Mild hypothermia threshold
  hypothermiaCritical: 30,    // Severe hypothermia
  minDeltaFromAmbient: 2,     // Min 2°C above ambient to detect
  minAreaSquareMeters: 0.1,   // Min ~30cm x 30cm
  maxAreaSquareMeters: 2.5,   // Max ~1.5m x 1.5m for single human
};

/** Default thermal configuration */
const DEFAULT_CONFIG: ThermalConfig = {
  defaultMode: 'long_wave_infrared',
  defaultPlatform: 'aerial_drone',
  scanIntervalMs: 500,
  thresholds: DEFAULT_THRESHOLDS,
  autoClassify: true,
  trackMovement: true,
  alertOnHuman: true,
  alertOnHypothermia: true,
};

/** Human body thermal patterns by condition */
const HUMAN_THERMAL_PATTERNS = {
  healthy: {
    coreTemp: { min: 35, max: 37 },
    extremityTemp: { min: 28, max: 34 },
    pattern: 'core_hot' as ThermalPattern,
  },
  mildHypothermia: {
    coreTemp: { min: 33, max: 35 },
    extremityTemp: { min: 24, max: 30 },
    pattern: 'peripheral_cool' as ThermalPattern,
  },
  severeHypothermia: {
    coreTemp: { min: 28, max: 33 },
    extremityTemp: { min: 20, max: 26 },
    pattern: 'core_cooling' as ThermalPattern,
  },
};

export class ThermalEngine {
  private config: ThermalConfig;
  private activeHotspots: Map<string, ThermalHotspot> = new Map();
  private frameHistory: ThermalFrame[] = [];
  private isScanning = false;
  private scanIntervalId?: ReturnType<typeof setInterval>;

  constructor(config: Partial<ThermalConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
    };
  }

  /** Start continuous thermal scanning */
  startScanning(location: GeoCoordinate, altitudeMeters?: number): void {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;

    this.scanIntervalId = setInterval(() => {
      this.captureFrame(location, altitudeMeters);
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

  /** Capture a single thermal frame */
  captureFrame(
    location: GeoCoordinate,
    altitudeMeters: number = 100,
    mode: ThermalMode = this.config.defaultMode
  ): ThermalFrame {
    const ambientTemp = this.config.environment?.airTempCelsius ?? 25;
    const coverageRadius = this.calculateCoverageRadius(altitudeMeters);

    const frame: ThermalFrame = {
      id: nanoid(),
      timestamp: Date.now(),
      location,
      altitudeMeters,
      coverageArea: this.calculateCoveragePolygon(location, coverageRadius),
      mode,
      platform: this.config.defaultPlatform,
      ambientTempCelsius: ambientTemp,
      hotspots: [],
    };

    // Process frame and detect hotspots
    // In production, this would analyze actual thermal image data
    // For now, we maintain existing tracked hotspots

    // Update tracking for existing hotspots
    for (const hotspot of this.activeHotspots.values()) {
      if (this.isInCoverage(hotspot.location, location, coverageRadius)) {
        hotspot.lastDetectedAt = Date.now();
        frame.hotspots.push(hotspot);
      }
    }

    this.frameHistory.push(frame);

    // Keep only last 500 frames
    if (this.frameHistory.length > 500) {
      this.frameHistory = this.frameHistory.slice(-500);
    }

    return frame;
  }

  /** Analyze a thermal hotspot to classify it */
  analyzeHotspot(
    temperature: number,
    deltaFromAmbient: number,
    size: { width: number; height: number },
    movement?: MovementVector
  ): {
    classification: ThermalClassification;
    confidence: ConfidenceLevel;
    shape: HotspotShape;
    hypothermiaRisk?: 'none' | 'mild' | 'moderate' | 'severe';
  } {
    const { thresholds } = this.config;
    const area = size.width * size.height;
    const aspectRatio = size.width / size.height;

    // Determine shape
    const shape = this.classifyShape(aspectRatio, area);

    // Check if size is consistent with human
    const sizeConsistent =
      area >= thresholds.minAreaSquareMeters &&
      area <= thresholds.maxAreaSquareMeters;

    // Check temperature is in human range
    const tempConsistent =
      temperature >= thresholds.minHumanTemp &&
      temperature <= thresholds.maxHumanTemp;

    // Check delta from ambient
    const deltaConsistent = deltaFromAmbient >= thresholds.minDeltaFromAmbient;

    // Classify based on combined factors
    if (sizeConsistent && tempConsistent && deltaConsistent) {
      const hypothermiaRisk = this.assessHypothermiaRisk(temperature);
      const isHumanoid = shape === 'humanoid' || shape === 'prone' || shape === 'elongated';

      if (isHumanoid) {
        // Human classification
        let classification: ThermalClassification;
        let confidence: ConfidenceLevel;

        if (movement && (movement.pattern === 'swimming' || movement.pattern === 'struggling')) {
          classification = 'human_alive';
          confidence = 'high';
        } else if (movement && movement.speed > 0.1) {
          classification = 'human_alive';
          confidence = 'high';
        } else if (hypothermiaRisk !== 'none') {
          classification = 'human_distressed';
          confidence = 'high';
        } else if (!movement || movement.pattern === 'stationary') {
          classification = 'human_unconscious';
          confidence = 'medium';
        } else {
          classification = 'human_in_water';
          confidence = 'medium';
        }

        return { classification, confidence, shape, hypothermiaRisk };
      }
    }

    // Non-human classifications
    if (area > thresholds.maxAreaSquareMeters) {
      if (temperature > 40) {
        return { classification: 'vessel_engine', confidence: 'high', shape };
      }
      return { classification: 'animal_large', confidence: 'medium', shape };
    }

    if (deltaFromAmbient > 20) {
      return { classification: 'vessel_engine', confidence: 'high', shape };
    }

    if (area < thresholds.minAreaSquareMeters) {
      return { classification: 'animal_small', confidence: 'low', shape };
    }

    if (!deltaConsistent && temperature > 30) {
      return { classification: 'debris_warm', confidence: 'low', shape };
    }

    return { classification: 'unknown', confidence: 'low', shape };
  }

  /** Create a thermal signature profile from hotspot data */
  createSignature(
    temperature: number,
    size: { width: number; height: number },
    gradient?: number[]
  ): ThermalSignature {
    const area = size.width * size.height;
    const aspectRatio = size.width / size.height;

    // Determine thermal pattern
    let pattern: ThermalPattern;
    if (temperature >= 35) {
      pattern = 'core_hot';
    } else if (temperature >= 33) {
      pattern = 'uniform_warm';
    } else if (temperature >= 30) {
      pattern = 'peripheral_cool';
    } else if (temperature >= 28) {
      pattern = 'core_cooling';
    } else {
      pattern = 'residual_heat';
    }

    return {
      peakTemperature: temperature,
      averageTemperature: temperature - 2, // Estimate
      temperatureGradient: gradient ?? [temperature - 5, temperature - 3, temperature, temperature - 3, temperature - 5],
      aspectRatio,
      areaSquareMeters: area,
      thermalPattern: pattern,
    };
  }

  /** Register a new hotspot detection */
  registerHotspot(
    location: GeoCoordinate,
    temperature: number,
    ambientTemp: number,
    size: { width: number; height: number },
    movement?: MovementVector
  ): ThermalHotspot {
    const deltaFromAmbient = temperature - ambientTemp;
    const analysis = this.analyzeHotspot(temperature, deltaFromAmbient, size, movement);

    const hotspot: ThermalHotspot = {
      id: nanoid(),
      location,
      temperatureCelsius: temperature,
      deltaFromAmbient,
      sizeMeters: size,
      shape: analysis.shape,
      classification: analysis.classification,
      confidence: analysis.confidence,
      movementDetected: !!movement && movement.speed > 0,
      movement,
      firstDetectedAt: Date.now(),
      lastDetectedAt: Date.now(),
      trackingHistory: [{ location, timestamp: Date.now(), temperatureCelsius: temperature }],
    };

    this.activeHotspots.set(hotspot.id, hotspot);
    return hotspot;
  }

  /** Update an existing hotspot with new data */
  updateHotspot(
    id: string,
    location: GeoCoordinate,
    temperature: number,
    movement?: MovementVector
  ): ThermalHotspot | undefined {
    const hotspot = this.activeHotspots.get(id);
    if (!hotspot) return undefined;

    hotspot.location = location;
    hotspot.temperatureCelsius = temperature;
    hotspot.lastDetectedAt = Date.now();
    hotspot.movement = movement;
    hotspot.movementDetected = !!movement && movement.speed > 0;

    // Add to tracking history
    if (!hotspot.trackingHistory) {
      hotspot.trackingHistory = [];
    }
    hotspot.trackingHistory.push({
      location,
      timestamp: Date.now(),
      temperatureCelsius: temperature,
    });

    // Keep last 100 track points
    if (hotspot.trackingHistory.length > 100) {
      hotspot.trackingHistory = hotspot.trackingHistory.slice(-100);
    }

    // Re-analyze classification if temperature changed significantly
    const analysis = this.analyzeHotspot(
      temperature,
      hotspot.deltaFromAmbient,
      hotspot.sizeMeters,
      movement
    );
    hotspot.classification = analysis.classification;
    hotspot.confidence = analysis.confidence;

    this.activeHotspots.set(id, hotspot);
    return hotspot;
  }

  /** Get all human-classified hotspots */
  getHumanHotspots(): ThermalHotspot[] {
    return Array.from(this.activeHotspots.values()).filter(
      (h) =>
        h.classification === 'human_alive' ||
        h.classification === 'human_distressed' ||
        h.classification === 'human_unconscious' ||
        h.classification === 'human_in_water'
    );
  }

  /** Get all active hotspots */
  getAllHotspots(): ThermalHotspot[] {
    return Array.from(this.activeHotspots.values());
  }

  /** Get hotspots indicating hypothermia */
  getHypothermiaAlerts(): ThermalHotspot[] {
    return this.getHumanHotspots().filter((h) => {
      const risk = this.assessHypothermiaRisk(h.temperatureCelsius);
      return risk !== 'none';
    });
  }

  /** Confirm a hotspot as human (manual verification) */
  confirmHotspot(id: string): boolean {
    const hotspot = this.activeHotspots.get(id);
    if (hotspot) {
      hotspot.confidence = 'confirmed';
      hotspot.classification = 'human_alive';
      this.activeHotspots.set(id, hotspot);
      return true;
    }
    return false;
  }

  /** Dismiss a false positive */
  dismissHotspot(id: string): boolean {
    return this.activeHotspots.delete(id);
  }

  /** Get frame history */
  getFrameHistory(limit?: number): ThermalFrame[] {
    if (limit) {
      return this.frameHistory.slice(-limit);
    }
    return [...this.frameHistory];
  }

  /** Update environment conditions */
  updateEnvironment(environment: Partial<ThermalEnvironment>): void {
    this.config.environment = {
      ...this.config.environment,
      ...environment,
      recordedAt: Date.now(),
    } as ThermalEnvironment;
  }

  /** Get optimal scan altitude for conditions */
  getOptimalAltitude(): { altitude: number; reason: string } {
    const env = this.config.environment;

    if (!env) {
      return { altitude: 100, reason: 'Default altitude - no environment data' };
    }

    // Lower altitude in fog/rain for better resolution
    if (env.visibility === 'fog' || env.visibility === 'rain') {
      return { altitude: 50, reason: 'Low altitude for poor visibility' };
    }

    // Higher altitude at night for wider coverage
    if (env.timeOfDay === 'night') {
      return { altitude: 150, reason: 'Higher altitude - good thermal contrast at night' };
    }

    // Mid altitude in clear conditions
    if (env.visibility === 'clear') {
      return { altitude: 120, reason: 'Optimal altitude for clear conditions' };
    }

    return { altitude: 80, reason: 'Moderate altitude for current conditions' };
  }

  /** Calculate survival urgency based on thermal readings */
  calculateThermalUrgency(hotspot: ThermalHotspot): {
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedTimeRemaining?: number; // minutes
    recommendation: string;
  } {
    const temp = hotspot.temperatureCelsius;
    const risk = this.assessHypothermiaRisk(temp);

    if (risk === 'severe') {
      return {
        urgency: 'critical',
        estimatedTimeRemaining: 15,
        recommendation: 'IMMEDIATE RESCUE REQUIRED - Severe hypothermia detected',
      };
    }

    if (risk === 'moderate') {
      return {
        urgency: 'high',
        estimatedTimeRemaining: 45,
        recommendation: 'Urgent rescue - Moderate hypothermia, condition deteriorating',
      };
    }

    if (risk === 'mild') {
      return {
        urgency: 'medium',
        estimatedTimeRemaining: 120,
        recommendation: 'Priority rescue - Mild hypothermia signs present',
      };
    }

    if (hotspot.classification === 'human_unconscious') {
      return {
        urgency: 'high',
        estimatedTimeRemaining: 30,
        recommendation: 'Urgent rescue - Person appears unconscious',
      };
    }

    return {
      urgency: 'low',
      recommendation: 'Continue monitoring - Vital signs appear stable',
    };
  }

  /** Update configuration */
  updateConfig(config: Partial<ThermalConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      thresholds: { ...this.config.thresholds, ...config.thresholds },
    };
  }

  /** Get current configuration */
  getConfig(): ThermalConfig {
    return { ...this.config };
  }

  // Private helper methods

  private classifyShape(aspectRatio: number, area: number): HotspotShape {
    // Humanoid: roughly 1:2 to 1:4 ratio (standing/swimming)
    if (aspectRatio >= 0.25 && aspectRatio <= 0.6 && area >= 0.3) {
      return 'humanoid';
    }

    // Prone: wider than tall (lying flat)
    if (aspectRatio > 1.5 && aspectRatio < 4 && area >= 0.4) {
      return 'prone';
    }

    // Fetal: roughly square
    if (aspectRatio >= 0.7 && aspectRatio <= 1.3 && area >= 0.2 && area <= 0.6) {
      return 'fetal';
    }

    // Elongated: very long and thin (arms extended, swimming)
    if (aspectRatio < 0.25 || aspectRatio > 4) {
      return 'elongated';
    }

    // Circular: could be animal
    if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
      return 'circular';
    }

    // Linear: vessel or large debris
    if (aspectRatio > 5 || aspectRatio < 0.2) {
      return 'linear';
    }

    return 'irregular';
  }

  private assessHypothermiaRisk(temperature: number): 'none' | 'mild' | 'moderate' | 'severe' {
    const { thresholds } = this.config;

    if (temperature < thresholds.hypothermiaCritical) {
      return 'severe';
    }
    if (temperature < thresholds.hypothermiaWarning - 2) {
      return 'moderate';
    }
    if (temperature < thresholds.hypothermiaWarning) {
      return 'mild';
    }
    return 'none';
  }

  private calculateCoverageRadius(altitudeMeters: number): number {
    // Approximate coverage based on typical 40° FOV
    // tan(20°) ≈ 0.364
    return altitudeMeters * 0.364;
  }

  private calculateCoveragePolygon(center: GeoCoordinate, radiusMeters: number): GeoCoordinate[] {
    const points: GeoCoordinate[] = [];
    const numPoints = 8;
    const latOffset = radiusMeters / 111320;
    const lngOffset = radiusMeters / (111320 * Math.cos(center.latitude * Math.PI / 180));

    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      points.push({
        latitude: center.latitude + latOffset * Math.cos(angle),
        longitude: center.longitude + lngOffset * Math.sin(angle),
      });
    }

    return points;
  }

  private isInCoverage(
    point: GeoCoordinate,
    center: GeoCoordinate,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(point, center);
    return distance <= radiusMeters;
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
}

/** Create a new thermal engine instance */
export function createThermalEngine(config?: Partial<ThermalConfig>): ThermalEngine {
  return new ThermalEngine(config);
}
