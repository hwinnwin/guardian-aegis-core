/**
 * Guardian Aegis Search & Rescue Package
 * Multi-sensor missing person search system combining sonar and thermal imaging
 * for ocean, coastal, and vicinity rescue operations
 *
 * @packageDocumentation
 */

// Core exports - Sonar
export { SonarEngine, createSonarEngine } from './core/sonar-engine';
export { DriftPredictor, createDriftPredictor } from './core/drift-predictor';

// Core exports - Thermal
export { ThermalEngine, createThermalEngine } from './core/thermal-engine';

// Service exports
export {
  MissionService,
  createMissionService,
  type MissionServiceConfig,
} from './services/mission.service';

export {
  ResidenceMappingService,
  createResidenceMappingService,
  type ResidenceMappingConfig,
} from './services/residence-mapping.service';

export {
  SensorFusionService,
  createSensorFusionService,
  type FusionEvent,
} from './services/sensor-fusion.service';

// Type exports
export type {
  // Geographic
  GeoCoordinate,
  SearchEnvironment,

  // Sonar operations
  SonarMode,
  SonarPing,
  SonarConfig,
  AcousticSignature,

  // Sonar detections
  DetectedObject,
  ObjectClassification,
  ConfidenceLevel,
  ObjectDimensions,
  MovementVector,

  // Thermal operations
  ThermalMode,
  ThermalPlatform,
  ThermalScanConfig,
  ThermalPalette,
  ThermalFrame,
  ThermalConfig,
  ThermalEnvironment,
  ThermalThresholds,

  // Thermal detections
  ThermalHotspot,
  ThermalClassification,
  ThermalSignature,
  ThermalPattern,
  ThermalTrackPoint,
  HotspotShape,

  // Multi-sensor fusion
  DetectionSource,
  FusedDetection,
  FusionConfig,
  MultiSensorAsset,
  SensorCapability,

  // Missing person
  MissingPerson,
  PhysicalProfile,
  ClothingDescription,

  // Search operations
  SearchArea,
  SearchMission,
  SearchAsset,
  AssetType,
  MissionStatus,
  UrgencyLevel,

  // Conditions
  WaterConditions,

  // Events
  MissionEvent,
  EventType,

  // Drift prediction
  DriftPredictionInput,
  DriftPrediction,
  ProbabilityZone,

  // Residence mapping
  ResidenceMapping,
  KnownLocation,
  RecognitionIntegration,
} from './types';

// Gold Coast utilities
export {
  GOLD_COAST_BOUNDS,
  GOLD_COAST_CURRENTS,
  GOLD_COAST_WATER_TEMP,
  GOLD_COAST_BEACHES,
  GOLD_COAST_MARINAS,
  RIP_CURRENT_ZONES,
  getCurrentSeason,
  getTypicalConditions,
  isInGoldCoastRegion,
  findNearestBeach,
  getHighRiskZones,
  isNearRipCurrentZone,
  generateGoldCoastSearchGrid,
  estimateSurvivalTime,
  type CoastalHotspot,
} from './utils/gold-coast';

// Import types and engines for factory function
import type { GeoCoordinate, MissingPerson, ThermalEnvironment, FusedDetection } from './types';
import { createSonarEngine } from './core/sonar-engine';
import { createDriftPredictor } from './core/drift-predictor';
import { createThermalEngine } from './core/thermal-engine';
import { createMissionService } from './services/mission.service';
import { createResidenceMappingService } from './services/residence-mapping.service';
import { createSensorFusionService } from './services/sensor-fusion.service';

/**
 * Quick start factory function to create a fully configured multi-sensor search system
 * with both sonar (underwater) and thermal (surface/aerial) detection capabilities
 */
export function createSearchAndRescueSystem(options?: {
  region?: 'gold_coast' | 'generic';
  enableThermal?: boolean;
  enableSonar?: boolean;
}) {
  const enableSonar = options?.enableSonar ?? true;
  const enableThermal = options?.enableThermal ?? true;

  const sonarEngine = createSonarEngine();
  const thermalEngine = createThermalEngine();
  const driftPredictor = createDriftPredictor();
  const missionService = createMissionService(sonarEngine, driftPredictor);
  const residenceMapping = createResidenceMappingService();
  const sensorFusion = createSensorFusionService(sonarEngine, thermalEngine, {
    enabledSensors: [
      ...(enableSonar ? ['sonar' as const] : []),
      ...(enableThermal ? ['thermal' as const] : []),
    ],
  });

  // Pre-configure for Gold Coast if specified
  if (options?.region === 'gold_coast') {
    const { GOLD_COAST_BEACHES, GOLD_COAST_MARINAS, getTypicalConditions } = require('./utils/gold-coast');
    for (const beach of [...GOLD_COAST_BEACHES, ...GOLD_COAST_MARINAS]) {
      residenceMapping.addCoastalHotspot(beach);
    }

    // Set typical Gold Coast conditions
    const conditions = getTypicalConditions();
    thermalEngine.updateEnvironment({
      airTempCelsius: conditions.waterTempCelsius + 3,
      waterSurfaceTempCelsius: conditions.waterTempCelsius,
      humidity: 70,
      windSpeedKnots: conditions.windSpeed ?? 10,
      visibility: 'clear',
      timeOfDay: 'day',
      recordedAt: Date.now(),
    });
  }

  return {
    // Core engines
    sonarEngine,
    thermalEngine,
    driftPredictor,

    // Services
    missionService,
    residenceMapping,
    sensorFusion,

    /**
     * Quick report of a missing person at sea
     */
    reportMissingPerson: (
      name: string,
      lastSeenLocation: GeoCoordinate,
      lastSeenTime: number = Date.now(),
      details?: Partial<MissingPerson>
    ) => missionService.reportMissingPerson(name, lastSeenLocation, lastSeenTime, details),

    /**
     * Get all active search missions
     */
    getActiveMissions: () => missionService.getActiveMissions(),

    /**
     * Get current human detections from sonar (underwater)
     */
    getSonarDetections: () => sonarEngine.getHumanDetections(),

    /**
     * Get current human detections from thermal (surface)
     */
    getThermalDetections: () => thermalEngine.getHumanHotspots(),

    /**
     * Get all fused detections (combined from all sensors)
     */
    getFusedDetections: (): FusedDetection[] => sensorFusion.getHumanDetections(),

    /**
     * Get high-confidence multi-sensor detections
     */
    getConfirmedDetections: (): FusedDetection[] => sensorFusion.getMultiSensorDetections(),

    /**
     * Update environmental conditions (affects thermal detection)
     */
    updateEnvironment: (env: Partial<ThermalEnvironment>) => thermalEngine.updateEnvironment(env),

    /**
     * Get hypothermia alerts from thermal imaging
     */
    getHypothermiaAlerts: () => thermalEngine.getHypothermiaAlerts(),

    /**
     * Run correlation pass to combine sonar and thermal detections
     */
    correlateDetections: () => sensorFusion.correlateAllDetections(),
  };
}

// Legacy alias for backward compatibility
export const createSonarSearchSystem = createSearchAndRescueSystem;
