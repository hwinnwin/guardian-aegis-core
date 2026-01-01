/**
 * Residence Mapping Service
 * Maps known locations and residences to aid in missing person search
 */

import { nanoid } from 'nanoid';
import type {
  ResidenceMapping,
  GeoCoordinate,
  KnownLocation,
  MissingPerson,
  SearchArea,
  UrgencyLevel,
} from '../types';

/** Distance calculation constants */
const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_LAT_DEGREE = 111320;

/** Residence mapping service configuration */
export interface ResidenceMappingConfig {
  maxKnownLocations: number;
  relevanceRadiusMeters: number;
  coastalProximityMeters: number;
  beachProximityMeters: number;
}

const DEFAULT_CONFIG: ResidenceMappingConfig = {
  maxKnownLocations: 50,
  relevanceRadiusMeters: 50000, // 50km
  coastalProximityMeters: 5000, // 5km from coast
  beachProximityMeters: 1000, // 1km from beach
};

/** Known coastal/beach locations database (would be populated from GIS in production) */
interface CoastalHotspot {
  name: string;
  location: GeoCoordinate;
  type: 'beach' | 'marina' | 'pier' | 'surf_spot' | 'swimming_area';
  riskLevel: 'low' | 'medium' | 'high';
}

export class ResidenceMappingService {
  private mappings: Map<string, ResidenceMapping> = new Map();
  private config: ResidenceMappingConfig;
  private coastalHotspots: CoastalHotspot[] = [];

  constructor(config: Partial<ResidenceMappingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeCoastalHotspots();
  }

  /**
   * Register a person's residence and known locations
   */
  registerPerson(
    personId: string,
    homeLocation: GeoCoordinate,
    knownLocations: KnownLocation[] = []
  ): ResidenceMapping {
    const mapping: ResidenceMapping = {
      personId,
      homeLocation,
      knownLocations: knownLocations.slice(0, this.config.maxKnownLocations),
      lastUpdated: Date.now(),
    };

    this.mappings.set(personId, mapping);
    return mapping;
  }

  /**
   * Add a known location for a person
   */
  addKnownLocation(personId: string, location: KnownLocation): boolean {
    const mapping = this.mappings.get(personId);
    if (!mapping) return false;

    // Check if location already exists (within 100m)
    const exists = mapping.knownLocations.some(
      l => this.calculateDistance(l.location, location.location) < 100
    );

    if (!exists && mapping.knownLocations.length < this.config.maxKnownLocations) {
      mapping.knownLocations.push(location);
      mapping.lastUpdated = Date.now();
      this.mappings.set(personId, mapping);
      return true;
    }

    return false;
  }

  /**
   * Add frequent route for a person
   */
  addFrequentRoute(personId: string, route: GeoCoordinate[]): boolean {
    const mapping = this.mappings.get(personId);
    if (!mapping) return false;

    mapping.frequentRoutes = mapping.frequentRoutes ?? [];
    mapping.frequentRoutes.push(route);
    mapping.lastUpdated = Date.now();

    this.mappings.set(personId, mapping);
    return true;
  }

  /**
   * Get mapping for a person
   */
  getMapping(personId: string): ResidenceMapping | undefined {
    return this.mappings.get(personId);
  }

  /**
   * Find nearby coastal hotspots for a location
   */
  findNearbyHotspots(
    location: GeoCoordinate,
    radiusMeters: number = this.config.beachProximityMeters
  ): CoastalHotspot[] {
    return this.coastalHotspots.filter(
      hotspot => this.calculateDistance(location, hotspot.location) <= radiusMeters
    );
  }

  /**
   * Analyze a missing person's likely locations based on residence mapping
   */
  analyzeLikelyLocations(person: MissingPerson): {
    nearbyBeaches: CoastalHotspot[];
    frequentLocations: KnownLocation[];
    suggestedSearchAreas: SearchArea[];
  } {
    const mapping = this.mappings.get(person.id);
    const result = {
      nearbyBeaches: [] as CoastalHotspot[],
      frequentLocations: [] as KnownLocation[],
      suggestedSearchAreas: [] as SearchArea[],
    };

    // Find coastal hotspots near home
    if (mapping) {
      result.nearbyBeaches = this.findNearbyHotspots(
        mapping.homeLocation,
        this.config.coastalProximityMeters
      );

      result.frequentLocations = mapping.knownLocations.filter(
        l => l.type === 'beach' || l.type === 'marina'
      );
    }

    // Find hotspots near last seen location
    const lastSeenHotspots = this.findNearbyHotspots(
      person.lastSeenLocation,
      this.config.beachProximityMeters
    );

    // Combine and deduplicate
    result.nearbyBeaches = [
      ...result.nearbyBeaches,
      ...lastSeenHotspots.filter(
        h => !result.nearbyBeaches.some(b => b.name === h.name)
      ),
    ];

    // Generate search area suggestions
    result.suggestedSearchAreas = this.generateSearchSuggestions(
      person,
      mapping,
      result.nearbyBeaches
    );

    return result;
  }

  /**
   * Calculate search priority based on known patterns
   */
  calculateLocationPriority(
    location: GeoCoordinate,
    person: MissingPerson
  ): number {
    const mapping = this.mappings.get(person.id);
    let priority = 5; // Base priority

    // Higher priority if near last seen location
    const distanceFromLastSeen = this.calculateDistance(location, person.lastSeenLocation);
    if (distanceFromLastSeen < 500) priority += 3;
    else if (distanceFromLastSeen < 2000) priority += 2;
    else if (distanceFromLastSeen < 5000) priority += 1;

    // Higher priority if near known frequent locations
    if (mapping) {
      for (const known of mapping.knownLocations) {
        const distance = this.calculateDistance(location, known.location);
        if (distance < 500) {
          priority += known.visitFrequency === 'daily' ? 2 : 1;
        }
      }
    }

    // Higher priority for high-risk coastal hotspots
    const nearbyHotspots = this.findNearbyHotspots(location, 500);
    for (const hotspot of nearbyHotspots) {
      if (hotspot.riskLevel === 'high') priority += 2;
      else if (hotspot.riskLevel === 'medium') priority += 1;
    }

    return Math.min(priority, 10); // Cap at 10
  }

  /**
   * Find persons who frequently visit a location
   */
  findPersonsNearLocation(
    location: GeoCoordinate,
    radiusMeters: number = 1000
  ): string[] {
    const personIds: string[] = [];

    for (const [personId, mapping] of this.mappings) {
      // Check home location
      if (this.calculateDistance(mapping.homeLocation, location) <= radiusMeters) {
        personIds.push(personId);
        continue;
      }

      // Check known locations
      const hasNearbyLocation = mapping.knownLocations.some(
        l => this.calculateDistance(l.location, location) <= radiusMeters
      );

      if (hasNearbyLocation) {
        personIds.push(personId);
      }
    }

    return personIds;
  }

  /**
   * Get statistics about coastal exposure for a person
   */
  getCoastalExposure(personId: string): {
    nearestBeachMeters: number;
    regularBeachVisitor: boolean;
    frequentWaterLocations: number;
  } {
    const mapping = this.mappings.get(personId);

    if (!mapping) {
      return {
        nearestBeachMeters: Infinity,
        regularBeachVisitor: false,
        frequentWaterLocations: 0,
      };
    }

    // Find nearest beach to home
    let nearestBeach = Infinity;
    for (const hotspot of this.coastalHotspots) {
      const distance = this.calculateDistance(mapping.homeLocation, hotspot.location);
      if (distance < nearestBeach) {
        nearestBeach = distance;
      }
    }

    // Count water-related known locations
    const waterLocations = mapping.knownLocations.filter(
      l => l.type === 'beach' || l.type === 'marina'
    );

    const regularVisitor = waterLocations.some(
      l => l.visitFrequency === 'daily' || l.visitFrequency === 'weekly'
    );

    return {
      nearestBeachMeters: nearestBeach,
      regularBeachVisitor: regularVisitor,
      frequentWaterLocations: waterLocations.length,
    };
  }

  /**
   * Update coastal hotspots database
   */
  addCoastalHotspot(hotspot: CoastalHotspot): void {
    // Check for duplicates
    const exists = this.coastalHotspots.some(
      h => h.name === hotspot.name || this.calculateDistance(h.location, hotspot.location) < 100
    );

    if (!exists) {
      this.coastalHotspots.push(hotspot);
    }
  }

  /**
   * Bulk import coastal hotspots
   */
  importCoastalHotspots(hotspots: CoastalHotspot[]): number {
    let imported = 0;
    for (const hotspot of hotspots) {
      const sizeBefore = this.coastalHotspots.length;
      this.addCoastalHotspot(hotspot);
      if (this.coastalHotspots.length > sizeBefore) {
        imported++;
      }
    }
    return imported;
  }

  // Private helper methods

  private initializeCoastalHotspots(): void {
    // Gold Coast, Australia hotspots (example data)
    this.coastalHotspots = [
      {
        name: 'Surfers Paradise Beach',
        location: { latitude: -28.0027, longitude: 153.4310 },
        type: 'beach',
        riskLevel: 'medium',
      },
      {
        name: 'Main Beach',
        location: { latitude: -27.9758, longitude: 153.4283 },
        type: 'beach',
        riskLevel: 'medium',
      },
      {
        name: 'Broadbeach',
        location: { latitude: -28.0280, longitude: 153.4320 },
        type: 'beach',
        riskLevel: 'medium',
      },
      {
        name: 'Burleigh Heads',
        location: { latitude: -28.0875, longitude: 153.4542 },
        type: 'surf_spot',
        riskLevel: 'high',
      },
      {
        name: 'Coolangatta Beach',
        location: { latitude: -28.1658, longitude: 153.5367 },
        type: 'beach',
        riskLevel: 'medium',
      },
      {
        name: 'The Spit',
        location: { latitude: -27.9425, longitude: 153.4250 },
        type: 'swimming_area',
        riskLevel: 'high',
      },
      {
        name: 'Currumbin Beach',
        location: { latitude: -28.1333, longitude: 153.4833 },
        type: 'beach',
        riskLevel: 'low',
      },
      {
        name: 'Palm Beach',
        location: { latitude: -28.1167, longitude: 153.4667 },
        type: 'beach',
        riskLevel: 'medium',
      },
      {
        name: 'Mermaid Beach',
        location: { latitude: -28.0450, longitude: 153.4350 },
        type: 'beach',
        riskLevel: 'medium',
      },
      {
        name: 'Marina Mirage',
        location: { latitude: -27.9647, longitude: 153.4258 },
        type: 'marina',
        riskLevel: 'low',
      },
    ];
  }

  private generateSearchSuggestions(
    person: MissingPerson,
    mapping: ResidenceMapping | undefined,
    nearbyBeaches: CoastalHotspot[]
  ): SearchArea[] {
    const suggestions: SearchArea[] = [];

    // Primary: Last seen location
    suggestions.push({
      id: nanoid(),
      name: 'Last Seen Location',
      center: person.lastSeenLocation,
      radiusMeters: 1000,
      environment: 'ocean_surface',
      priority: 'critical' as UrgencyLevel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // High-risk beaches nearby
    for (const beach of nearbyBeaches.filter(b => b.riskLevel === 'high').slice(0, 2)) {
      suggestions.push({
        id: nanoid(),
        name: `High Risk: ${beach.name}`,
        center: beach.location,
        radiusMeters: 800,
        environment: 'coastal_waters',
        priority: 'urgent' as UrgencyLevel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Frequent beach locations
    if (mapping) {
      for (const location of mapping.knownLocations.filter(l => l.type === 'beach').slice(0, 2)) {
        suggestions.push({
          id: nanoid(),
          name: `Frequent: ${location.name}`,
          center: location.location,
          radiusMeters: 600,
          environment: 'beach',
          priority: 'elevated' as UrgencyLevel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return suggestions;
  }

  private calculateDistance(a: GeoCoordinate, b: GeoCoordinate): number {
    // Haversine formula
    const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
    const dLon = (b.longitude - a.longitude) * (Math.PI / 180);
    const lat1 = a.latitude * (Math.PI / 180);
    const lat2 = b.latitude * (Math.PI / 180);

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return EARTH_RADIUS_METERS * c;
  }
}

/** Create a new residence mapping service */
export function createResidenceMappingService(
  config?: Partial<ResidenceMappingConfig>
): ResidenceMappingService {
  return new ResidenceMappingService(config);
}
