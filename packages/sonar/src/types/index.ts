/**
 * Sonar-based Missing Person Search System Types
 * For ocean, coastal, and vicinity search and rescue operations
 */

/** Geographic coordinate with optional depth for underwater searches */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  depth?: number; // meters below surface (negative = underwater)
  altitude?: number; // meters above sea level
  accuracy?: number; // GPS accuracy in meters
}

/** Search environment types */
export type SearchEnvironment =
  | 'ocean_surface'
  | 'ocean_underwater'
  | 'coastal_waters'
  | 'river'
  | 'lake'
  | 'beach'
  | 'cliff_coastal'
  | 'harbor'
  | 'reef';

/** Sonar detection modes */
export type SonarMode =
  | 'active_ping'      // Traditional active sonar
  | 'passive_listen'   // Listen for sounds/movement
  | 'side_scan'        // Side-scan sonar for seabed
  | 'multi_beam'       // High-resolution 3D mapping
  | 'synthetic_aperture'; // SAR for detailed imaging

/** Detection confidence levels */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'confirmed';

/** Search urgency levels */
export type UrgencyLevel = 'routine' | 'elevated' | 'urgent' | 'critical';

/** Missing person physical characteristics */
export interface PhysicalProfile {
  heightCm?: number;
  weightKg?: number;
  bodyType?: 'slim' | 'average' | 'athletic' | 'heavy';
  clothing?: ClothingDescription[];
  equipment?: string[]; // life jacket, surfboard, etc.
  distinctiveFeatures?: string[];
}

/** Clothing item description */
export interface ClothingDescription {
  type: 'wetsuit' | 'swimwear' | 'clothing' | 'life_jacket' | 'flotation_device' | 'other';
  color?: string;
  material?: string;
  reflective?: boolean;
}

/** Missing person profile */
export interface MissingPerson {
  id: string;
  name: string;
  age?: number;
  physical?: PhysicalProfile;
  lastSeenLocation: GeoCoordinate;
  lastSeenTime: number; // Unix timestamp
  lastKnownActivity?: string; // swimming, surfing, boating, etc.
  medicalConditions?: string[];
  swimmingAbility?: 'none' | 'basic' | 'competent' | 'strong' | 'professional';
  companions?: string[]; // IDs of other missing persons in group
  residenceLocation?: GeoCoordinate; // For residence mapping integration
  photoUrl?: string;
  reportedBy?: string;
  reportedAt: number;
}

/** Search area definition */
export interface SearchArea {
  id: string;
  name: string;
  center: GeoCoordinate;
  radiusMeters: number;
  environment: SearchEnvironment;
  polygon?: GeoCoordinate[]; // Custom shape if not circular
  currentConditions?: WaterConditions;
  priority: UrgencyLevel;
  assignedAssets?: string[]; // IDs of search assets
  createdAt: number;
  updatedAt: number;
}

/** Water and environmental conditions */
export interface WaterConditions {
  waterTempCelsius?: number;
  visibility: number; // meters
  currentSpeed?: number; // knots
  currentDirection?: number; // degrees
  waveHeight?: number; // meters
  tidalState?: 'low' | 'rising' | 'high' | 'falling';
  weather?: 'clear' | 'cloudy' | 'rain' | 'storm';
  windSpeed?: number; // knots
  windDirection?: number; // degrees
  recordedAt: number;
}

/** Sonar ping/detection event */
export interface SonarPing {
  id: string;
  timestamp: number;
  location: GeoCoordinate;
  mode: SonarMode;
  frequency: number; // Hz
  signalStrength: number; // dB
  returnTime?: number; // milliseconds for active sonar
  detectedObjects: DetectedObject[];
}

/** Object detected by sonar */
export interface DetectedObject {
  id: string;
  classification: ObjectClassification;
  confidence: ConfidenceLevel;
  location: GeoCoordinate;
  size?: ObjectDimensions;
  movement?: MovementVector;
  acousticSignature?: AcousticSignature;
  firstDetectedAt: number;
  lastDetectedAt: number;
  trackingHistory?: GeoCoordinate[];
}

/** Object classification categories */
export type ObjectClassification =
  | 'human_body'
  | 'human_moving'
  | 'human_floating'
  | 'flotation_device'
  | 'debris'
  | 'marine_life'
  | 'vessel'
  | 'rock_formation'
  | 'unknown';

/** Physical dimensions */
export interface ObjectDimensions {
  lengthMeters?: number;
  widthMeters?: number;
  heightMeters?: number;
  estimatedMass?: number; // kg
}

/** Movement tracking */
export interface MovementVector {
  speed: number; // m/s
  heading: number; // degrees
  verticalSpeed?: number; // m/s (positive = ascending)
  pattern?: 'stationary' | 'drifting' | 'swimming' | 'struggling' | 'erratic';
}

/** Acoustic signature for pattern matching */
export interface AcousticSignature {
  frequencyProfile: number[]; // frequency components
  amplitudeProfile: number[]; // amplitude at each frequency
  temporalPattern?: string; // encoded pattern
  matchConfidence?: number; // 0-1 match to human signatures
}

/** Search mission definition */
export interface SearchMission {
  id: string;
  name: string;
  missingPersons: MissingPerson[];
  searchAreas: SearchArea[];
  status: MissionStatus;
  priority: UrgencyLevel;
  startedAt: number;
  estimatedDuration?: number; // hours
  coordinatorId?: string;
  assets: SearchAsset[];
  detections: DetectedObject[];
  timeline: MissionEvent[];
}

/** Mission status */
export type MissionStatus =
  | 'planning'
  | 'active'
  | 'paused'
  | 'person_located'
  | 'rescue_in_progress'
  | 'completed'
  | 'suspended';

/** Search asset (boat, drone, diver team, etc.) */
export interface SearchAsset {
  id: string;
  type: AssetType;
  name: string;
  currentLocation?: GeoCoordinate;
  status: 'available' | 'deployed' | 'returning' | 'maintenance';
  capabilities: SonarMode[];
  maxDepthMeters?: number;
  rangeMeters?: number;
  crew?: number;
}

/** Types of search assets */
export type AssetType =
  | 'surface_vessel'
  | 'underwater_drone'
  | 'aerial_drone'
  | 'diver_team'
  | 'helicopter'
  | 'fixed_sonar'
  | 'towed_array';

/** Mission timeline event */
export interface MissionEvent {
  id: string;
  timestamp: number;
  type: EventType;
  description: string;
  location?: GeoCoordinate;
  relatedObjectId?: string;
  severity?: UrgencyLevel;
}

/** Event types in mission timeline */
export type EventType =
  | 'mission_started'
  | 'area_defined'
  | 'asset_deployed'
  | 'detection'
  | 'detection_confirmed'
  | 'detection_dismissed'
  | 'person_located'
  | 'rescue_initiated'
  | 'person_recovered'
  | 'conditions_updated'
  | 'area_expanded'
  | 'mission_paused'
  | 'mission_resumed'
  | 'mission_completed';

/** Drift prediction model input */
export interface DriftPredictionInput {
  startLocation: GeoCoordinate;
  startTime: number;
  conditions: WaterConditions;
  objectType: 'person_floating' | 'person_submerged' | 'debris' | 'vessel';
  predictionHours: number;
}

/** Drift prediction result */
export interface DriftPrediction {
  predictedPath: GeoCoordinate[];
  confidenceRadius: number[]; // uncertainty at each point
  probabilityZones: ProbabilityZone[];
  calculatedAt: number;
}

/** Probability zone for search prioritization */
export interface ProbabilityZone {
  polygon: GeoCoordinate[];
  probability: number; // 0-1
  searchPriority: number; // 1-10
  estimatedTimeInZone?: { start: number; end: number };
}

/** Residence mapping entry for last known location correlation */
export interface ResidenceMapping {
  personId: string;
  homeLocation: GeoCoordinate;
  knownLocations: KnownLocation[];
  frequentRoutes?: GeoCoordinate[][];
  lastUpdated: number;
}

/** Known location for a person */
export interface KnownLocation {
  name: string;
  location: GeoCoordinate;
  type: 'home' | 'work' | 'frequent' | 'beach' | 'marina' | 'other';
  visitFrequency?: 'daily' | 'weekly' | 'occasional';
}

/** Integration with external recognition systems (e.g., Lumyn Prime) */
export interface RecognitionIntegration {
  provider: string;
  capabilities: string[];
  endpoint?: string;
  isAvailable: boolean;
  lastPing?: number;
}

/** Sonar system configuration */
export interface SonarConfig {
  defaultMode: SonarMode;
  pingIntervalMs: number;
  maxDepthMeters: number;
  frequencyRangeHz: { min: number; max: number };
  sensitivityThreshold: number;
  humanSignaturePatterns: AcousticSignature[];
  autoExpandSearch: boolean;
  driftPredictionEnabled: boolean;
  recognitionIntegrations: RecognitionIntegration[];
}

// ============================================================================
// THERMAL IMAGING TYPES
// ============================================================================

/** Thermal detection modes */
export type ThermalMode =
  | 'long_wave_infrared'    // LWIR 8-14μm - best for body heat
  | 'mid_wave_infrared'     // MWIR 3-5μm - good contrast
  | 'short_wave_infrared'   // SWIR 1-3μm - see through fog
  | 'multi_spectral'        // Combined bands
  | 'radiometric';          // Precise temperature measurement

/** Thermal sensor platform types */
export type ThermalPlatform =
  | 'aerial_drone'
  | 'helicopter'
  | 'fixed_wing'
  | 'satellite'
  | 'ground_vehicle'
  | 'handheld'
  | 'tower_mounted'
  | 'marine_vessel';

/** Thermal scan parameters */
export interface ThermalScanConfig {
  mode: ThermalMode;
  platform: ThermalPlatform;
  altitudeMeters?: number;        // For aerial platforms
  fieldOfViewDegrees: number;     // FOV angle
  resolutionPixels: { width: number; height: number };
  frameRateHz: number;
  sensitivityMk: number;          // Millikelvin sensitivity (lower = better)
  minTempCelsius: number;
  maxTempCelsius: number;
  autoGainControl: boolean;
  colorPalette: ThermalPalette;
}

/** Thermal color palettes */
export type ThermalPalette =
  | 'white_hot'      // Hot = white, cold = black
  | 'black_hot'      // Hot = black, cold = white
  | 'iron_bow'       // Purple→blue→yellow→red
  | 'rainbow'        // Full spectrum
  | 'sepia'          // Brown tones
  | 'arctic'         // Blue-white
  | 'lava';          // Red-yellow

/** Thermal scan/frame result */
export interface ThermalFrame {
  id: string;
  timestamp: number;
  location: GeoCoordinate;        // Center of scan area
  altitudeMeters?: number;
  coverageArea: GeoCoordinate[];  // Polygon of covered area
  mode: ThermalMode;
  platform: ThermalPlatform;
  ambientTempCelsius: number;
  hotspots: ThermalHotspot[];
  rawDataUrl?: string;            // Link to full thermal image
}

/** Detected thermal hotspot */
export interface ThermalHotspot {
  id: string;
  location: GeoCoordinate;
  temperatureCelsius: number;
  deltaFromAmbient: number;       // Difference from surrounding
  sizeMeters: { width: number; height: number };
  shape: HotspotShape;
  classification: ThermalClassification;
  confidence: ConfidenceLevel;
  movementDetected: boolean;
  movement?: MovementVector;
  firstDetectedAt: number;
  lastDetectedAt: number;
  trackingHistory?: ThermalTrackPoint[];
}

/** Shape analysis of thermal hotspot */
export type HotspotShape =
  | 'humanoid'        // Human body shape
  | 'prone'           // Lying down
  | 'fetal'           // Curled up
  | 'elongated'       // Swimming position
  | 'circular'        // Could be animal or debris
  | 'irregular'       // Debris or multiple objects
  | 'linear';         // Vessel or debris

/** Thermal object classification */
export type ThermalClassification =
  | 'human_alive'           // Live human (body temp signature)
  | 'human_distressed'      // Human showing signs of hypothermia
  | 'human_unconscious'     // Stationary human-shaped heat source
  | 'human_in_water'        // Partial body visible above water
  | 'animal_large'          // Large marine animal (dolphin, seal)
  | 'animal_small'          // Smaller animal
  | 'vessel_engine'         // Boat engine heat
  | 'debris_warm'           // Sun-heated debris
  | 'water_anomaly'         // Unusual water temperature
  | 'unknown';

/** Thermal tracking point with temperature */
export interface ThermalTrackPoint {
  location: GeoCoordinate;
  timestamp: number;
  temperatureCelsius: number;
}

/** Thermal signature profile for matching */
export interface ThermalSignature {
  peakTemperature: number;
  averageTemperature: number;
  temperatureGradient: number[];  // Edge temperatures
  aspectRatio: number;            // width/height
  areaSquareMeters: number;
  thermalPattern: ThermalPattern;
}

/** Thermal pattern types for human identification */
export type ThermalPattern =
  | 'core_hot'              // Hot core (torso), cooler extremities - healthy
  | 'uniform_warm'          // Evenly warm - possible hypothermia starting
  | 'peripheral_cool'       // Cool extremities - hypothermia progressing
  | 'core_cooling'          // Core temp dropping - severe hypothermia
  | 'residual_heat'         // Fading heat signature
  | 'heat_reflection';      // Sun-heated, not body heat

/** Environmental factors affecting thermal detection */
export interface ThermalEnvironment {
  airTempCelsius: number;
  waterSurfaceTempCelsius: number;
  humidity: number;               // 0-100%
  windSpeedKnots: number;
  cloudCover: number;             // 0-100%
  precipitation: 'none' | 'light' | 'moderate' | 'heavy';
  visibility: 'clear' | 'haze' | 'fog' | 'rain';
  timeOfDay: 'day' | 'dawn' | 'dusk' | 'night';
  sunAngle?: number;              // Solar elevation angle
  recordedAt: number;
}

/** Thermal detection thresholds */
export interface ThermalThresholds {
  minHumanTemp: number;           // Minimum expected human temp
  maxHumanTemp: number;           // Maximum expected human temp
  hypothermiaWarning: number;     // Temp indicating hypothermia
  hypothermiaCritical: number;    // Critical hypothermia temp
  minDeltaFromAmbient: number;    // Min difference to detect
  minAreaSquareMeters: number;    // Min size for human
  maxAreaSquareMeters: number;    // Max size for single human
}

/** Thermal engine configuration */
export interface ThermalConfig {
  defaultMode: ThermalMode;
  defaultPlatform: ThermalPlatform;
  scanIntervalMs: number;
  thresholds: ThermalThresholds;
  autoClassify: boolean;
  trackMovement: boolean;
  alertOnHuman: boolean;
  alertOnHypothermia: boolean;
  environment?: ThermalEnvironment;
}

// ============================================================================
// MULTI-SENSOR FUSION TYPES
// ============================================================================

/** Detection source types */
export type DetectionSource = 'sonar' | 'thermal' | 'visual' | 'radar' | 'ais';

/** Fused detection from multiple sensors */
export interface FusedDetection {
  id: string;
  sources: DetectionSource[];
  primarySource: DetectionSource;
  location: GeoCoordinate;
  locationConfidence: number;     // 0-1 based on sensor agreement
  classification: ObjectClassification | ThermalClassification;
  overallConfidence: ConfidenceLevel;

  // Source-specific data
  sonarData?: {
    acousticSignature: AcousticSignature;
    depth?: number;
  };
  thermalData?: {
    temperature: number;
    signature: ThermalSignature;
    hypothermiaRisk?: 'none' | 'mild' | 'moderate' | 'severe';
  };

  movement?: MovementVector;
  firstDetectedAt: number;
  lastDetectedAt: number;
  trackingHistory?: GeoCoordinate[];

  // Correlation
  correlatedPersonId?: string;    // If matched to missing person
  correlationConfidence?: number;
}

/** Sensor fusion configuration */
export interface FusionConfig {
  enabledSensors: DetectionSource[];
  correlationRadiusMeters: number;
  correlationTimeWindowMs: number;
  requireMultipleSensors: boolean;
  minimumConfidenceForAlert: ConfidenceLevel;
  prioritySensor: DetectionSource;
}

/** Multi-sensor search asset */
export interface MultiSensorAsset extends SearchAsset {
  sensors: SensorCapability[];
  thermalCapabilities?: ThermalMode[];
}

/** Individual sensor capability */
export interface SensorCapability {
  type: DetectionSource;
  model?: string;
  rangeMeters: number;
  accuracy: number;              // 0-1
  conditions: string[];          // Optimal conditions
  limitations: string[];         // Known limitations
}
