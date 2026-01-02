/**
 * VybeXonR - Guardian Aegis Search & Rescue Package
 *
 * Advanced multi-sensor missing person search and two-way communication system
 * combining sonar, thermal imaging, resonance mapping, and personal beacons
 * for ocean, coastal, and vicinity rescue operations.
 *
 * Key capabilities:
 * - Sonar detection (underwater acoustic signatures)
 * - Thermal imaging (surface heat detection, hypothermia alerts)
 * - Resonance mapping (vital signs: breathing, heartbeat detection)
 * - Personal beacon tracking (GPS, SOS, fall/water detection)
 * - VybeXonR two-way resonance communication (vibration/frequency-based signaling)
 * - Multi-sensor fusion (correlate detections from all sources)
 * - Drift prediction (ocean current-based location forecasting)
 * - Triangulation (locate signal sources from base stations)
 * - Baby interpreter (infant cry analysis, need interpretation, caregiver guidance)
 *
 * @packageDocumentation
 */

// Core exports - Sonar
export { SonarEngine, createSonarEngine } from './core/sonar-engine';
export { DriftPredictor, createDriftPredictor } from './core/drift-predictor';

// Core exports - Thermal
export { ThermalEngine, createThermalEngine } from './core/thermal-engine';

// Core exports - Resonance
export { ResonanceEngine, createResonanceEngine } from './core/resonance-engine';

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

export {
  BeaconTrackerService,
  createBeaconTrackerService,
  type TrackerEvent,
} from './services/beacon-tracker.service';

export {
  VybeXonRService,
  createVybeXonRService,
  type VybeEvent,
} from './services/vybexonr.service';

export {
  BabyInterpreterService,
  createBabyInterpreterService,
  type BabyEvent,
} from './services/baby-interpreter.service';

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

  // Resonance mapping
  ResonanceMode,
  ResonanceScan,
  ResonanceSignature,
  ResonanceClassification,
  ResonanceConfig,
  ResonancePattern,

  // Personal beacons/trackers
  TrackerDeviceType,
  TrackerStatus,
  PersonalTracker,
  EmergencyContact,
  TrackerSettings,
  GeofenceArea,
  TrackerLocationUpdate,
  TrackerVitals,
  SOSAlert,
  TrackerServiceConfig,
  TrackerFleetStatus,

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

  // VybeXonR two-way communication
  VybeSignalType,
  VybeTransmissionMode,
  VybeBeacon,
  VybeBeaconStatus,
  VybeBeaconSettings,
  VybeTransmission,
  VybeReception,
  VybePattern,
  SOSPattern,
  VybeCommunicationSession,
  VybeBaseStation,
  VybeTriangulation,
  VybeSystemConfig,
  VybeNetworkStatus,

  // Baby interpreter - infant communication
  BabyCryPattern,
  BabyNeed,
  BabyState,
  CryAcousticSignature,
  BabyVitals,
  BabyProfile,
  LearnedCryPattern,
  BabyCryDetection,
  BabyMonitorSession,
  BabyAlert,
  CryInterpretation,
  CaregiverAction,
  BabyInterpreterConfig,
  BabyInterpreterStatus,
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
import type {
  GeoCoordinate,
  MissingPerson,
  ThermalEnvironment,
  FusedDetection,
  TrackerDeviceType,
  EmergencyContact,
  SOSAlert,
  VybeSignalType,
  VybeCommunicationSession,
} from './types';
import { createSonarEngine } from './core/sonar-engine';
import { createDriftPredictor } from './core/drift-predictor';
import { createThermalEngine } from './core/thermal-engine';
import { createResonanceEngine } from './core/resonance-engine';
import { createMissionService } from './services/mission.service';
import { createResidenceMappingService } from './services/residence-mapping.service';
import { createSensorFusionService } from './services/sensor-fusion.service';
import { createBeaconTrackerService } from './services/beacon-tracker.service';
import { createVybeXonRService } from './services/vybexonr.service';
import { createBabyInterpreterService } from './services/baby-interpreter.service';
import type { BabyNeed, CryInterpretation, CryAcousticSignature, BabyAlert } from './types';

/**
 * Quick start factory function to create a fully configured multi-sensor search system
 * with sonar (underwater), thermal (surface), resonance (vital signs), and beacon tracking
 */
export function createSearchAndRescueSystem(options?: {
  region?: 'gold_coast' | 'generic';
  enableThermal?: boolean;
  enableSonar?: boolean;
  enableResonance?: boolean;
  enableBeacons?: boolean;
}) {
  const enableSonar = options?.enableSonar ?? true;
  const enableThermal = options?.enableThermal ?? true;
  const enableResonance = options?.enableResonance ?? true;
  const enableBeacons = options?.enableBeacons ?? true;

  const sonarEngine = createSonarEngine();
  const thermalEngine = createThermalEngine();
  const resonanceEngine = createResonanceEngine();
  const driftPredictor = createDriftPredictor();
  const missionService = createMissionService(sonarEngine, driftPredictor);
  const residenceMapping = createResidenceMappingService();
  const beaconTracker = createBeaconTrackerService();
  const vybeXonR = createVybeXonRService();
  const babyInterpreter = createBabyInterpreterService();
  const sensorFusion = createSensorFusionService(sonarEngine, thermalEngine, {
    enabledSensors: [
      ...(enableSonar ? ['sonar' as const] : []),
      ...(enableThermal ? ['thermal' as const] : []),
      ...(enableResonance ? ['resonance' as const] : []),
      ...(enableBeacons ? ['beacon' as const] : []),
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
    resonanceEngine,
    driftPredictor,

    // Services
    missionService,
    residenceMapping,
    sensorFusion,
    beaconTracker,
    vybeXonR,
    babyInterpreter,

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
     * Get current human detections from thermal (surface heat signatures)
     */
    getThermalDetections: () => thermalEngine.getHumanHotspots(),

    /**
     * Get current human detections from resonance (vital signs, buried/submerged)
     */
    getResonanceDetections: () => resonanceEngine.getHumanSignatures(),

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
     * Run correlation pass to combine all sensor detections
     */
    correlateDetections: () => sensorFusion.correlateAllDetections(),

    // ==================== Personal Beacon/Tracker Functions ====================

    /**
     * Register a personal tracker (wrist device, phone app, etc.)
     */
    registerTracker: (
      ownerId: string,
      ownerName: string,
      deviceType: TrackerDeviceType,
      options?: {
        phoneNumber?: string;
        emergencyContacts?: EmergencyContact[];
      }
    ) => beaconTracker.registerTracker(ownerId, ownerName, deviceType, options),

    /**
     * Get all active SOS alerts
     */
    getActiveSOSAlerts: (): SOSAlert[] => beaconTracker.getActiveSOSAlerts(),

    /**
     * Get tracker fleet status (all registered trackers)
     */
    getTrackerFleetStatus: () => beaconTracker.getFleetStatus(),

    /**
     * Trigger SOS for a tracker
     */
    triggerSOS: (trackerId: string) => beaconTracker.triggerSOS(trackerId),

    /**
     * Resolve an SOS alert
     */
    resolveSOS: (alertId: string, isFalseAlarm?: boolean) =>
      beaconTracker.resolveSOS(alertId, isFalseAlarm),

    // ==================== Vital Signs Detection ====================

    /**
     * Check vital signs from resonance detection
     */
    checkVitalSigns: (signatureId: string) => resonanceEngine.checkVitalSigns(signatureId),

    /**
     * Get detections with breathing detected
     */
    getBreathingDetections: () => resonanceEngine.getBreathingDetections(),

    /**
     * Get detections with heartbeat detected
     */
    getHeartbeatDetections: () => resonanceEngine.getHeartbeatDetections(),

    // ==================== VybeXonR Two-Way Communication ====================

    /**
     * Register a VybeXonR beacon for two-way resonance communication
     */
    registerVybeBeacon: (
      ownerId: string,
      ownerName: string,
      deviceType: 'wrist_vybe' | 'pendant_vybe' | 'embedded_vybe' | 'phone_vybe' = 'wrist_vybe'
    ) => vybeXonR.registerBeacon(ownerId, ownerName, deviceType),

    /**
     * Trigger SOS signal via VybeXonR beacon
     */
    triggerVybeSOS: (beaconId: string, signalType: VybeSignalType = 'sos_distress') =>
      vybeXonR.triggerSOS(beaconId, signalType),

    /**
     * Cancel an active VybeXonR SOS
     */
    cancelVybeSOS: (beaconId: string) => vybeXonR.cancelSOS(beaconId),

    /**
     * Send a signal from a VybeXonR beacon
     */
    sendVybeSignal: (beaconId: string, signalType: VybeSignalType, data?: Record<string, unknown>) =>
      vybeXonR.transmitSignal(beaconId, signalType, data),

    /**
     * Get all active VybeXonR communication sessions
     */
    getActiveVybeSessions: (): VybeCommunicationSession[] => vybeXonR.getActiveSessions(),

    /**
     * Get VybeXonR network status (base stations, beacons, signal quality)
     */
    getVybeNetworkStatus: () => vybeXonR.getNetworkStatus(),

    /**
     * Register a VybeXonR base station for triangulation
     */
    registerVybeBaseStation: (
      name: string,
      location: GeoCoordinate,
      rangeMeters: number = 5000
    ) => vybeXonR.registerBaseStation(name, location, rangeMeters),

    /**
     * Attempt to triangulate a signal source from base station readings
     */
    triangulateVybeSignal: (beaconId: string) => vybeXonR.attemptTriangulation(beaconId),

    /**
     * Start listening for incoming VybeXonR signals
     */
    startVybeListening: () => vybeXonR.startListening(),

    /**
     * Stop listening for incoming VybeXonR signals
     */
    stopVybeListening: () => vybeXonR.stopListening(),

    // ==================== Baby Interpreter - Infant Communication ====================

    /**
     * Register a baby profile for personalized cry interpretation
     */
    registerBaby: (
      name: string,
      birthDate: number,
      options?: {
        healthConditions?: string[];
        feedingSchedule?: number[];
        sleepPattern?: 'short_napper' | 'long_napper' | 'irregular';
      }
    ) => babyInterpreter.registerBaby(name, birthDate, options),

    /**
     * Start monitoring session for a baby
     */
    startBabyMonitoring: (babyId: string) => babyInterpreter.startMonitoring(babyId),

    /**
     * Stop monitoring session
     */
    stopBabyMonitoring: (sessionId: string) => babyInterpreter.stopMonitoring(sessionId),

    /**
     * Process cry audio and get interpretation with suggested actions
     */
    interpretBabyCry: (
      babyId: string | undefined,
      acousticSignature: CryAcousticSignature
    ): CryInterpretation => babyInterpreter.processCryAudio(babyId, acousticSignature),

    /**
     * Confirm or correct interpretation (helps system learn baby's patterns)
     */
    confirmBabyInterpretation: (
      detectionId: string,
      actualNeed: BabyNeed,
      wasCorrect: boolean
    ) => babyInterpreter.confirmInterpretation(detectionId, actualNeed, wasCorrect),

    /**
     * Get all active baby alerts
     */
    getActiveBabyAlerts: (): BabyAlert[] => babyInterpreter.getActiveAlerts(),

    /**
     * Acknowledge a baby alert
     */
    acknowledgeBabyAlert: (alertId: string, actionsTaken?: string[]) =>
      babyInterpreter.acknowledgeAlert(alertId, actionsTaken),

    /**
     * Get baby interpreter status
     */
    getBabyInterpreterStatus: () => babyInterpreter.getStatus(),

    /**
     * Get all registered babies
     */
    getAllBabies: () => babyInterpreter.getAllBabies(),
  };
}

// Legacy alias for backward compatibility
export const createSonarSearchSystem = createSearchAndRescueSystem;
