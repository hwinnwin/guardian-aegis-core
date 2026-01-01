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
