/**
 * VybeXonR Communication Service
 * Two-way resonance-based communication system for finding and communicating
 * with people who are stuck, trapped, or in distress
 */

import { nanoid } from 'nanoid';
import type {
  VybeBeacon,
  VybeBeaconStatus,
  VybeBeaconSettings,
  VybeTransmission,
  VybeReception,
  VybeSignalType,
  VybeTransmissionMode,
  VybePattern,
  VybeCommunicationSession,
  VybeBaseStation,
  VybeTriangulation,
  VybeSystemConfig,
  VybeNetworkStatus,
  SOSPattern,
  GeoCoordinate,
  ConfidenceLevel,
} from '../types';

/** Predefined SOS patterns for emergency communication */
const PREDEFINED_SOS_PATTERNS: SOSPattern[] = [
  {
    name: 'Universal SOS',
    code: 'SOS',
    pattern: {
      type: 'morse',
      sequence: [1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1], // ... --- ...
      repeatCount: 3,
      intervalMs: 200,
    },
    priority: 'critical',
    meaning: 'Emergency distress - immediate help needed',
    autoResponse: 'acknowledge',
  },
  {
    name: 'Trapped/Stuck',
    code: 'TRAP',
    pattern: {
      type: 'pulse_sequence',
      sequence: [1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1], // 4 short, 2 long, 4 short
      repeatCount: 2,
      intervalMs: 300,
    },
    priority: 'critical',
    meaning: 'Person is trapped and cannot move',
    autoResponse: 'acknowledge',
  },
  {
    name: 'Injured',
    code: 'INJ',
    pattern: {
      type: 'pulse_sequence',
      sequence: [1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1], // 2 short, 3 long, 2 short
      repeatCount: 2,
      intervalMs: 300,
    },
    priority: 'high',
    meaning: 'Person is injured but conscious',
    autoResponse: 'acknowledge',
  },
  {
    name: 'Location Ping',
    code: 'PING',
    pattern: {
      type: 'pulse_sequence',
      sequence: [1, 0, 0, 0, 0], // Single pulse
      repeatCount: 5,
      intervalMs: 1000,
    },
    priority: 'medium',
    meaning: 'Regular location beacon',
  },
  {
    name: 'OK Status',
    code: 'OK',
    pattern: {
      type: 'pulse_sequence',
      sequence: [1, 1, 0, 1, 1], // 2 short, gap, 2 short
      repeatCount: 2,
      intervalMs: 400,
    },
    priority: 'low',
    meaning: 'Person is okay',
  },
  {
    name: 'Drowning',
    code: 'DROWN',
    pattern: {
      type: 'frequency_shift',
      sequence: [100, 200, 100, 200, 100, 200, 500, 500, 500], // Rapid alternating then sustained
      repeatCount: 1,
      intervalMs: 100,
    },
    priority: 'critical',
    meaning: 'Active drowning emergency',
    autoResponse: 'acknowledge',
  },
  {
    name: 'Acknowledge',
    code: 'ACK',
    pattern: {
      type: 'pulse_sequence',
      sequence: [1, 0, 1], // Two quick pulses
      repeatCount: 1,
      intervalMs: 200,
    },
    priority: 'low',
    meaning: 'Signal received and acknowledged',
  },
];

/** Default beacon settings */
const DEFAULT_BEACON_SETTINGS: VybeBeaconSettings = {
  autoSOSOnSubmersion: true,
  autoSOSAfterNoMovementMinutes: 30,
  transmissionPowerLevel: 'medium',
  heartbeatIntervalSeconds: 60,
  emergencyFrequencyHz: 40, // Low frequency travels far underwater
  normalFrequencyHz: 1000,
  enableVibrationFeedback: true,
  enableAudioFeedback: true,
};

/** Default system configuration */
const DEFAULT_SYSTEM_CONFIG: VybeSystemConfig = {
  defaultTransmissionMode: 'resonance_burst',
  sosFrequencyHz: 40,
  normalFrequencyHz: 1000,
  triangulationEnabled: true,
  minStationsForTriangulation: 3,
  signalTimeoutSeconds: 30,
  autoAcknowledgeSignals: true,
  relaySignalsBetweenStations: true,
  predefinedPatterns: PREDEFINED_SOS_PATTERNS,
};

/** VybeXonR event types */
export interface VybeEvent {
  type: 'signal_received' | 'signal_sent' | 'sos_triggered' | 'beacon_located' |
        'session_started' | 'session_ended' | 'triangulation_complete';
  timestamp: number;
  data: unknown;
}

export class VybeXonRService {
  private config: VybeSystemConfig;
  private beacons: Map<string, VybeBeacon> = new Map();
  private baseStations: Map<string, VybeBaseStation> = new Map();
  private sessions: Map<string, VybeCommunicationSession> = new Map();
  private triangulations: Map<string, VybeTriangulation> = new Map();
  private recentReceptions: VybeReception[] = [];
  private eventListeners: ((event: VybeEvent) => void)[] = [];

  constructor(config: Partial<VybeSystemConfig> = {}) {
    this.config = { ...DEFAULT_SYSTEM_CONFIG, ...config };
  }

  // ==================== BEACON MANAGEMENT ====================

  /**
   * Register a new VybeXonR beacon
   */
  registerBeacon(
    ownerId: string,
    ownerName: string,
    deviceType: VybeBeacon['deviceType'],
    settings: Partial<VybeBeaconSettings> = {}
  ): VybeBeacon {
    const beacon: VybeBeacon = {
      id: nanoid(),
      ownerId,
      ownerName,
      deviceType,
      status: 'standby',
      batteryPercent: 100,
      signalStrength: 100,
      transmissionMode: this.config.defaultTransmissionMode,
      frequencyHz: this.config.normalFrequencyHz,
      registeredAt: Date.now(),
      settings: { ...DEFAULT_BEACON_SETTINGS, ...settings },
    };

    this.beacons.set(beacon.id, beacon);
    return beacon;
  }

  /**
   * Update beacon location
   */
  updateBeaconLocation(beaconId: string, location: GeoCoordinate): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.location = location;
      this.beacons.set(beaconId, beacon);
    }
  }

  /**
   * Update beacon status
   */
  updateBeaconStatus(beaconId: string, status: VybeBeaconStatus): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.status = status;
      this.beacons.set(beaconId, beacon);
    }
  }

  /**
   * Get beacon by ID
   */
  getBeacon(beaconId: string): VybeBeacon | undefined {
    return this.beacons.get(beaconId);
  }

  /**
   * Get all active beacons
   */
  getActiveBeacons(): VybeBeacon[] {
    return Array.from(this.beacons.values()).filter(
      b => b.status !== 'offline'
    );
  }

  // ==================== SIGNAL TRANSMISSION ====================

  /**
   * Transmit a signal from a beacon
   */
  transmitSignal(
    beaconId: string,
    signalType: VybeSignalType,
    options: {
      mode?: VybeTransmissionMode;
      customPattern?: VybePattern;
      powerLevel?: number;
    } = {}
  ): VybeTransmission {
    const beacon = this.beacons.get(beaconId);
    if (!beacon) {
      throw new Error(`Beacon ${beaconId} not found`);
    }

    // Get pattern for signal type
    const pattern = options.customPattern ?? this.getPatternForSignalType(signalType);

    const transmission: VybeTransmission = {
      id: nanoid(),
      beaconId,
      signalType,
      mode: options.mode ?? beacon.transmissionMode,
      frequencyHz: signalType === 'sos_distress' || signalType === 'status_drowning'
        ? beacon.settings.emergencyFrequencyHz
        : beacon.settings.normalFrequencyHz,
      powerLevel: options.powerLevel ?? this.getPowerLevel(beacon.settings.transmissionPowerLevel),
      pattern,
      location: beacon.location,
      timestamp: Date.now(),
      durationMs: this.calculateTransmissionDuration(pattern),
      acknowledged: false,
    };

    // Update beacon state
    beacon.status = 'transmitting';
    beacon.lastTransmission = transmission;
    this.beacons.set(beaconId, beacon);

    // Start or update communication session for SOS signals
    if (this.isEmergencySignal(signalType)) {
      this.startOrUpdateSession(beacon, transmission);
    }

    this.emitEvent({
      type: 'signal_sent',
      timestamp: Date.now(),
      data: transmission,
    });

    // Simulate reception by base stations
    setTimeout(() => {
      beacon.status = 'standby';
      this.beacons.set(beaconId, beacon);
      this.simulateReceptionByStations(transmission);
    }, transmission.durationMs);

    return transmission;
  }

  /**
   * Trigger SOS from a beacon
   */
  triggerSOS(
    beaconId: string,
    reason: 'manual' | 'submersion' | 'no_movement' | 'fall' = 'manual'
  ): VybeTransmission {
    const beacon = this.beacons.get(beaconId);
    if (!beacon) {
      throw new Error(`Beacon ${beaconId} not found`);
    }

    beacon.status = 'sos_active';
    this.beacons.set(beaconId, beacon);

    const signalType: VybeSignalType = reason === 'submersion'
      ? 'status_drowning'
      : 'sos_distress';

    this.emitEvent({
      type: 'sos_triggered',
      timestamp: Date.now(),
      data: { beaconId, reason, ownerName: beacon.ownerName },
    });

    return this.transmitSignal(beaconId, signalType, {
      mode: 'resonance_burst',
      powerLevel: this.getPowerLevel('max'),
    });
  }

  // ==================== SIGNAL RECEPTION ====================

  /**
   * Process received signal
   */
  processReceivedSignal(
    receivedBy: string,
    frequencyHz: number,
    signalStrength: number,
    rawPattern: number[],
    estimatedDirection?: number
  ): VybeReception {
    // Decode the pattern
    const decoded = this.decodePattern(rawPattern);

    const reception: VybeReception = {
      id: nanoid(),
      receivedBy,
      sourceBeaconId: decoded.sourceBeaconId,
      signalType: decoded.signalType,
      frequencyHz,
      signalStrength,
      pattern: {
        type: decoded.patternType,
        sequence: rawPattern,
        repeatCount: 1,
        intervalMs: 200,
        encodedData: decoded.message,
      },
      estimatedDistance: this.estimateDistanceFromSignalStrength(signalStrength),
      estimatedDirection,
      timestamp: Date.now(),
      decoded: decoded.success,
      decodedMessage: decoded.message,
    };

    this.recentReceptions.push(reception);

    // Keep last 1000 receptions
    if (this.recentReceptions.length > 1000) {
      this.recentReceptions = this.recentReceptions.slice(-1000);
    }

    this.emitEvent({
      type: 'signal_received',
      timestamp: Date.now(),
      data: reception,
    });

    // Auto-acknowledge if configured
    if (this.config.autoAcknowledgeSignals && decoded.success) {
      this.acknowledgeSignal(reception);
    }

    // Attempt triangulation if we have enough data
    if (this.config.triangulationEnabled) {
      this.attemptTriangulation(reception);
    }

    return reception;
  }

  /**
   * Acknowledge a received signal
   */
  acknowledgeSignal(reception: VybeReception): void {
    if (!reception.sourceBeaconId) return;

    // Find the session and mark transmission as acknowledged
    for (const session of this.sessions.values()) {
      if (session.initiatorBeaconId === reception.sourceBeaconId) {
        session.status = 'acknowledged';
        session.lastActivityAt = Date.now();
        session.receptions.push(reception);

        // Update the original transmission
        const transmission = session.transmissions.find(
          t => !t.acknowledged
        );
        if (transmission) {
          transmission.acknowledged = true;
          transmission.acknowledgedAt = Date.now();
          transmission.acknowledgedBy = reception.receivedBy;
        }

        this.sessions.set(session.id, session);
        break;
      }
    }
  }

  // ==================== BASE STATIONS ====================

  /**
   * Register a base station
   */
  registerBaseStation(
    name: string,
    location: GeoCoordinate,
    coverageRadiusMeters: number,
    capabilities: VybeTransmissionMode[]
  ): VybeBaseStation {
    const station: VybeBaseStation = {
      id: nanoid(),
      name,
      location,
      coverageRadiusMeters,
      status: 'online',
      capabilities,
      frequencyRangeHz: { min: 1, max: 100000 },
      activeBeaconsInRange: 0,
      lastPingAt: Date.now(),
    };

    this.baseStations.set(station.id, station);
    return station;
  }

  /**
   * Get all online base stations
   */
  getOnlineStations(): VybeBaseStation[] {
    return Array.from(this.baseStations.values()).filter(
      s => s.status === 'online'
    );
  }

  // ==================== TRIANGULATION ====================

  /**
   * Attempt to triangulate signal source
   */
  attemptTriangulation(reception: VybeReception): VybeTriangulation | null {
    // Get recent receptions from different stations for the same signal type
    const relatedReceptions = this.recentReceptions.filter(
      r => r.signalType === reception.signalType &&
           r.receivedBy !== reception.receivedBy &&
           Date.now() - r.timestamp < 5000 // Within 5 seconds
    );

    if (relatedReceptions.length < this.config.minStationsForTriangulation - 1) {
      return null;
    }

    // Build station data for triangulation
    const stationData: VybeTriangulation['stations'] = [];

    for (const rec of [reception, ...relatedReceptions]) {
      const station = this.baseStations.get(rec.receivedBy);
      if (station && rec.estimatedDistance && rec.estimatedDirection !== undefined) {
        stationData.push({
          stationId: rec.receivedBy,
          signalStrength: rec.signalStrength,
          estimatedDistance: rec.estimatedDistance,
          bearing: rec.estimatedDirection,
        });
      }
    }

    if (stationData.length < this.config.minStationsForTriangulation) {
      return null;
    }

    // Calculate triangulated position
    const calculatedLocation = this.calculateTriangulatedPosition(stationData);

    const triangulation: VybeTriangulation = {
      id: nanoid(),
      sourceBeaconId: reception.sourceBeaconId,
      stations: stationData,
      calculatedLocation,
      accuracyMeters: this.estimateTriangulationAccuracy(stationData),
      confidence: stationData.length >= 4 ? 'high' : stationData.length >= 3 ? 'medium' : 'low',
      timestamp: Date.now(),
    };

    this.triangulations.set(triangulation.id, triangulation);

    // Update beacon location if we know the source
    if (reception.sourceBeaconId) {
      const beacon = this.beacons.get(reception.sourceBeaconId);
      if (beacon) {
        beacon.location = calculatedLocation;
        this.beacons.set(reception.sourceBeaconId, beacon);
      }
    }

    // Update session with location
    for (const session of this.sessions.values()) {
      if (session.initiatorBeaconId === reception.sourceBeaconId) {
        session.estimatedPersonLocation = calculatedLocation;
        session.locationAccuracyMeters = triangulation.accuracyMeters;
        this.sessions.set(session.id, session);
      }
    }

    this.emitEvent({
      type: 'triangulation_complete',
      timestamp: Date.now(),
      data: triangulation,
    });

    return triangulation;
  }

  // ==================== SESSIONS ====================

  /**
   * Get active communication sessions
   */
  getActiveSessions(): VybeCommunicationSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.status === 'active' || s.status === 'waiting_response' || s.status === 'acknowledged'
    );
  }

  /**
   * Mark rescue as dispatched for a session
   */
  dispatchRescue(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.rescueDispatched = true;
    session.notes = (session.notes ?? '') + `\nRescue dispatched at ${new Date().toISOString()}`;
    this.sessions.set(sessionId, session);

    return true;
  }

  /**
   * Complete a session (person found)
   */
  completeSession(sessionId: string, notes?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'completed';
    session.lastActivityAt = Date.now();
    if (notes) session.notes = (session.notes ?? '') + `\n${notes}`;

    // Reset beacon status
    const beacon = this.beacons.get(session.initiatorBeaconId);
    if (beacon) {
      beacon.status = 'standby';
      this.beacons.set(beacon.id, beacon);
    }

    this.sessions.set(sessionId, session);

    this.emitEvent({
      type: 'session_ended',
      timestamp: Date.now(),
      data: { sessionId, status: 'completed' },
    });

    return true;
  }

  // ==================== NETWORK STATUS ====================

  /**
   * Get overall network status
   */
  getNetworkStatus(): VybeNetworkStatus {
    const stations = Array.from(this.baseStations.values());
    const beacons = Array.from(this.beacons.values());
    const sessions = this.getActiveSessions();

    // Calculate coverage area (simplified)
    const coverageAreaSqKm = stations
      .filter(s => s.status === 'online')
      .reduce((total, s) => total + Math.PI * Math.pow(s.coverageRadiusMeters / 1000, 2), 0);

    return {
      totalBaseStations: stations.length,
      onlineStations: stations.filter(s => s.status === 'online').length,
      totalBeacons: beacons.length,
      activeBeacons: beacons.filter(b => b.status !== 'offline').length,
      sosAlertsActive: sessions.filter(s =>
        s.transmissions.some(t => this.isEmergencySignal(t.signalType))
      ).length,
      activeTriangulations: this.triangulations.size,
      coverageAreaSqKm: Math.round(coverageAreaSqKm * 100) / 100,
      lastNetworkCheck: Date.now(),
    };
  }

  /**
   * Subscribe to VybeXonR events
   */
  onEvent(callback: (event: VybeEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Get predefined SOS patterns
   */
  getSOSPatterns(): SOSPattern[] {
    return this.config.predefinedPatterns;
  }

  // ==================== PRIVATE HELPERS ====================

  private getPatternForSignalType(signalType: VybeSignalType): VybePattern {
    const mapping: Record<VybeSignalType, string> = {
      sos_distress: 'SOS',
      location_ping: 'PING',
      status_ok: 'OK',
      status_injured: 'INJ',
      status_trapped: 'TRAP',
      status_drowning: 'DROWN',
      request_rescue: 'SOS',
      acknowledge: 'ACK',
      direction_guide: 'PING',
      heartbeat_pulse: 'PING',
    };

    const code = mapping[signalType];
    const predefined = this.config.predefinedPatterns.find(p => p.code === code);

    return predefined?.pattern ?? {
      type: 'pulse_sequence',
      sequence: [1, 0, 1, 0, 1],
      repeatCount: 3,
      intervalMs: 200,
    };
  }

  private getPowerLevel(level: 'low' | 'medium' | 'high' | 'max'): number {
    const levels: Record<string, number> = {
      low: 60,
      medium: 80,
      high: 100,
      max: 120,
    };
    return levels[level] ?? 80;
  }

  private calculateTransmissionDuration(pattern: VybePattern): number {
    return pattern.sequence.length * pattern.intervalMs * pattern.repeatCount;
  }

  private isEmergencySignal(signalType: VybeSignalType): boolean {
    return ['sos_distress', 'status_drowning', 'status_trapped', 'request_rescue'].includes(signalType);
  }

  private startOrUpdateSession(beacon: VybeBeacon, transmission: VybeTransmission): void {
    // Find existing session or create new
    let session = Array.from(this.sessions.values()).find(
      s => s.initiatorBeaconId === beacon.id && s.status !== 'completed'
    );

    if (!session) {
      session = {
        id: nanoid(),
        initiatorBeaconId: beacon.id,
        responderIds: [],
        startedAt: Date.now(),
        lastActivityAt: Date.now(),
        status: 'waiting_response',
        transmissions: [],
        receptions: [],
        rescueDispatched: false,
      };

      this.emitEvent({
        type: 'session_started',
        timestamp: Date.now(),
        data: { sessionId: session.id, beaconId: beacon.id, ownerName: beacon.ownerName },
      });
    }

    session.transmissions.push(transmission);
    session.lastActivityAt = Date.now();
    this.sessions.set(session.id, session);
  }

  private simulateReceptionByStations(transmission: VybeTransmission): void {
    for (const station of this.baseStations.values()) {
      if (station.status !== 'online') continue;

      // Check if beacon is in range
      if (transmission.location) {
        const distance = this.calculateDistance(station.location, transmission.location);
        if (distance <= station.coverageRadiusMeters) {
          // Simulate signal reception with distance-based attenuation
          const signalStrength = transmission.powerLevel - (distance / 100); // Simple attenuation model

          this.processReceivedSignal(
            station.id,
            transmission.frequencyHz,
            signalStrength,
            transmission.pattern.sequence,
            this.calculateBearing(station.location, transmission.location)
          );
        }
      }
    }
  }

  private decodePattern(rawPattern: number[]): {
    success: boolean;
    signalType: VybeSignalType;
    patternType: VybePattern['type'];
    sourceBeaconId?: string;
    message?: string;
  } {
    // Try to match against known patterns
    for (const sosPattern of this.config.predefinedPatterns) {
      if (this.patternsMatch(rawPattern, sosPattern.pattern.sequence)) {
        return {
          success: true,
          signalType: this.codeToSignalType(sosPattern.code),
          patternType: sosPattern.pattern.type,
          message: sosPattern.meaning,
        };
      }
    }

    return {
      success: false,
      signalType: 'location_ping',
      patternType: 'pulse_sequence',
    };
  }

  private patternsMatch(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    let matches = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / a.length >= 0.8; // 80% match threshold
  }

  private codeToSignalType(code: string): VybeSignalType {
    const mapping: Record<string, VybeSignalType> = {
      SOS: 'sos_distress',
      TRAP: 'status_trapped',
      INJ: 'status_injured',
      PING: 'location_ping',
      OK: 'status_ok',
      DROWN: 'status_drowning',
      ACK: 'acknowledge',
    };
    return mapping[code] ?? 'location_ping';
  }

  private estimateDistanceFromSignalStrength(signalStrength: number): number {
    // Simple inverse relationship - lower signal = farther away
    // In reality, this would use proper signal propagation models
    return Math.max(10, (120 - signalStrength) * 10);
  }

  private calculateTriangulatedPosition(
    stations: VybeTriangulation['stations']
  ): GeoCoordinate {
    // Simple weighted average based on signal strength
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    for (const data of stations) {
      const station = this.baseStations.get(data.stationId);
      if (!station) continue;

      // Calculate estimated position from this station
      const bearing = data.bearing * (Math.PI / 180);
      const distance = data.estimatedDistance;

      const lat = station.location.latitude + (distance / 111320) * Math.cos(bearing);
      const lng = station.location.longitude + (distance / (111320 * Math.cos(station.location.latitude * Math.PI / 180))) * Math.sin(bearing);

      const weight = data.signalStrength;
      weightedLat += lat * weight;
      weightedLng += lng * weight;
      totalWeight += weight;
    }

    return {
      latitude: weightedLat / totalWeight,
      longitude: weightedLng / totalWeight,
    };
  }

  private estimateTriangulationAccuracy(stations: VybeTriangulation['stations']): number {
    // More stations = better accuracy
    const baseAccuracy = 50; // meters
    return baseAccuracy / Math.sqrt(stations.length);
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

  private calculateBearing(from: GeoCoordinate, to: GeoCoordinate): number {
    const lat1 = from.latitude * (Math.PI / 180);
    const lat2 = to.latitude * (Math.PI / 180);
    const dLon = (to.longitude - from.longitude) * (Math.PI / 180);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  private emitEvent(event: VybeEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

/** Create a new VybeXonR service instance */
export function createVybeXonRService(config?: Partial<VybeSystemConfig>): VybeXonRService {
  return new VybeXonRService(config);
}
