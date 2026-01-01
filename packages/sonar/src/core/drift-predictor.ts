/**
 * Drift Prediction Engine
 * Calculates probable locations based on ocean currents, wind, and time
 */

import { nanoid } from 'nanoid';
import type {
  GeoCoordinate,
  WaterConditions,
  DriftPredictionInput,
  DriftPrediction,
  ProbabilityZone,
} from '../types';

/** Drift coefficients for different object types */
const DRIFT_COEFFICIENTS = {
  person_floating: {
    windFactor: 0.03, // 3% of wind speed
    currentFactor: 1.0, // 100% of current
    leewayAngle: 15, // degrees offset from wind
  },
  person_submerged: {
    windFactor: 0.0, // No wind effect underwater
    currentFactor: 0.95, // Slightly less than surface current
    leewayAngle: 0,
  },
  debris: {
    windFactor: 0.02,
    currentFactor: 1.0,
    leewayAngle: 10,
  },
  vessel: {
    windFactor: 0.04,
    currentFactor: 0.9,
    leewayAngle: 20,
  },
};

/** Meters per degree of latitude (approximately constant) */
const METERS_PER_LAT_DEGREE = 111320;

export class DriftPredictor {
  private predictionCache: Map<string, DriftPrediction> = new Map();

  /**
   * Calculate predicted drift path for a person or object
   */
  calculateDrift(input: DriftPredictionInput): DriftPrediction {
    const cacheKey = this.getCacheKey(input);
    const cached = this.predictionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const coefficients = DRIFT_COEFFICIENTS[input.objectType];
    const intervalMinutes = 15; // Calculate position every 15 minutes
    const totalIntervals = (input.predictionHours * 60) / intervalMinutes;

    const path: GeoCoordinate[] = [input.startLocation];
    const confidenceRadius: number[] = [0];

    let currentPos = { ...input.startLocation };
    let currentTime = input.startTime;
    let uncertainty = 0;

    for (let i = 0; i < totalIntervals; i++) {
      // Calculate drift vector for this interval
      const drift = this.calculateDriftVector(
        input.conditions,
        coefficients,
        intervalMinutes
      );

      // Apply drift to current position
      currentPos = this.applyDrift(currentPos, drift);
      currentTime += intervalMinutes * 60 * 1000;

      // Uncertainty grows with time
      uncertainty += this.calculateUncertaintyGrowth(input.conditions, intervalMinutes);

      path.push({ ...currentPos });
      confidenceRadius.push(uncertainty);
    }

    // Generate probability zones
    const probabilityZones = this.generateProbabilityZones(
      path,
      confidenceRadius,
      input.startTime
    );

    const prediction: DriftPrediction = {
      predictedPath: path,
      confidenceRadius,
      probabilityZones,
      calculatedAt: Date.now(),
    };

    // Cache for 5 minutes
    this.predictionCache.set(cacheKey, prediction);
    setTimeout(() => this.predictionCache.delete(cacheKey), 5 * 60 * 1000);

    return prediction;
  }

  /**
   * Calculate reverse drift - where person likely came from
   */
  calculateReverseDrift(
    currentLocation: GeoCoordinate,
    conditions: WaterConditions,
    hoursBack: number,
    objectType: DriftPredictionInput['objectType'] = 'person_floating'
  ): DriftPrediction {
    // Reverse the current and wind directions
    const reversedConditions: WaterConditions = {
      ...conditions,
      currentDirection: (conditions.currentDirection ?? 0 + 180) % 360,
      windDirection: (conditions.windDirection ?? 0 + 180) % 360,
    };

    return this.calculateDrift({
      startLocation: currentLocation,
      startTime: Date.now() - hoursBack * 60 * 60 * 1000,
      conditions: reversedConditions,
      objectType,
      predictionHours: hoursBack,
    });
  }

  /**
   * Estimate time in water based on conditions and distance from last known point
   */
  estimateTimeInWater(
    lastKnownLocation: GeoCoordinate,
    currentLocation: GeoCoordinate,
    conditions: WaterConditions
  ): { estimatedMinutes: number; confidence: number } {
    const distance = this.calculateDistance(lastKnownLocation, currentLocation);

    // Calculate average drift speed
    const coefficients = DRIFT_COEFFICIENTS.person_floating;
    const driftSpeed = this.calculateDriftSpeed(conditions, coefficients);

    if (driftSpeed === 0) {
      return { estimatedMinutes: 0, confidence: 0 };
    }

    const estimatedMinutes = distance / driftSpeed / 60;

    // Confidence decreases with time and distance
    const confidence = Math.max(0, 1 - (distance / 10000) - (estimatedMinutes / 1440));

    return { estimatedMinutes, confidence };
  }

  /**
   * Get optimal search areas based on drift prediction
   */
  getSearchPriorityAreas(
    prediction: DriftPrediction,
    maxAreas: number = 5
  ): ProbabilityZone[] {
    return prediction.probabilityZones
      .sort((a, b) => b.probability - a.probability)
      .slice(0, maxAreas);
  }

  /**
   * Update conditions and recalculate active predictions
   */
  clearCache(): void {
    this.predictionCache.clear();
  }

  // Private helper methods

  private calculateDriftVector(
    conditions: WaterConditions,
    coefficients: typeof DRIFT_COEFFICIENTS.person_floating,
    intervalMinutes: number
  ): { latOffset: number; lngOffset: number } {
    const intervalHours = intervalMinutes / 60;

    // Current contribution (in m/s, converted to distance)
    const currentSpeed = (conditions.currentSpeed ?? 0) * 0.514444; // knots to m/s
    const currentDir = (conditions.currentDirection ?? 0) * (Math.PI / 180);
    const currentDistance = currentSpeed * coefficients.currentFactor * intervalHours * 3600;

    // Wind contribution
    const windSpeed = (conditions.windSpeed ?? 0) * 0.514444; // knots to m/s
    const windDir = ((conditions.windDirection ?? 0) + coefficients.leewayAngle) * (Math.PI / 180);
    const windDistance = windSpeed * coefficients.windFactor * intervalHours * 3600;

    // Combine vectors
    const totalNorth =
      currentDistance * Math.cos(currentDir) +
      windDistance * Math.cos(windDir);
    const totalEast =
      currentDistance * Math.sin(currentDir) +
      windDistance * Math.sin(windDir);

    return {
      latOffset: totalNorth / METERS_PER_LAT_DEGREE,
      lngOffset: totalEast / METERS_PER_LAT_DEGREE, // Simplified, should use cos(lat)
    };
  }

  private applyDrift(
    position: GeoCoordinate,
    drift: { latOffset: number; lngOffset: number }
  ): GeoCoordinate {
    return {
      latitude: position.latitude + drift.latOffset,
      longitude: position.longitude + drift.lngOffset / Math.cos(position.latitude * Math.PI / 180),
      depth: position.depth,
    };
  }

  private calculateUncertaintyGrowth(
    conditions: WaterConditions,
    intervalMinutes: number
  ): number {
    // Base uncertainty growth per interval
    let growth = 50; // 50 meters base

    // Increase uncertainty with poor visibility
    if (conditions.visibility < 5) {
      growth *= 1.5;
    }

    // Increase uncertainty with rough seas
    if (conditions.waveHeight && conditions.waveHeight > 2) {
      growth *= 1.3;
    }

    // Increase uncertainty with strong currents
    if (conditions.currentSpeed && conditions.currentSpeed > 2) {
      growth *= 1.2;
    }

    return growth * (intervalMinutes / 15);
  }

  private generateProbabilityZones(
    path: GeoCoordinate[],
    confidenceRadius: number[],
    startTime: number
  ): ProbabilityZone[] {
    const zones: ProbabilityZone[] = [];
    const intervalMs = 15 * 60 * 1000; // 15 minutes

    // Create zones for key time points
    const keyPoints = [
      { index: Math.floor(path.length * 0.25), probability: 0.1 },
      { index: Math.floor(path.length * 0.5), probability: 0.2 },
      { index: Math.floor(path.length * 0.75), probability: 0.3 },
      { index: path.length - 1, probability: 0.4 },
    ];

    for (const { index, probability } of keyPoints) {
      if (index >= 0 && index < path.length) {
        const center = path[index];
        const radius = confidenceRadius[index] || 100;

        // Create octagon approximation of circle
        const polygon = this.createCirclePolygon(center, radius, 8);

        zones.push({
          polygon,
          probability,
          searchPriority: Math.ceil(probability * 10),
          estimatedTimeInZone: {
            start: startTime + (index - 1) * intervalMs,
            end: startTime + (index + 1) * intervalMs,
          },
        });
      }
    }

    return zones;
  }

  private createCirclePolygon(
    center: GeoCoordinate,
    radiusMeters: number,
    points: number
  ): GeoCoordinate[] {
    const polygon: GeoCoordinate[] = [];
    const latOffset = radiusMeters / METERS_PER_LAT_DEGREE;
    const lngOffset = radiusMeters / (METERS_PER_LAT_DEGREE * Math.cos(center.latitude * Math.PI / 180));

    for (let i = 0; i < points; i++) {
      const angle = (2 * Math.PI * i) / points;
      polygon.push({
        latitude: center.latitude + latOffset * Math.cos(angle),
        longitude: center.longitude + lngOffset * Math.sin(angle),
      });
    }

    return polygon;
  }

  private calculateDistance(a: GeoCoordinate, b: GeoCoordinate): number {
    // Haversine formula
    const R = 6371000; // Earth radius in meters
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

  private calculateDriftSpeed(
    conditions: WaterConditions,
    coefficients: typeof DRIFT_COEFFICIENTS.person_floating
  ): number {
    const currentSpeed = (conditions.currentSpeed ?? 0) * 0.514444 * coefficients.currentFactor;
    const windContribution = (conditions.windSpeed ?? 0) * 0.514444 * coefficients.windFactor;

    return currentSpeed + windContribution;
  }

  private getCacheKey(input: DriftPredictionInput): string {
    return `${input.startLocation.latitude.toFixed(4)}_${input.startLocation.longitude.toFixed(4)}_${input.startTime}_${input.predictionHours}_${input.objectType}`;
  }
}

/** Create a new drift predictor instance */
export function createDriftPredictor(): DriftPredictor {
  return new DriftPredictor();
}
