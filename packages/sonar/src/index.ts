/**
 * Guardian Aegis Sonar Package
 * Sonar-based missing person search system for ocean and coastal rescue operations
 *
 * @packageDocumentation
 */

// Core exports
export { SonarEngine, createSonarEngine } from './core/sonar-engine';
export { DriftPredictor, createDriftPredictor } from './core/drift-predictor';

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

  // Detections
  DetectedObject,
  ObjectClassification,
  ConfidenceLevel,
  ObjectDimensions,
  MovementVector,

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

/**
 * Quick start factory function to create a fully configured sonar search system
 */
export function createSonarSearchSystem(options?: {
  region?: 'gold_coast' | 'generic';
}) {
  const sonarEngine = createSonarEngine();
  const driftPredictor = createDriftPredictor();
  const missionService = createMissionService(sonarEngine, driftPredictor);
  const residenceMapping = createResidenceMappingService();

  // Pre-configure for Gold Coast if specified
  if (options?.region === 'gold_coast') {
    const { GOLD_COAST_BEACHES, GOLD_COAST_MARINAS } = require('./utils/gold-coast');
    for (const beach of [...GOLD_COAST_BEACHES, ...GOLD_COAST_MARINAS]) {
      residenceMapping.addCoastalHotspot(beach);
    }
  }

  return {
    sonarEngine,
    driftPredictor,
    missionService,
    residenceMapping,

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
     * Get current human detections from sonar
     */
    getHumanDetections: () => sonarEngine.getHumanDetections(),
  };
}

// Import types for factory function
import type { GeoCoordinate, MissingPerson } from './types';
