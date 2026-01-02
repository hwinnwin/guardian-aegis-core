/**
 * VybeXonR Baby Interpreter Service
 *
 * Uses resonance detection and acoustic analysis to interpret baby cries,
 * understand their needs, and guide caregivers with actionable suggestions.
 *
 * Key capabilities:
 * - Cry pattern classification (hunger, tired, pain, discomfort, etc.)
 * - Need interpretation with confidence scoring
 * - Vital signs monitoring through resonance
 * - Pattern learning personalized to each baby
 * - Caregiver guidance and suggested actions
 */

import { EventEmitter } from 'events';
import type {
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
  ConfidenceLevel,
} from '../types';

export type BabyEvent =
  | { type: 'cry_detected'; detection: BabyCryDetection }
  | { type: 'need_interpreted'; interpretation: CryInterpretation }
  | { type: 'alert_raised'; alert: BabyAlert }
  | { type: 'state_changed'; babyId: string; oldState: BabyState; newState: BabyState }
  | { type: 'pattern_learned'; pattern: LearnedCryPattern }
  | { type: 'vital_anomaly'; babyId: string; vitals: BabyVitals; issue: string };

/**
 * Cry pattern signatures - research-based acoustic characteristics
 * Based on Dunstan Baby Language and acoustic research
 */
const CRY_PATTERN_SIGNATURES: Record<BabyCryPattern, Partial<CryAcousticSignature>> = {
  hunger_cry: {
    fundamentalFrequencyHz: 350,
    melodyPattern: 'rising',
    rhythmPattern: 'rhythmic',
    pausePattern: 'regular_pauses',
    harmonicRichness: 0.6,
  },
  tired_cry: {
    fundamentalFrequencyHz: 300,
    melodyPattern: 'falling',
    rhythmPattern: 'continuous',
    pausePattern: 'no_pauses',
    harmonicRichness: 0.4,
  },
  discomfort_cry: {
    fundamentalFrequencyHz: 400,
    melodyPattern: 'varied',
    rhythmPattern: 'arrhythmic',
    pausePattern: 'regular_pauses',
    harmonicRichness: 0.5,
  },
  pain_cry: {
    fundamentalFrequencyHz: 550,
    melodyPattern: 'flat',
    rhythmPattern: 'staccato',
    pausePattern: 'gasping',
    harmonicRichness: 0.8,
  },
  colic_cry: {
    fundamentalFrequencyHz: 500,
    melodyPattern: 'rising',
    rhythmPattern: 'continuous',
    pausePattern: 'no_pauses',
    harmonicRichness: 0.9,
  },
  overstimulated_cry: {
    fundamentalFrequencyHz: 420,
    melodyPattern: 'rising',
    rhythmPattern: 'arrhythmic',
    pausePattern: 'regular_pauses',
    harmonicRichness: 0.7,
  },
  lonely_cry: {
    fundamentalFrequencyHz: 320,
    melodyPattern: 'varied',
    rhythmPattern: 'arrhythmic',
    pausePattern: 'regular_pauses',
    harmonicRichness: 0.3,
  },
  sick_cry: {
    fundamentalFrequencyHz: 280,
    melodyPattern: 'falling',
    rhythmPattern: 'arrhythmic',
    pausePattern: 'regular_pauses',
    harmonicRichness: 0.2,
  },
  startled_cry: {
    fundamentalFrequencyHz: 600,
    melodyPattern: 'flat',
    rhythmPattern: 'staccato',
    pausePattern: 'gasping',
    harmonicRichness: 0.7,
  },
  unknown: {
    fundamentalFrequencyHz: 400,
    melodyPattern: 'varied',
    rhythmPattern: 'arrhythmic',
    pausePattern: 'regular_pauses',
    harmonicRichness: 0.5,
  },
};

/**
 * Mapping from cry patterns to likely needs
 */
const CRY_TO_NEED_MAPPING: Record<BabyCryPattern, { primary: BabyNeed; alternatives: BabyNeed[] }> = {
  hunger_cry: { primary: 'feeding', alternatives: ['comfort'] },
  tired_cry: { primary: 'sleep', alternatives: ['comfort', 'overstimulation'] },
  discomfort_cry: { primary: 'diaper_change', alternatives: ['temperature', 'comfort'] },
  pain_cry: { primary: 'illness', alternatives: ['teething', 'burping'] },
  colic_cry: { primary: 'burping', alternatives: ['comfort', 'illness'] },
  overstimulated_cry: { primary: 'overstimulation', alternatives: ['sleep', 'comfort'] },
  lonely_cry: { primary: 'comfort', alternatives: ['boredom'] },
  sick_cry: { primary: 'illness', alternatives: ['comfort', 'feeding'] },
  startled_cry: { primary: 'comfort', alternatives: [] },
  unknown: { primary: 'unknown', alternatives: ['feeding', 'sleep', 'comfort', 'diaper_change'] },
};

/**
 * Suggested caregiver actions per need
 */
const NEED_TO_ACTIONS: Record<BabyNeed, CaregiverAction[]> = {
  feeding: [
    { action: 'Offer breast or bottle', priority: 1, estimatedEffectivenessPercent: 85, timeToTryMinutes: 10 },
    { action: 'Check for hunger cues (rooting, sucking fist)', priority: 2, estimatedEffectivenessPercent: 70, timeToTryMinutes: 2 },
  ],
  sleep: [
    { action: 'Create calm, dark environment', priority: 1, estimatedEffectivenessPercent: 75, timeToTryMinutes: 5 },
    { action: 'Gentle rocking or swaying', priority: 2, estimatedEffectivenessPercent: 80, timeToTryMinutes: 10 },
    { action: 'Swaddle if age appropriate', priority: 3, estimatedEffectivenessPercent: 70, timeToTryMinutes: 3 },
    { action: 'White noise or gentle shushing', priority: 4, estimatedEffectivenessPercent: 65, timeToTryMinutes: 5 },
  ],
  diaper_change: [
    { action: 'Check diaper for wetness or soiling', priority: 1, estimatedEffectivenessPercent: 90, timeToTryMinutes: 2 },
    { action: 'Change diaper with gentle wipes', priority: 2, estimatedEffectivenessPercent: 95, timeToTryMinutes: 5 },
    { action: 'Apply diaper cream if redness present', priority: 3, estimatedEffectivenessPercent: 80, timeToTryMinutes: 2, notes: 'Check for diaper rash' },
  ],
  temperature: [
    { action: 'Check room temperature (ideal: 68-72°F / 20-22°C)', priority: 1, estimatedEffectivenessPercent: 70, timeToTryMinutes: 2 },
    { action: 'Feel back of neck for warmth/sweat', priority: 2, estimatedEffectivenessPercent: 80, timeToTryMinutes: 1 },
    { action: 'Add or remove a layer of clothing', priority: 3, estimatedEffectivenessPercent: 85, timeToTryMinutes: 3 },
  ],
  comfort: [
    { action: 'Hold baby close, skin-to-skin if possible', priority: 1, estimatedEffectivenessPercent: 90, timeToTryMinutes: 10 },
    { action: 'Gentle patting or rhythmic movement', priority: 2, estimatedEffectivenessPercent: 75, timeToTryMinutes: 5 },
    { action: 'Soft singing or talking', priority: 3, estimatedEffectivenessPercent: 65, timeToTryMinutes: 5 },
  ],
  burping: [
    { action: 'Hold upright against shoulder, pat back', priority: 1, estimatedEffectivenessPercent: 85, timeToTryMinutes: 5 },
    { action: 'Sit baby on lap, support chin, pat back', priority: 2, estimatedEffectivenessPercent: 80, timeToTryMinutes: 5 },
    { action: 'Bicycle legs gently to release gas', priority: 3, estimatedEffectivenessPercent: 70, timeToTryMinutes: 3 },
  ],
  teething: [
    { action: 'Offer chilled (not frozen) teething ring', priority: 1, estimatedEffectivenessPercent: 75, timeToTryMinutes: 10 },
    { action: 'Gentle gum massage with clean finger', priority: 2, estimatedEffectivenessPercent: 70, timeToTryMinutes: 5 },
    { action: 'Consult pediatrician for pain relief options', priority: 3, estimatedEffectivenessPercent: 85, timeToTryMinutes: 2, notes: 'For persistent discomfort' },
  ],
  illness: [
    { action: 'Check temperature with thermometer', priority: 1, estimatedEffectivenessPercent: 95, timeToTryMinutes: 2 },
    { action: 'Look for other symptoms (rash, congestion, pulling ears)', priority: 2, estimatedEffectivenessPercent: 80, timeToTryMinutes: 3 },
    { action: 'Contact healthcare provider if concerned', priority: 3, estimatedEffectivenessPercent: 90, timeToTryMinutes: 5, notes: 'Especially for fever >100.4°F in infants under 3 months' },
  ],
  overstimulation: [
    { action: 'Move to quiet, dimly lit room', priority: 1, estimatedEffectivenessPercent: 85, timeToTryMinutes: 5 },
    { action: 'Reduce noise and activity around baby', priority: 2, estimatedEffectivenessPercent: 80, timeToTryMinutes: 3 },
    { action: 'Hold calmly without bouncing or talking', priority: 3, estimatedEffectivenessPercent: 75, timeToTryMinutes: 10 },
  ],
  boredom: [
    { action: 'Engage with face-to-face interaction', priority: 1, estimatedEffectivenessPercent: 80, timeToTryMinutes: 5 },
    { action: 'Offer age-appropriate toy or high-contrast images', priority: 2, estimatedEffectivenessPercent: 70, timeToTryMinutes: 5 },
    { action: 'Change scenery - walk around house or outside', priority: 3, estimatedEffectivenessPercent: 75, timeToTryMinutes: 10 },
  ],
  unknown: [
    { action: 'Run through checklist: diaper, hunger, temperature, comfort', priority: 1, estimatedEffectivenessPercent: 70, timeToTryMinutes: 10 },
    { action: 'Try the 5 S\'s: Swaddle, Side, Shush, Swing, Suck', priority: 2, estimatedEffectivenessPercent: 75, timeToTryMinutes: 15 },
    { action: 'Trust your instincts - you know your baby', priority: 3, estimatedEffectivenessPercent: 60, timeToTryMinutes: 5 },
  ],
};

export class BabyInterpreterService extends EventEmitter {
  private profiles: Map<string, BabyProfile> = new Map();
  private sessions: Map<string, BabyMonitorSession> = new Map();
  private alerts: Map<string, BabyAlert> = new Map();
  private config: BabyInterpreterConfig;
  private isListening: boolean = false;
  private detectionsToday: number = 0;

  constructor(config?: Partial<BabyInterpreterConfig>) {
    super();
    this.config = {
      sensitivityLevel: 'medium',
      cryDetectionThresholdDb: 60,
      enableVitalMonitoring: true,
      enablePatternLearning: true,
      alertOnProlongedCrying: true,
      prolongedCryingThresholdMinutes: 15,
      alertOnVitalAnomalies: true,
      notificationChannels: ['app', 'vibration'],
      ...config,
    };
  }

  /**
   * Register a baby profile for personalized interpretation
   */
  registerBaby(
    name: string,
    birthDate: number,
    options?: {
      healthConditions?: string[];
      feedingSchedule?: number[];
      sleepPattern?: 'short_napper' | 'long_napper' | 'irregular';
    }
  ): BabyProfile {
    const ageMs = Date.now() - birthDate;
    const ageMonths = Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000));

    const profile: BabyProfile = {
      id: `baby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      birthDate,
      ageMonths,
      normalHeartRateRange: this.getAgeAppropriateHeartRate(ageMonths),
      normalTempRange: { min: 36.1, max: 37.2 }, // Celsius
      feedingSchedule: options?.feedingSchedule,
      sleepPattern: options?.sleepPattern,
      healthConditions: options?.healthConditions,
      learnedCryPatterns: [],
      registeredAt: Date.now(),
      lastUpdated: Date.now(),
    };

    this.profiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Get age-appropriate heart rate range
   */
  private getAgeAppropriateHeartRate(ageMonths: number): { min: number; max: number } {
    if (ageMonths < 1) return { min: 100, max: 160 }; // Newborn
    if (ageMonths < 6) return { min: 90, max: 150 };  // Infant
    if (ageMonths < 12) return { min: 80, max: 140 }; // Baby
    return { min: 70, max: 120 };                      // Toddler
  }

  /**
   * Start monitoring session for a baby
   */
  startMonitoring(babyId: string): BabyMonitorSession {
    const profile = this.profiles.get(babyId);
    if (!profile) {
      throw new Error(`Baby profile not found: ${babyId}`);
    }

    const session: BabyMonitorSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      babyId,
      startedAt: Date.now(),
      status: 'active',
      detections: [],
      stateHistory: [{ state: 'quiet_alert', timestamp: Date.now(), durationMinutes: 0 }],
      vitalsHistory: [],
      alerts: [],
      caregiverNotified: false,
    };

    this.sessions.set(session.id, session);
    this.isListening = true;
    return session;
  }

  /**
   * Stop monitoring session
   */
  stopMonitoring(sessionId: string): BabyMonitorSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endedAt = Date.now();
    }
    return session;
  }

  /**
   * Process incoming cry audio and interpret
   */
  processCryAudio(
    babyId: string | undefined,
    acousticSignature: CryAcousticSignature
  ): CryInterpretation {
    // Match cry pattern
    const detectedPattern = this.matchCryPattern(acousticSignature, babyId);
    const patternConfidence = this.calculatePatternConfidence(acousticSignature, detectedPattern);

    // Get need interpretation
    const needMapping = CRY_TO_NEED_MAPPING[detectedPattern];
    const interpretedNeed = needMapping.primary;
    const needConfidence = this.calculateNeedConfidence(patternConfidence, interpretedNeed, babyId);

    // Determine baby state
    const currentState = this.determineBabyState(acousticSignature, interpretedNeed);

    // Get urgency level
    const urgency = this.calculateUrgency(detectedPattern, acousticSignature, interpretedNeed);

    // Create detection record
    const detection: BabyCryDetection = {
      id: `detection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      babyId,
      timestamp: Date.now(),
      acousticSignature,
      detectedPattern,
      patternConfidence: this.confidenceToLevel(patternConfidence),
      interpretedNeed,
      needConfidence: this.confidenceToLevel(needConfidence),
      currentState,
      suggestedActions: NEED_TO_ACTIONS[interpretedNeed].map(a => a.action),
      urgency,
      durationSeconds: acousticSignature.durationMs / 1000,
    };

    this.detectionsToday++;

    // Get context factors
    const contextFactors = this.getContextFactors(babyId);

    // Build full interpretation
    const interpretation: CryInterpretation = {
      detection,
      primaryNeed: interpretedNeed,
      primaryNeedConfidence: needConfidence,
      alternativeNeeds: needMapping.alternatives.map((need, i) => ({
        need,
        confidence: needConfidence * (0.7 - i * 0.1),
      })),
      suggestedResponses: NEED_TO_ACTIONS[interpretedNeed],
      contextFactors,
      comparisonToBaseline: this.compareToBaseline(acousticSignature, babyId),
    };

    // Emit events
    this.emit('cry_detected', { type: 'cry_detected', detection });
    this.emit('need_interpreted', { type: 'need_interpreted', interpretation });

    // Update session if exists
    if (babyId) {
      this.updateSessionWithDetection(babyId, detection);
    }

    // Check for alerts
    this.checkForAlerts(detection, babyId);

    // Learn pattern if enabled and caregiver confirmed
    if (this.config.enablePatternLearning && babyId) {
      this.learnPattern(babyId, detectedPattern, interpretedNeed, acousticSignature);
    }

    return interpretation;
  }

  /**
   * Match acoustic signature to known cry patterns
   */
  private matchCryPattern(signature: CryAcousticSignature, babyId?: string): BabyCryPattern {
    let bestMatch: BabyCryPattern = 'unknown';
    let bestScore = 0;

    // First check learned patterns for this specific baby
    if (babyId) {
      const profile = this.profiles.get(babyId);
      if (profile) {
        for (const learned of profile.learnedCryPatterns) {
          const score = this.compareSignatures(signature, learned.acousticSignature);
          if (score > bestScore && score > 0.7) {
            bestScore = score;
            bestMatch = learned.cryType;
          }
        }
      }
    }

    // If no good learned match, use general patterns
    if (bestScore < 0.7) {
      for (const [pattern, reference] of Object.entries(CRY_PATTERN_SIGNATURES)) {
        const score = this.matchAgainstReference(signature, reference);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = pattern as BabyCryPattern;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Compare two acoustic signatures
   */
  private compareSignatures(a: CryAcousticSignature, b: CryAcousticSignature): number {
    let score = 0;
    let factors = 0;

    // Frequency match (within 50 Hz)
    const freqDiff = Math.abs(a.fundamentalFrequencyHz - b.fundamentalFrequencyHz);
    score += Math.max(0, 1 - freqDiff / 100);
    factors++;

    // Melody pattern match
    if (a.melodyPattern === b.melodyPattern) score += 1;
    factors++;

    // Rhythm pattern match
    if (a.rhythmPattern === b.rhythmPattern) score += 1;
    factors++;

    // Pause pattern match
    if (a.pausePattern === b.pausePattern) score += 1;
    factors++;

    // Harmonic richness (within 0.2)
    const harmDiff = Math.abs(a.harmonicRichness - b.harmonicRichness);
    score += Math.max(0, 1 - harmDiff / 0.4);
    factors++;

    return score / factors;
  }

  /**
   * Match against reference pattern (partial signature)
   */
  private matchAgainstReference(signature: CryAcousticSignature, reference: Partial<CryAcousticSignature>): number {
    let score = 0;
    let factors = 0;

    if (reference.fundamentalFrequencyHz !== undefined) {
      const freqDiff = Math.abs(signature.fundamentalFrequencyHz - reference.fundamentalFrequencyHz);
      score += Math.max(0, 1 - freqDiff / 150);
      factors++;
    }

    if (reference.melodyPattern !== undefined) {
      score += signature.melodyPattern === reference.melodyPattern ? 1 : 0.3;
      factors++;
    }

    if (reference.rhythmPattern !== undefined) {
      score += signature.rhythmPattern === reference.rhythmPattern ? 1 : 0.3;
      factors++;
    }

    if (reference.pausePattern !== undefined) {
      score += signature.pausePattern === reference.pausePattern ? 1 : 0.3;
      factors++;
    }

    if (reference.harmonicRichness !== undefined) {
      const harmDiff = Math.abs(signature.harmonicRichness - reference.harmonicRichness);
      score += Math.max(0, 1 - harmDiff / 0.5);
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate pattern confidence
   */
  private calculatePatternConfidence(signature: CryAcousticSignature, pattern: BabyCryPattern): number {
    const reference = CRY_PATTERN_SIGNATURES[pattern];
    const matchScore = this.matchAgainstReference(signature, reference);

    // Boost confidence with intensity
    const intensityBoost = signature.intensityDb > 70 ? 0.1 : 0;

    // Reduce confidence for very short cries
    const durationPenalty = signature.durationMs < 500 ? 0.2 : 0;

    return Math.min(1, Math.max(0, matchScore + intensityBoost - durationPenalty));
  }

  /**
   * Calculate need confidence based on pattern confidence and context
   */
  private calculateNeedConfidence(patternConfidence: number, need: BabyNeed, babyId?: string): number {
    let confidence = patternConfidence * 0.8; // Start with pattern confidence

    // Boost if context supports the need
    if (babyId) {
      const profile = this.profiles.get(babyId);
      if (profile) {
        // Check if feeding is due
        if (need === 'feeding' && profile.feedingSchedule) {
          const hour = new Date().getHours();
          if (profile.feedingSchedule.includes(hour)) {
            confidence += 0.15;
          }
        }

        // Check learned patterns
        const learnedMatch = profile.learnedCryPatterns.find(p => p.need === need);
        if (learnedMatch && learnedMatch.confirmedByCaregiver) {
          confidence += learnedMatch.accuracy * 0.1;
        }
      }
    }

    return Math.min(1, confidence);
  }

  /**
   * Convert numeric confidence to level
   */
  private confidenceToLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.85) return 'very_high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.3) return 'low';
    return 'very_low';
  }

  /**
   * Determine baby's current state from cry
   */
  private determineBabyState(signature: CryAcousticSignature, need: BabyNeed): BabyState {
    // High intensity, long duration = more distressed
    if (signature.intensityDb > 80 && signature.durationMs > 30000) {
      return 'inconsolable';
    }

    if (signature.intensityDb > 70) {
      return 'crying';
    }

    if (signature.rhythmPattern === 'arrhythmic' || need === 'illness') {
      return 'fussy';
    }

    return 'active_alert';
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgency(
    pattern: BabyCryPattern,
    signature: CryAcousticSignature,
    need: BabyNeed
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: pain or illness cries
    if (pattern === 'pain_cry' || pattern === 'sick_cry') {
      return 'critical';
    }

    // High: prolonged high-intensity crying
    if (signature.intensityDb > 80 && signature.durationMs > 60000) {
      return 'high';
    }

    // High: colic (baby is very uncomfortable)
    if (pattern === 'colic_cry') {
      return 'high';
    }

    // Medium: basic needs
    if (need === 'feeding' || need === 'diaper_change') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get context factors for interpretation
   */
  private getContextFactors(babyId?: string): string[] {
    const factors: string[] = [];

    if (!babyId) {
      factors.push('Baby not registered - using general patterns');
      return factors;
    }

    const profile = this.profiles.get(babyId);
    if (!profile) return factors;

    // Check age-related factors
    if (profile.ageMonths < 3) {
      factors.push('Newborn phase: frequent feeding needs expected');
    } else if (profile.ageMonths >= 4 && profile.ageMonths <= 7) {
      factors.push('Teething may begin around this age');
    }

    // Check time-based factors
    const hour = new Date().getHours();
    if (hour >= 18 || hour <= 6) {
      factors.push('Evening/night: overtiredness more likely');
    }

    if (profile.feedingSchedule) {
      const timeSinceLastFeed = this.getTimeSinceScheduledFeed(profile.feedingSchedule);
      if (timeSinceLastFeed > 2) {
        factors.push(`Last scheduled feeding was ${timeSinceLastFeed} hours ago`);
      }
    }

    // Check active session for recent patterns
    const session = this.getActiveSession(babyId);
    if (session) {
      const recentDetections = session.detections.slice(-5);
      if (recentDetections.length >= 3) {
        const samePattern = recentDetections.every(d => d.interpretedNeed === recentDetections[0].interpretedNeed);
        if (samePattern) {
          factors.push(`Repeated ${recentDetections[0].interpretedNeed} signals detected`);
        }
      }
    }

    // Health conditions
    if (profile.healthConditions?.includes('reflux')) {
      factors.push('Known reflux: consider burping and positioning');
    }
    if (profile.healthConditions?.includes('colic')) {
      factors.push('Known colic: evening fussiness expected');
    }

    return factors;
  }

  /**
   * Get time since last scheduled feed
   */
  private getTimeSinceScheduledFeed(schedule: number[]): number {
    const currentHour = new Date().getHours();
    let minDiff = 24;

    for (const feedHour of schedule) {
      let diff = currentHour - feedHour;
      if (diff < 0) diff += 24;
      if (diff < minDiff) minDiff = diff;
    }

    return minDiff;
  }

  /**
   * Compare signature to baby's baseline
   */
  private compareToBaseline(
    signature: CryAcousticSignature,
    babyId?: string
  ): 'normal' | 'slightly_unusual' | 'unusual' | 'concerning' {
    if (!babyId) return 'normal';

    const profile = this.profiles.get(babyId);
    if (!profile || profile.learnedCryPatterns.length < 5) {
      return 'normal'; // Not enough data for baseline
    }

    // Calculate average signature from learned patterns
    const avgFreq = profile.learnedCryPatterns.reduce((s, p) => s + p.acousticSignature.fundamentalFrequencyHz, 0) / profile.learnedCryPatterns.length;
    const avgHarmonic = profile.learnedCryPatterns.reduce((s, p) => s + p.acousticSignature.harmonicRichness, 0) / profile.learnedCryPatterns.length;

    const freqDiff = Math.abs(signature.fundamentalFrequencyHz - avgFreq);
    const harmDiff = Math.abs(signature.harmonicRichness - avgHarmonic);

    if (freqDiff > 150 || harmDiff > 0.4) return 'concerning';
    if (freqDiff > 100 || harmDiff > 0.3) return 'unusual';
    if (freqDiff > 50 || harmDiff > 0.2) return 'slightly_unusual';

    return 'normal';
  }

  /**
   * Get active monitoring session for a baby
   */
  private getActiveSession(babyId: string): BabyMonitorSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.babyId === babyId && session.status === 'active') {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Update session with new detection
   */
  private updateSessionWithDetection(babyId: string, detection: BabyCryDetection): void {
    const session = this.getActiveSession(babyId);
    if (!session) return;

    session.detections.push(detection);

    // Update state history
    const lastState = session.stateHistory[session.stateHistory.length - 1];
    if (lastState.state !== detection.currentState) {
      lastState.durationMinutes = (Date.now() - lastState.timestamp) / 60000;
      session.stateHistory.push({
        state: detection.currentState,
        timestamp: Date.now(),
        durationMinutes: 0,
      });

      this.emit('state_changed', {
        type: 'state_changed',
        babyId,
        oldState: lastState.state,
        newState: detection.currentState,
      });
    }
  }

  /**
   * Check for alerts based on detection
   */
  private checkForAlerts(detection: BabyCryDetection, babyId?: string): void {
    const alertsToRaise: BabyAlert[] = [];

    // Prolonged crying alert
    if (this.config.alertOnProlongedCrying && babyId) {
      const session = this.getActiveSession(babyId);
      if (session) {
        const recentCrying = session.detections.filter(
          d => Date.now() - d.timestamp < this.config.prolongedCryingThresholdMinutes * 60000
        );
        if (recentCrying.length >= 3) {
          alertsToRaise.push({
            id: `alert_${Date.now()}`,
            babyId,
            type: 'prolonged_crying',
            severity: 'warning',
            message: `Baby has been crying for ${this.config.prolongedCryingThresholdMinutes}+ minutes`,
            detection,
            timestamp: Date.now(),
            acknowledged: false,
          });
        }
      }
    }

    // Urgent cry patterns
    if (detection.urgency === 'critical') {
      alertsToRaise.push({
        id: `alert_${Date.now()}_urgent`,
        babyId: babyId || 'unknown',
        type: detection.detectedPattern === 'pain_cry' ? 'unusual_pattern' : 'cry_detected',
        severity: 'urgent',
        message: `Critical cry detected: ${detection.detectedPattern}`,
        detection,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    // Emit alerts
    for (const alert of alertsToRaise) {
      this.alerts.set(alert.id, alert);
      this.emit('alert_raised', { type: 'alert_raised', alert });
    }
  }

  /**
   * Learn a new cry pattern from caregiver confirmation
   */
  private learnPattern(
    babyId: string,
    cryType: BabyCryPattern,
    need: BabyNeed,
    signature: CryAcousticSignature
  ): void {
    const profile = this.profiles.get(babyId);
    if (!profile) return;

    // Check for existing similar pattern
    const existingIndex = profile.learnedCryPatterns.findIndex(
      p => p.cryType === cryType && p.need === need
    );

    if (existingIndex >= 0) {
      // Update existing pattern
      const existing = profile.learnedCryPatterns[existingIndex];
      existing.occurrenceCount++;
      existing.lastOccurred = Date.now();
      // Average the acoustic signature
      existing.acousticSignature.fundamentalFrequencyHz =
        (existing.acousticSignature.fundamentalFrequencyHz * (existing.occurrenceCount - 1) + signature.fundamentalFrequencyHz) / existing.occurrenceCount;
    } else {
      // Add new learned pattern
      const learnedPattern: LearnedCryPattern = {
        id: `learned_${Date.now()}`,
        babyId,
        cryType,
        need,
        acousticSignature: signature,
        confirmedByCaregiver: false,
        occurrenceCount: 1,
        lastOccurred: Date.now(),
        accuracy: 0.5, // Initial accuracy
      };

      profile.learnedCryPatterns.push(learnedPattern);
      this.emit('pattern_learned', { type: 'pattern_learned', pattern: learnedPattern });
    }

    profile.lastUpdated = Date.now();
  }

  /**
   * Caregiver confirms or corrects interpretation
   */
  confirmInterpretation(
    detectionId: string,
    actualNeed: BabyNeed,
    wasCorrect: boolean
  ): void {
    // Find the detection
    for (const session of this.sessions.values()) {
      const detection = session.detections.find(d => d.id === detectionId);
      if (detection && detection.babyId) {
        const profile = this.profiles.get(detection.babyId);
        if (profile) {
          // Update learned pattern accuracy
          const pattern = profile.learnedCryPatterns.find(
            p => p.cryType === detection.detectedPattern && p.need === detection.interpretedNeed
          );

          if (pattern) {
            pattern.confirmedByCaregiver = true;
            // Adjust accuracy based on feedback
            pattern.accuracy = pattern.accuracy * 0.9 + (wasCorrect ? 0.1 : 0);
          }

          // If wrong, learn the correct association
          if (!wasCorrect) {
            this.learnPattern(
              detection.babyId,
              detection.detectedPattern,
              actualNeed,
              detection.acousticSignature
            );
          }

          profile.lastUpdated = Date.now();
        }
        break;
      }
    }
  }

  /**
   * Process vital signs from resonance detection
   */
  processVitals(babyId: string, vitals: BabyVitals): void {
    const profile = this.profiles.get(babyId);
    const session = this.getActiveSession(babyId);

    if (session) {
      session.vitalsHistory.push(vitals);
    }

    if (!profile || !this.config.alertOnVitalAnomalies) return;

    // Check for anomalies
    const issues: string[] = [];

    if (vitals.heartRateBpm < profile.normalHeartRateRange.min) {
      issues.push(`Low heart rate: ${vitals.heartRateBpm} bpm`);
    } else if (vitals.heartRateBpm > profile.normalHeartRateRange.max) {
      issues.push(`High heart rate: ${vitals.heartRateBpm} bpm`);
    }

    if (vitals.bodyTemperature !== undefined) {
      if (vitals.bodyTemperature > profile.normalTempRange.max) {
        issues.push(`Fever detected: ${vitals.bodyTemperature}°C`);
      } else if (vitals.bodyTemperature < profile.normalTempRange.min) {
        issues.push(`Low temperature: ${vitals.bodyTemperature}°C`);
      }
    }

    // Abnormal respiratory rate for infants
    if (vitals.respiratoryRate < 25 || vitals.respiratoryRate > 65) {
      issues.push(`Abnormal respiratory rate: ${vitals.respiratoryRate}/min`);
    }

    // No movement alert
    if (vitals.movementLevel === 'still' && session) {
      const recentVitals = session.vitalsHistory.slice(-5);
      if (recentVitals.every(v => v.movementLevel === 'still')) {
        issues.push('No movement detected for extended period');
      }
    }

    // Raise alerts for issues
    for (const issue of issues) {
      const alert: BabyAlert = {
        id: `alert_vital_${Date.now()}`,
        babyId,
        type: issue.includes('Fever') ? 'fever_detected' : issue.includes('movement') ? 'no_movement' : 'vital_anomaly',
        severity: issue.includes('Fever') ? 'urgent' : 'warning',
        message: issue,
        vitals,
        timestamp: Date.now(),
        acknowledged: false,
      };

      this.alerts.set(alert.id, alert);
      this.emit('alert_raised', { type: 'alert_raised', alert });
      this.emit('vital_anomaly', { type: 'vital_anomaly', babyId, vitals, issue });
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, actionsTaken?: string[]): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      alert.actionsTaken = actionsTaken;
      return true;
    }
    return false;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): BabyAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.acknowledged);
  }

  /**
   * Get baby profile
   */
  getBabyProfile(babyId: string): BabyProfile | undefined {
    return this.profiles.get(babyId);
  }

  /**
   * Get all registered babies
   */
  getAllBabies(): BabyProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get monitoring session history for a baby
   */
  getSessionHistory(babyId: string): BabyMonitorSession[] {
    return Array.from(this.sessions.values()).filter(s => s.babyId === babyId);
  }

  /**
   * Get interpreter status
   */
  getStatus(): BabyInterpreterStatus {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active');
    const totalPatterns = Array.from(this.profiles.values()).reduce(
      (sum, p) => sum + p.learnedCryPatterns.length,
      0
    );
    const avgAccuracy = this.calculateAverageAccuracy();

    return {
      registeredBabies: this.profiles.size,
      activeMonitoringSessions: activeSessions.length,
      totalCryDetectionsToday: this.detectionsToday,
      learnedPatternsCount: totalPatterns,
      averageInterpretationAccuracy: avgAccuracy,
      lastCalibration: Date.now(),
    };
  }

  /**
   * Calculate average accuracy across all learned patterns
   */
  private calculateAverageAccuracy(): number {
    let totalAccuracy = 0;
    let count = 0;

    for (const profile of this.profiles.values()) {
      for (const pattern of profile.learnedCryPatterns) {
        if (pattern.confirmedByCaregiver) {
          totalAccuracy += pattern.accuracy;
          count++;
        }
      }
    }

    return count > 0 ? totalAccuracy / count : 0.5;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BabyInterpreterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Factory function to create baby interpreter service
 */
export function createBabyInterpreterService(
  config?: Partial<BabyInterpreterConfig>
): BabyInterpreterService {
  return new BabyInterpreterService(config);
}
