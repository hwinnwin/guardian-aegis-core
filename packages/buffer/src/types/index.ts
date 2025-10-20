/**
 * Type definitions for Guardian buffer system.
 */

/**
 * Supported platforms for monitoring.
 */
export type Platform = 
  | 'discord' 
  | 'instagram' 
  | 'snapchat' 
  | 'tiktok' 
  | 'whatsapp' 
  | 'messenger' 
  | 'roblox' 
  | 'fortnite' 
  | 'generic';

/**
 * Threat severity levels.
 */
export type ThreatLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * User representation in interactions.
 */
export interface User {
  id: string;
  name: string;
  isAdult?: boolean;
  flagged?: boolean;
}

/**
 * Captured online interaction.
 */
export interface Interaction {
  id: string;
  text: string;
  sender: User;
  recipient?: User;
  platform: Platform;
  timestamp: number;
  metadata?: {
    imageUrl?: string;
    videoUrl?: string;
    linkUrl?: string;
    fileUrl?: string;
    attachmentType?: string;
  };
}

/**
 * Frozen buffer snapshot when threat is detected.
 */
export interface Snapshot {
  id: string;
  interactions: Interaction[];
  capturedAt: number;
  reason: string;
  threatLevel: ThreatLevel;
  triggeredBy?: string;
}

/**
 * Buffer statistics.
 */
export interface BufferStats {
  size: number;
  capacity: number;
  isFull: boolean;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
  memoryUsageBytes?: number;
}

/**
 * Configuration for rolling buffer.
 */
export interface BufferConfig {
  maxInteractions: number;
  maxDurationMs: number;
  cleanupIntervalMs?: number;
}
