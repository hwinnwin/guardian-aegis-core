/**
 * Search Mission Service
 * Manages missing person search and rescue operations
 */

import { nanoid } from 'nanoid';
import type {
  SearchMission,
  MissingPerson,
  SearchArea,
  SearchAsset,
  MissionEvent,
  MissionStatus,
  UrgencyLevel,
  GeoCoordinate,
  DetectedObject,
  WaterConditions,
  EventType,
  SearchEnvironment,
} from '../types';
import { SonarEngine } from '../core/sonar-engine';
import { DriftPredictor } from '../core/drift-predictor';

/** Mission service configuration */
export interface MissionServiceConfig {
  autoExpandSearchRadius: boolean;
  defaultSearchRadiusMeters: number;
  maxSearchRadiusMeters: number;
  survivalTimeHours: Record<string, number>; // by water temp range
}

const DEFAULT_CONFIG: MissionServiceConfig = {
  autoExpandSearchRadius: true,
  defaultSearchRadiusMeters: 2000,
  maxSearchRadiusMeters: 50000,
  survivalTimeHours: {
    'cold_0_10': 1,      // 0-10°C: ~1 hour survival
    'cool_10_15': 2,     // 10-15°C: ~2 hours
    'mild_15_20': 6,     // 15-20°C: ~6 hours
    'warm_20_25': 12,    // 20-25°C: ~12 hours
    'tropical_25_plus': 24, // 25°C+: extended survival
  },
};

export class MissionService {
  private missions: Map<string, SearchMission> = new Map();
  private sonarEngine: SonarEngine;
  private driftPredictor: DriftPredictor;
  private config: MissionServiceConfig;
  private eventListeners: Map<string, ((event: MissionEvent) => void)[]> = new Map();

  constructor(
    sonarEngine: SonarEngine,
    driftPredictor: DriftPredictor,
    config: Partial<MissionServiceConfig> = {}
  ) {
    this.sonarEngine = sonarEngine;
    this.driftPredictor = driftPredictor;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new search mission for missing person(s)
   */
  createMission(
    name: string,
    missingPersons: MissingPerson[],
    priority: UrgencyLevel = 'urgent'
  ): SearchMission {
    const missionId = nanoid();

    // Auto-generate initial search areas based on last known locations
    const searchAreas = this.generateInitialSearchAreas(missingPersons, priority);

    const mission: SearchMission = {
      id: missionId,
      name,
      missingPersons,
      searchAreas,
      status: 'planning',
      priority,
      startedAt: Date.now(),
      assets: [],
      detections: [],
      timeline: [
        this.createEvent('mission_started', `Mission "${name}" created with ${missingPersons.length} missing person(s)`),
      ],
    };

    this.missions.set(missionId, mission);

    // Add search area events
    for (const area of searchAreas) {
      mission.timeline.push(
        this.createEvent('area_defined', `Search area "${area.name}" defined`, area.center)
      );
    }

    return mission;
  }

  /**
   * Report a missing person and create emergency mission
   */
  reportMissingPerson(
    name: string,
    lastSeenLocation: GeoCoordinate,
    lastSeenTime: number,
    details: Partial<MissingPerson> = {}
  ): { person: MissingPerson; mission: SearchMission } {
    const person: MissingPerson = {
      id: nanoid(),
      name,
      lastSeenLocation,
      lastSeenTime,
      reportedAt: Date.now(),
      ...details,
    };

    // Calculate urgency based on time elapsed
    const hoursElapsed = (Date.now() - lastSeenTime) / (1000 * 60 * 60);
    let priority: UrgencyLevel = 'urgent';
    if (hoursElapsed < 1) priority = 'critical';
    else if (hoursElapsed > 6) priority = 'elevated';

    const mission = this.createMission(
      `Search for ${name}`,
      [person],
      priority
    );

    return { person, mission };
  }

  /**
   * Activate a mission and begin search operations
   */
  activateMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    mission.status = 'active';
    mission.timeline.push(
      this.createEvent('mission_started', 'Search operations activated')
    );

    // Start sonar scanning in primary search areas
    for (const area of mission.searchAreas.filter(a => a.priority === 'critical' || a.priority === 'urgent')) {
      this.sonarEngine.startScanning(area.center);
    }

    this.missions.set(missionId, mission);
    return true;
  }

  /**
   * Add a detection to the mission
   */
  addDetection(missionId: string, detection: DetectedObject): void {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    mission.detections.push(detection);

    const isHuman =
      detection.classification === 'human_body' ||
      detection.classification === 'human_moving' ||
      detection.classification === 'human_floating';

    mission.timeline.push(
      this.createEvent(
        'detection',
        `${isHuman ? 'POTENTIAL HUMAN' : 'Object'} detected (${detection.confidence} confidence)`,
        detection.location,
        detection.id
      )
    );

    // Notify listeners
    this.notifyListeners(missionId, mission.timeline[mission.timeline.length - 1]);

    this.missions.set(missionId, mission);
  }

  /**
   * Confirm a detection as the missing person
   */
  confirmPersonLocated(
    missionId: string,
    detectionId: string,
    personId?: string
  ): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    const detection = mission.detections.find(d => d.id === detectionId);
    if (!detection) return false;

    detection.confidence = 'confirmed';
    mission.status = 'person_located';

    mission.timeline.push(
      this.createEvent(
        'person_located',
        `PERSON LOCATED - Initiating rescue operations`,
        detection.location,
        detectionId
      )
    );

    this.notifyListeners(missionId, mission.timeline[mission.timeline.length - 1]);
    this.missions.set(missionId, mission);

    return true;
  }

  /**
   * Mark rescue as in progress
   */
  initiateRescue(missionId: string, location: GeoCoordinate): void {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    mission.status = 'rescue_in_progress';
    mission.timeline.push(
      this.createEvent('rescue_initiated', 'Rescue operation in progress', location)
    );

    this.notifyListeners(missionId, mission.timeline[mission.timeline.length - 1]);
    this.missions.set(missionId, mission);
  }

  /**
   * Mark person as recovered
   */
  personRecovered(missionId: string, personId: string): void {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    const person = mission.missingPersons.find(p => p.id === personId);

    mission.timeline.push(
      this.createEvent(
        'person_recovered',
        `${person?.name ?? 'Person'} successfully recovered`
      )
    );

    // Check if all persons recovered
    const allRecovered = mission.missingPersons.every(p =>
      mission.timeline.some(e => e.type === 'person_recovered' && e.description.includes(p.name))
    );

    if (allRecovered) {
      mission.status = 'completed';
      mission.timeline.push(
        this.createEvent('mission_completed', 'All missing persons recovered - Mission complete')
      );
    }

    this.notifyListeners(missionId, mission.timeline[mission.timeline.length - 1]);
    this.missions.set(missionId, mission);
  }

  /**
   * Deploy a search asset to the mission
   */
  deployAsset(missionId: string, asset: SearchAsset, areaId?: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    asset.status = 'deployed';
    mission.assets.push(asset);

    if (areaId) {
      const area = mission.searchAreas.find(a => a.id === areaId);
      if (area) {
        area.assignedAssets = area.assignedAssets ?? [];
        area.assignedAssets.push(asset.id);
      }
    }

    mission.timeline.push(
      this.createEvent('asset_deployed', `${asset.type} "${asset.name}" deployed`)
    );

    this.missions.set(missionId, mission);
    return true;
  }

  /**
   * Update water conditions for a search area
   */
  updateConditions(
    missionId: string,
    areaId: string,
    conditions: WaterConditions
  ): void {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    const area = mission.searchAreas.find(a => a.id === areaId);
    if (!area) return;

    area.currentConditions = conditions;
    area.updatedAt = Date.now();

    mission.timeline.push(
      this.createEvent(
        'conditions_updated',
        `Conditions updated: ${conditions.visibility}m vis, ${conditions.currentSpeed ?? 0}kt current`,
        area.center
      )
    );

    // Recalculate drift predictions with new conditions
    if (this.config.autoExpandSearchRadius) {
      this.recalculateSearchAreas(mission, conditions);
    }

    this.missions.set(missionId, mission);
  }

  /**
   * Expand search area based on drift prediction
   */
  expandSearchArea(missionId: string, areaId: string, newRadiusMeters: number): void {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    const area = mission.searchAreas.find(a => a.id === areaId);
    if (!area) return;

    const oldRadius = area.radiusMeters;
    area.radiusMeters = Math.min(newRadiusMeters, this.config.maxSearchRadiusMeters);
    area.updatedAt = Date.now();

    mission.timeline.push(
      this.createEvent(
        'area_expanded',
        `Search area expanded from ${oldRadius}m to ${area.radiusMeters}m`,
        area.center
      )
    );

    this.missions.set(missionId, mission);
  }

  /**
   * Get mission by ID
   */
  getMission(missionId: string): SearchMission | undefined {
    return this.missions.get(missionId);
  }

  /**
   * Get all active missions
   */
  getActiveMissions(): SearchMission[] {
    return Array.from(this.missions.values()).filter(
      m => m.status === 'active' || m.status === 'rescue_in_progress'
    );
  }

  /**
   * Get all missions
   */
  getAllMissions(): SearchMission[] {
    return Array.from(this.missions.values());
  }

  /**
   * Subscribe to mission events
   */
  onMissionEvent(missionId: string, callback: (event: MissionEvent) => void): () => void {
    const listeners = this.eventListeners.get(missionId) ?? [];
    listeners.push(callback);
    this.eventListeners.set(missionId, listeners);

    // Return unsubscribe function
    return () => {
      const current = this.eventListeners.get(missionId) ?? [];
      this.eventListeners.set(missionId, current.filter(cb => cb !== callback));
    };
  }

  /**
   * Calculate survival probability based on conditions and time
   */
  calculateSurvivalProbability(
    mission: SearchMission,
    conditions?: WaterConditions
  ): number {
    if (mission.missingPersons.length === 0) return 0;

    const person = mission.missingPersons[0];
    const hoursElapsed = (Date.now() - person.lastSeenTime) / (1000 * 60 * 60);

    // Get survival time estimate based on water temperature
    const waterTemp = conditions?.waterTempCelsius ?? 20;
    let maxSurvivalHours: number;

    if (waterTemp < 10) maxSurvivalHours = this.config.survivalTimeHours['cold_0_10'];
    else if (waterTemp < 15) maxSurvivalHours = this.config.survivalTimeHours['cool_10_15'];
    else if (waterTemp < 20) maxSurvivalHours = this.config.survivalTimeHours['mild_15_20'];
    else if (waterTemp < 25) maxSurvivalHours = this.config.survivalTimeHours['warm_20_25'];
    else maxSurvivalHours = this.config.survivalTimeHours['tropical_25_plus'];

    // Adjust for swimming ability
    if (person.swimmingAbility === 'professional') maxSurvivalHours *= 1.5;
    else if (person.swimmingAbility === 'strong') maxSurvivalHours *= 1.3;
    else if (person.swimmingAbility === 'none') maxSurvivalHours *= 0.5;

    // Adjust for flotation device
    const hasFlotation = person.physical?.clothing?.some(c => c.type === 'life_jacket' || c.type === 'flotation_device');
    if (hasFlotation) maxSurvivalHours *= 3;

    // Calculate probability
    return Math.max(0, 1 - (hoursElapsed / maxSurvivalHours));
  }

  // Private helper methods

  private generateInitialSearchAreas(
    persons: MissingPerson[],
    priority: UrgencyLevel
  ): SearchArea[] {
    const areas: SearchArea[] = [];

    for (const person of persons) {
      // Primary search area at last known location
      const primaryArea: SearchArea = {
        id: nanoid(),
        name: `Primary - ${person.name}`,
        center: person.lastSeenLocation,
        radiusMeters: this.config.defaultSearchRadiusMeters,
        environment: this.inferEnvironment(person.lastSeenLocation),
        priority,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      areas.push(primaryArea);

      // If drift prediction is enabled, add predicted drift areas
      const hoursElapsed = (Date.now() - person.lastSeenTime) / (1000 * 60 * 60);
      if (hoursElapsed > 0.5) {
        const driftPrediction = this.driftPredictor.calculateDrift({
          startLocation: person.lastSeenLocation,
          startTime: person.lastSeenTime,
          conditions: {
            visibility: 10,
            currentSpeed: 1,
            currentDirection: 180,
            recordedAt: Date.now(),
          },
          objectType: 'person_floating',
          predictionHours: Math.min(hoursElapsed, 24),
        });

        // Add high probability zones as search areas
        for (const zone of driftPrediction.probabilityZones.slice(0, 2)) {
          const center = this.calculatePolygonCenter(zone.polygon);
          areas.push({
            id: nanoid(),
            name: `Drift Zone ${areas.length} - ${person.name}`,
            center,
            radiusMeters: this.config.defaultSearchRadiusMeters * 1.5,
            environment: this.inferEnvironment(center),
            polygon: zone.polygon,
            priority: priority === 'critical' ? 'urgent' : 'elevated',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    return areas;
  }

  private inferEnvironment(location: GeoCoordinate): SearchEnvironment {
    // In a real system, this would use GIS data
    // For now, infer based on depth if available
    if (location.depth !== undefined) {
      if (location.depth > 30) return 'ocean_underwater';
      if (location.depth > 0) return 'coastal_waters';
    }
    return 'ocean_surface';
  }

  private calculatePolygonCenter(polygon: GeoCoordinate[]): GeoCoordinate {
    const sumLat = polygon.reduce((sum, p) => sum + p.latitude, 0);
    const sumLng = polygon.reduce((sum, p) => sum + p.longitude, 0);
    return {
      latitude: sumLat / polygon.length,
      longitude: sumLng / polygon.length,
    };
  }

  private recalculateSearchAreas(mission: SearchMission, conditions: WaterConditions): void {
    for (const person of mission.missingPersons) {
      const hoursElapsed = (Date.now() - person.lastSeenTime) / (1000 * 60 * 60);

      const prediction = this.driftPredictor.calculateDrift({
        startLocation: person.lastSeenLocation,
        startTime: person.lastSeenTime,
        conditions,
        objectType: 'person_floating',
        predictionHours: hoursElapsed,
      });

      // Update or add drift zones
      for (const zone of prediction.probabilityZones) {
        const center = this.calculatePolygonCenter(zone.polygon);
        const existingArea = mission.searchAreas.find(
          a => this.isNearby(a.center, center, 500)
        );

        if (existingArea) {
          existingArea.polygon = zone.polygon;
          existingArea.updatedAt = Date.now();
        }
      }
    }
  }

  private isNearby(a: GeoCoordinate, b: GeoCoordinate, thresholdMeters: number): boolean {
    const latDiff = Math.abs(a.latitude - b.latitude) * 111320;
    const lngDiff = Math.abs(a.longitude - b.longitude) * 111320 * Math.cos(a.latitude * Math.PI / 180);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) < thresholdMeters;
  }

  private createEvent(
    type: EventType,
    description: string,
    location?: GeoCoordinate,
    relatedObjectId?: string
  ): MissionEvent {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      type,
      description,
      location,
      relatedObjectId,
    };
  }

  private notifyListeners(missionId: string, event: MissionEvent): void {
    const listeners = this.eventListeners.get(missionId) ?? [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

/** Create a new mission service */
export function createMissionService(
  sonarEngine: SonarEngine,
  driftPredictor: DriftPredictor,
  config?: Partial<MissionServiceConfig>
): MissionService {
  return new MissionService(sonarEngine, driftPredictor, config);
}
