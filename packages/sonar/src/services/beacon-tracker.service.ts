/**
 * Personal Beacon/Tracker Service
 * Manages wrist devices, phone apps, and other personal trackers
 * for real-time location tracking and SOS alerts
 */

import { nanoid } from 'nanoid';
import type {
  PersonalTracker,
  TrackerDeviceType,
  TrackerStatus,
  TrackerSettings,
  TrackerLocationUpdate,
  TrackerVitals,
  SOSAlert,
  EmergencyContact,
  GeofenceArea,
  GeoCoordinate,
  TrackerServiceConfig,
  TrackerFleetStatus,
} from '../types';

/** Default tracker settings */
const DEFAULT_TRACKER_SETTINGS: TrackerSettings = {
  trackingIntervalSeconds: 30,
  sosButtonEnabled: true,
  autoSOSOnWaterImmersion: true,
  autoSOSOnFallDetection: true,
  autoSOSAfterNoMovementMinutes: 30,
  geofenceEnabled: false,
  shareLocationWithContacts: false,
  lowBatteryAlertPercent: 20,
};

/** Default service configuration */
const DEFAULT_SERVICE_CONFIG: TrackerServiceConfig = {
  maxTrackersPerPerson: 3,
  defaultTrackingIntervalSeconds: 30,
  sosTimeoutMinutes: 5,
  offlineThresholdMinutes: 10,
  enableVitalsMonitoring: true,
  enableAutomaticSOS: true,
  heartbeatIntervalSeconds: 60,
};

/** Tracker event types */
export interface TrackerEvent {
  type: 'location_update' | 'sos_triggered' | 'sos_resolved' | 'status_change' |
        'battery_low' | 'geofence_alert' | 'vitals_alert' | 'tracker_offline';
  trackerId: string;
  timestamp: number;
  data: unknown;
}

export class BeaconTrackerService {
  private config: TrackerServiceConfig;
  private trackers: Map<string, PersonalTracker> = new Map();
  private sosAlerts: Map<string, SOSAlert> = new Map();
  private locationHistory: Map<string, TrackerLocationUpdate[]> = new Map();
  private eventListeners: ((event: TrackerEvent) => void)[] = [];
  private heartbeatIntervalId?: ReturnType<typeof setInterval>;

  constructor(config: Partial<TrackerServiceConfig> = {}) {
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config };
    this.startHeartbeatMonitor();
  }

  /**
   * Register a new personal tracker
   */
  registerTracker(
    ownerId: string,
    ownerName: string,
    deviceType: TrackerDeviceType,
    options: {
      deviceModel?: string;
      phoneNumber?: string;
      emergencyContacts?: EmergencyContact[];
      settings?: Partial<TrackerSettings>;
    } = {}
  ): PersonalTracker {
    // Check max trackers per person
    const existingCount = Array.from(this.trackers.values())
      .filter(t => t.ownerId === ownerId).length;

    if (existingCount >= this.config.maxTrackersPerPerson) {
      throw new Error(`Maximum ${this.config.maxTrackersPerPerson} trackers per person`);
    }

    const tracker: PersonalTracker = {
      id: nanoid(),
      deviceType,
      deviceModel: options.deviceModel,
      ownerId,
      ownerName,
      phoneNumber: options.phoneNumber,
      emergencyContacts: options.emergencyContacts ?? [],
      status: 'active',
      batteryPercent: 100,
      registeredAt: Date.now(),
      settings: { ...DEFAULT_TRACKER_SETTINGS, ...options.settings },
    };

    this.trackers.set(tracker.id, tracker);
    this.locationHistory.set(tracker.id, []);

    return tracker;
  }

  /**
   * Process location update from tracker
   */
  updateLocation(update: TrackerLocationUpdate): void {
    const tracker = this.trackers.get(update.trackerId);
    if (!tracker) {
      throw new Error(`Tracker ${update.trackerId} not found`);
    }

    // Update tracker state
    tracker.lastKnownLocation = update.location;
    tracker.lastLocationUpdate = update.timestamp;
    tracker.lastHeartbeatTime = update.timestamp;
    tracker.batteryPercent = update.batteryPercent;

    // Check for automatic SOS conditions
    if (this.config.enableAutomaticSOS) {
      this.checkAutoSOSConditions(tracker, update);
    }

    // Check geofence
    if (tracker.settings.geofenceEnabled && tracker.settings.geofenceAreas) {
      this.checkGeofences(tracker, update.location);
    }

    // Check battery
    if (update.batteryPercent <= tracker.settings.lowBatteryAlertPercent) {
      if (tracker.status !== 'low_battery' && tracker.status !== 'critical_battery') {
        tracker.status = update.batteryPercent <= 5 ? 'critical_battery' : 'low_battery';
        this.emitEvent({
          type: 'battery_low',
          trackerId: tracker.id,
          timestamp: Date.now(),
          data: { batteryPercent: update.batteryPercent },
        });
      }
    }

    // Check vitals if present
    if (update.vitals && this.config.enableVitalsMonitoring) {
      this.checkVitals(tracker, update.vitals);
    }

    // Store in history
    const history = this.locationHistory.get(tracker.id) ?? [];
    history.push(update);
    // Keep last 1000 updates
    if (history.length > 1000) {
      this.locationHistory.set(tracker.id, history.slice(-1000));
    } else {
      this.locationHistory.set(tracker.id, history);
    }

    this.trackers.set(tracker.id, tracker);

    this.emitEvent({
      type: 'location_update',
      trackerId: tracker.id,
      timestamp: update.timestamp,
      data: update,
    });
  }

  /**
   * Trigger SOS alert
   */
  triggerSOS(
    trackerId: string,
    triggerType: SOSAlert['triggerType'] = 'manual'
  ): SOSAlert {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) {
      throw new Error(`Tracker ${trackerId} not found`);
    }

    // Create SOS alert
    const alert: SOSAlert = {
      id: nanoid(),
      trackerId,
      personName: tracker.ownerName,
      triggeredAt: Date.now(),
      triggerType,
      location: tracker.lastKnownLocation ?? { latitude: 0, longitude: 0 },
      locationAccuracy: 10,
      batteryPercent: tracker.batteryPercent,
      status: 'active',
    };

    // Update tracker status
    tracker.status = 'sos_triggered';
    this.trackers.set(trackerId, tracker);

    // Store alert
    this.sosAlerts.set(alert.id, alert);

    this.emitEvent({
      type: 'sos_triggered',
      trackerId,
      timestamp: Date.now(),
      data: alert,
    });

    // In production, would send notifications to emergency contacts here
    this.notifyEmergencyContacts(tracker, alert);

    return alert;
  }

  /**
   * Acknowledge SOS alert
   */
  acknowledgeSOS(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.sosAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    this.sosAlerts.set(alertId, alert);
    return true;
  }

  /**
   * Dispatch rescue for SOS
   */
  dispatchRescue(alertId: string, notes?: string): boolean {
    const alert = this.sosAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'rescue_dispatched';
    if (notes) alert.notes = notes;

    this.sosAlerts.set(alertId, alert);
    return true;
  }

  /**
   * Resolve SOS alert
   */
  resolveSOS(alertId: string, isFalseAlarm: boolean = false): boolean {
    const alert = this.sosAlerts.get(alertId);
    if (!alert) return false;

    alert.status = isFalseAlarm ? 'false_alarm' : 'resolved';

    // Reset tracker status
    const tracker = this.trackers.get(alert.trackerId);
    if (tracker) {
      tracker.status = 'active';
      this.trackers.set(alert.trackerId, tracker);
    }

    this.sosAlerts.set(alertId, alert);

    this.emitEvent({
      type: 'sos_resolved',
      trackerId: alert.trackerId,
      timestamp: Date.now(),
      data: { alertId, isFalseAlarm },
    });

    return true;
  }

  /**
   * Get tracker by ID
   */
  getTracker(trackerId: string): PersonalTracker | undefined {
    return this.trackers.get(trackerId);
  }

  /**
   * Get all trackers for a person
   */
  getTrackersByOwner(ownerId: string): PersonalTracker[] {
    return Array.from(this.trackers.values())
      .filter(t => t.ownerId === ownerId);
  }

  /**
   * Get all active SOS alerts
   */
  getActiveSOSAlerts(): SOSAlert[] {
    return Array.from(this.sosAlerts.values())
      .filter(a => a.status === 'active' || a.status === 'acknowledged');
  }

  /**
   * Get location history for a tracker
   */
  getLocationHistory(
    trackerId: string,
    since?: number
  ): TrackerLocationUpdate[] {
    const history = this.locationHistory.get(trackerId) ?? [];
    if (since) {
      return history.filter(u => u.timestamp >= since);
    }
    return history;
  }

  /**
   * Get latest location for all trackers
   */
  getAllTrackerLocations(): Map<string, TrackerLocationUpdate | null> {
    const locations = new Map<string, TrackerLocationUpdate | null>();

    for (const [id] of this.trackers) {
      const history = this.locationHistory.get(id);
      locations.set(id, history && history.length > 0 ? history[history.length - 1] : null);
    }

    return locations;
  }

  /**
   * Add geofence to tracker
   */
  addGeofence(trackerId: string, geofence: Omit<GeofenceArea, 'id'>): GeofenceArea {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) {
      throw new Error(`Tracker ${trackerId} not found`);
    }

    const area: GeofenceArea = {
      id: nanoid(),
      ...geofence,
    };

    tracker.settings.geofenceAreas = tracker.settings.geofenceAreas ?? [];
    tracker.settings.geofenceAreas.push(area);
    tracker.settings.geofenceEnabled = true;

    this.trackers.set(trackerId, tracker);
    return area;
  }

  /**
   * Remove geofence from tracker
   */
  removeGeofence(trackerId: string, geofenceId: string): boolean {
    const tracker = this.trackers.get(trackerId);
    if (!tracker || !tracker.settings.geofenceAreas) return false;

    const idx = tracker.settings.geofenceAreas.findIndex(g => g.id === geofenceId);
    if (idx >= 0) {
      tracker.settings.geofenceAreas.splice(idx, 1);
      this.trackers.set(trackerId, tracker);
      return true;
    }
    return false;
  }

  /**
   * Update tracker settings
   */
  updateTrackerSettings(
    trackerId: string,
    settings: Partial<TrackerSettings>
  ): boolean {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) return false;

    tracker.settings = { ...tracker.settings, ...settings };
    this.trackers.set(trackerId, tracker);
    return true;
  }

  /**
   * Add emergency contact
   */
  addEmergencyContact(trackerId: string, contact: EmergencyContact): boolean {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) return false;

    tracker.emergencyContacts.push(contact);
    this.trackers.set(trackerId, tracker);
    return true;
  }

  /**
   * Get fleet status summary
   */
  getFleetStatus(): TrackerFleetStatus {
    const trackers = Array.from(this.trackers.values());
    const now = Date.now();
    const offlineThreshold = this.config.offlineThresholdMinutes * 60 * 1000;

    return {
      totalTrackers: trackers.length,
      activeTrackers: trackers.filter(t =>
        t.status === 'active' &&
        t.lastHeartbeatTime &&
        (now - t.lastHeartbeatTime) < offlineThreshold
      ).length,
      sosAlerts: this.getActiveSOSAlerts().length,
      lowBatteryCount: trackers.filter(t =>
        t.status === 'low_battery' || t.status === 'critical_battery'
      ).length,
      offlineCount: trackers.filter(t =>
        t.status === 'offline' ||
        (t.lastHeartbeatTime && (now - t.lastHeartbeatTime) >= offlineThreshold)
      ).length,
      inWaterCount: trackers.filter(t => t.status === 'water_immersion').length,
      lastUpdated: now,
    };
  }

  /**
   * Subscribe to tracker events
   */
  onEvent(callback: (event: TrackerEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Deregister a tracker
   */
  deregisterTracker(trackerId: string): boolean {
    this.locationHistory.delete(trackerId);
    return this.trackers.delete(trackerId);
  }

  /**
   * Cleanup and stop monitoring
   */
  shutdown(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
  }

  // Private helper methods

  private startHeartbeatMonitor(): void {
    this.heartbeatIntervalId = setInterval(() => {
      this.checkOfflineTrackers();
    }, this.config.heartbeatIntervalSeconds * 1000);
  }

  private checkOfflineTrackers(): void {
    const now = Date.now();
    const threshold = this.config.offlineThresholdMinutes * 60 * 1000;

    for (const [id, tracker] of this.trackers) {
      if (
        tracker.lastHeartbeatTime &&
        (now - tracker.lastHeartbeatTime) >= threshold &&
        tracker.status !== 'offline'
      ) {
        tracker.status = 'offline';
        this.trackers.set(id, tracker);

        this.emitEvent({
          type: 'tracker_offline',
          trackerId: id,
          timestamp: now,
          data: { lastSeen: tracker.lastHeartbeatTime },
        });
      }
    }
  }

  private checkAutoSOSConditions(
    tracker: PersonalTracker,
    update: TrackerLocationUpdate
  ): void {
    // Water immersion check
    if (update.inWater && tracker.settings.autoSOSOnWaterImmersion) {
      if (tracker.status !== 'water_immersion' && tracker.status !== 'sos_triggered') {
        tracker.status = 'water_immersion';
        this.trackers.set(tracker.id, tracker);

        // Trigger SOS after brief delay to avoid false triggers
        setTimeout(() => {
          const current = this.trackers.get(tracker.id);
          if (current && current.status === 'water_immersion') {
            this.triggerSOS(tracker.id, 'water_immersion');
          }
        }, 5000);
      }
    }

    // No movement check
    if (tracker.settings.autoSOSAfterNoMovementMinutes) {
      const history = this.locationHistory.get(tracker.id) ?? [];
      const threshold = tracker.settings.autoSOSAfterNoMovementMinutes * 60 * 1000;

      if (history.length > 1) {
        const oldestInWindow = history.find(
          u => update.timestamp - u.timestamp >= threshold
        );

        if (oldestInWindow) {
          const distance = this.calculateDistance(
            oldestInWindow.location,
            update.location
          );

          // If moved less than 10 meters in the threshold period
          if (distance < 10 && tracker.status !== 'sos_triggered') {
            tracker.status = 'no_movement';
            this.trackers.set(tracker.id, tracker);
            this.triggerSOS(tracker.id, 'no_movement');
          }
        }
      }
    }
  }

  private checkGeofences(tracker: PersonalTracker, location: GeoCoordinate): void {
    if (!tracker.settings.geofenceAreas) return;

    for (const fence of tracker.settings.geofenceAreas) {
      const distance = this.calculateDistance(fence.center, location);
      const isInside = distance <= fence.radiusMeters;

      // Would need to track previous state to detect enter/exit
      // For now, just emit alert if in danger zone
      if (fence.type === 'danger_zone' && isInside) {
        this.emitEvent({
          type: 'geofence_alert',
          trackerId: tracker.id,
          timestamp: Date.now(),
          data: {
            geofenceId: fence.id,
            geofenceName: fence.name,
            type: fence.type,
            distance,
          },
        });
      }
    }
  }

  private checkVitals(tracker: PersonalTracker, vitals: TrackerVitals): void {
    // Check for abnormal vitals
    const alerts: string[] = [];

    if (vitals.heartRateBpm) {
      if (vitals.heartRateBpm < 40 || vitals.heartRateBpm > 180) {
        alerts.push(`Abnormal heart rate: ${vitals.heartRateBpm} BPM`);
      }
    }

    if (vitals.bloodOxygenPercent) {
      if (vitals.bloodOxygenPercent < 90) {
        alerts.push(`Low blood oxygen: ${vitals.bloodOxygenPercent}%`);
      }
    }

    if (vitals.skinTemperatureCelsius) {
      if (vitals.skinTemperatureCelsius < 32) {
        alerts.push(`Hypothermia risk: ${vitals.skinTemperatureCelsius}°C`);
      }
    }

    if (alerts.length > 0) {
      this.emitEvent({
        type: 'vitals_alert',
        trackerId: tracker.id,
        timestamp: Date.now(),
        data: { alerts, vitals },
      });
    }
  }

  private notifyEmergencyContacts(tracker: PersonalTracker, alert: SOSAlert): void {
    // In production, this would send SMS/push notifications
    for (const contact of tracker.emergencyContacts) {
      if (contact.notifyOnSOS) {
        console.log(`[SOS NOTIFICATION] ${contact.name} (${contact.phone}): ` +
          `${tracker.ownerName} triggered SOS at ${alert.location.latitude}, ${alert.location.longitude}`);
      }
    }
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

  private emitEvent(event: TrackerEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

/** Create a new beacon tracker service */
export function createBeaconTrackerService(
  config?: Partial<TrackerServiceConfig>
): BeaconTrackerService {
  return new BeaconTrackerService(config);
}
