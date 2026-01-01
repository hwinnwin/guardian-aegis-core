/**
 * Gold Coast Specific Utilities
 * Ocean conditions, currents, and search parameters for Gold Coast, Australia
 */

import type {
  WaterConditions,
  GeoCoordinate,
  SearchArea,
  CoastalHotspot,
} from '../types';

/** Gold Coast region bounds */
export const GOLD_COAST_BOUNDS = {
  north: { latitude: -27.85, longitude: 153.35 },
  south: { latitude: -28.20, longitude: 153.55 },
  center: { latitude: -28.0167, longitude: 153.4000 },
};

/** Typical ocean currents for Gold Coast (East Australian Current influence) */
export const GOLD_COAST_CURRENTS = {
  summer: {
    direction: 200, // degrees (flowing south-southwest)
    speedKnots: 1.5,
  },
  winter: {
    direction: 180, // degrees (flowing south)
    speedKnots: 1.0,
  },
  typical: {
    direction: 190,
    speedKnots: 1.2,
  },
};

/** Water temperature ranges by season */
export const GOLD_COAST_WATER_TEMP = {
  summer: { min: 24, max: 27 }, // December - February
  autumn: { min: 22, max: 25 }, // March - May
  winter: { min: 19, max: 22 }, // June - August
  spring: { min: 21, max: 24 }, // September - November
};

/** Known rip current hotspots */
export const RIP_CURRENT_ZONES: GeoCoordinate[] = [
  { latitude: -28.0027, longitude: 153.4330 }, // Surfers Paradise north
  { latitude: -28.0875, longitude: 153.4560 }, // Burleigh Heads
  { latitude: -28.1658, longitude: 153.5380 }, // Coolangatta
  { latitude: -27.9425, longitude: 153.4270 }, // The Spit
];

/** Comprehensive Gold Coast beach data */
export const GOLD_COAST_BEACHES: CoastalHotspot[] = [
  // Northern beaches
  {
    name: 'South Stradbroke Island',
    location: { latitude: -27.8833, longitude: 153.4333 },
    type: 'beach',
    riskLevel: 'high',
  },
  {
    name: 'The Spit',
    location: { latitude: -27.9425, longitude: 153.4250 },
    type: 'swimming_area',
    riskLevel: 'high',
  },
  {
    name: 'Main Beach',
    location: { latitude: -27.9758, longitude: 153.4283 },
    type: 'beach',
    riskLevel: 'medium',
  },
  // Central beaches
  {
    name: 'Surfers Paradise',
    location: { latitude: -28.0027, longitude: 153.4310 },
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
    name: 'Mermaid Beach',
    location: { latitude: -28.0450, longitude: 153.4350 },
    type: 'beach',
    riskLevel: 'medium',
  },
  {
    name: 'Nobby Beach',
    location: { latitude: -28.0583, longitude: 153.4417 },
    type: 'beach',
    riskLevel: 'medium',
  },
  {
    name: 'Miami Beach',
    location: { latitude: -28.0708, longitude: 153.4458 },
    type: 'beach',
    riskLevel: 'medium',
  },
  // Southern beaches
  {
    name: 'Burleigh Heads',
    location: { latitude: -28.0875, longitude: 153.4542 },
    type: 'surf_spot',
    riskLevel: 'high',
  },
  {
    name: 'Tallebudgera Creek',
    location: { latitude: -28.1000, longitude: 153.4583 },
    type: 'swimming_area',
    riskLevel: 'low',
  },
  {
    name: 'Palm Beach',
    location: { latitude: -28.1167, longitude: 153.4667 },
    type: 'beach',
    riskLevel: 'medium',
  },
  {
    name: 'Currumbin Beach',
    location: { latitude: -28.1333, longitude: 153.4833 },
    type: 'beach',
    riskLevel: 'low',
  },
  {
    name: 'Tugun Beach',
    location: { latitude: -28.1500, longitude: 153.5000 },
    type: 'beach',
    riskLevel: 'medium',
  },
  {
    name: 'Bilinga Beach',
    location: { latitude: -28.1583, longitude: 153.5083 },
    type: 'beach',
    riskLevel: 'medium',
  },
  {
    name: 'Kirra Beach',
    location: { latitude: -28.1667, longitude: 153.5167 },
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
    name: 'Snapper Rocks',
    location: { latitude: -28.1708, longitude: 153.5458 },
    type: 'surf_spot',
    riskLevel: 'high',
  },
  {
    name: 'Rainbow Bay',
    location: { latitude: -28.1725, longitude: 153.5475 },
    type: 'swimming_area',
    riskLevel: 'low',
  },
];

/** Marina and boat launch locations */
export const GOLD_COAST_MARINAS: CoastalHotspot[] = [
  {
    name: 'Marina Mirage',
    location: { latitude: -27.9647, longitude: 153.4258 },
    type: 'marina',
    riskLevel: 'low',
  },
  {
    name: 'Southport Yacht Club',
    location: { latitude: -27.9675, longitude: 153.4125 },
    type: 'marina',
    riskLevel: 'low',
  },
  {
    name: 'Runaway Bay Marina',
    location: { latitude: -27.9167, longitude: 153.3917 },
    type: 'marina',
    riskLevel: 'low',
  },
  {
    name: 'Sanctuary Cove Marina',
    location: { latitude: -27.8583, longitude: 153.3667 },
    type: 'marina',
    riskLevel: 'low',
  },
  {
    name: 'Gold Coast City Marina',
    location: { latitude: -27.9350, longitude: 153.4000 },
    type: 'marina',
    riskLevel: 'low',
  },
];

/**
 * Get current season for Gold Coast
 */
export function getCurrentSeason(): 'summer' | 'autumn' | 'winter' | 'spring' {
  const month = new Date().getMonth();
  if (month >= 11 || month <= 1) return 'summer';
  if (month >= 2 && month <= 4) return 'autumn';
  if (month >= 5 && month <= 7) return 'winter';
  return 'spring';
}

/**
 * Get typical water conditions for Gold Coast based on current season
 */
export function getTypicalConditions(): WaterConditions {
  const season = getCurrentSeason();
  const temp = GOLD_COAST_WATER_TEMP[season];
  const current = GOLD_COAST_CURRENTS[season === 'summer' ? 'summer' : season === 'winter' ? 'winter' : 'typical'];

  return {
    waterTempCelsius: (temp.min + temp.max) / 2,
    visibility: 8, // Average visibility in meters
    currentSpeed: current.speedKnots,
    currentDirection: current.direction,
    waveHeight: season === 'winter' ? 1.5 : 1.0,
    recordedAt: Date.now(),
  };
}

/**
 * Check if a location is within Gold Coast region
 */
export function isInGoldCoastRegion(location: GeoCoordinate): boolean {
  return (
    location.latitude >= GOLD_COAST_BOUNDS.south.latitude &&
    location.latitude <= GOLD_COAST_BOUNDS.north.latitude &&
    location.longitude >= GOLD_COAST_BOUNDS.north.longitude &&
    location.longitude <= GOLD_COAST_BOUNDS.south.longitude
  );
}

/**
 * Find nearest beach to a location
 */
export function findNearestBeach(location: GeoCoordinate): CoastalHotspot | undefined {
  let nearest: CoastalHotspot | undefined;
  let minDistance = Infinity;

  for (const beach of GOLD_COAST_BEACHES) {
    const distance = calculateDistance(location, beach.location);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = beach;
    }
  }

  return nearest;
}

/**
 * Get all high-risk zones near a location
 */
export function getHighRiskZones(
  location: GeoCoordinate,
  radiusMeters: number = 5000
): CoastalHotspot[] {
  const allLocations = [...GOLD_COAST_BEACHES, ...GOLD_COAST_MARINAS];

  return allLocations.filter(spot => {
    if (spot.riskLevel !== 'high') return false;
    return calculateDistance(location, spot.location) <= radiusMeters;
  });
}

/**
 * Check if location is near a rip current zone
 */
export function isNearRipCurrentZone(
  location: GeoCoordinate,
  thresholdMeters: number = 500
): boolean {
  return RIP_CURRENT_ZONES.some(
    rip => calculateDistance(location, rip) <= thresholdMeters
  );
}

/**
 * Generate optimized search grid for Gold Coast area
 */
export function generateGoldCoastSearchGrid(
  center: GeoCoordinate,
  radiusMeters: number,
  gridSpacingMeters: number = 200
): SearchArea[] {
  const areas: SearchArea[] = [];
  const latStep = gridSpacingMeters / 111320;
  const lngStep = gridSpacingMeters / (111320 * Math.cos(center.latitude * Math.PI / 180));

  const gridRadius = Math.ceil(radiusMeters / gridSpacingMeters);

  for (let latOffset = -gridRadius; latOffset <= gridRadius; latOffset++) {
    for (let lngOffset = -gridRadius; lngOffset <= gridRadius; lngOffset++) {
      const gridCenter: GeoCoordinate = {
        latitude: center.latitude + latOffset * latStep,
        longitude: center.longitude + lngOffset * lngStep,
      };

      // Check if within circular radius
      const distance = calculateDistance(center, gridCenter);
      if (distance > radiusMeters) continue;

      // Determine priority based on location characteristics
      let priority: 'routine' | 'elevated' | 'urgent' | 'critical' = 'routine';

      if (distance < radiusMeters * 0.25) {
        priority = 'critical';
      } else if (distance < radiusMeters * 0.5) {
        priority = 'urgent';
      } else if (isNearRipCurrentZone(gridCenter)) {
        priority = 'elevated';
      }

      areas.push({
        id: `grid-${latOffset}-${lngOffset}`,
        name: `Grid ${latOffset},${lngOffset}`,
        center: gridCenter,
        radiusMeters: gridSpacingMeters / 2,
        environment: 'ocean_surface',
        priority,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  return areas;
}

/**
 * Calculate survival time estimate for Gold Coast waters
 */
export function estimateSurvivalTime(
  hasFlotationDevice: boolean,
  swimmingAbility: 'none' | 'basic' | 'competent' | 'strong' | 'professional' = 'competent'
): { hours: number; description: string } {
  const season = getCurrentSeason();
  const waterTemp = GOLD_COAST_WATER_TEMP[season];
  const avgTemp = (waterTemp.min + waterTemp.max) / 2;

  // Base survival time based on water temperature (Gold Coast is relatively warm)
  let baseHours: number;
  if (avgTemp >= 24) baseHours = 12;
  else if (avgTemp >= 21) baseHours = 8;
  else baseHours = 5;

  // Adjust for flotation device
  if (hasFlotationDevice) baseHours *= 3;

  // Adjust for swimming ability
  const abilityMultiplier: Record<string, number> = {
    none: 0.3,
    basic: 0.6,
    competent: 1.0,
    strong: 1.3,
    professional: 1.5,
  };
  baseHours *= abilityMultiplier[swimmingAbility];

  let description: string;
  if (baseHours >= 24) {
    description = 'Extended survival possible - warm waters and good conditions';
  } else if (baseHours >= 12) {
    description = 'Good survival window - maintain search intensity';
  } else if (baseHours >= 6) {
    description = 'Moderate survival window - time-critical search';
  } else {
    description = 'Critical time window - maximum search urgency required';
  }

  return { hours: Math.round(baseHours * 10) / 10, description };
}

// Helper function
function calculateDistance(a: GeoCoordinate, b: GeoCoordinate): number {
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

// Re-export the CoastalHotspot type for external use
export type { CoastalHotspot };
