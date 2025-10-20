/**
 * @lumen-guardian/buffer
 * 
 * High-performance rolling buffer system for Lumen Guardian child protection.
 * Captures and freezes the last N seconds of online interactions when threats are detected.
 * 
 * @module @lumen-guardian/buffer
 */

export * from './types';
export * from './core/interfaces';
export { CircularBuffer } from './core/circular-buffer';
export { RollingBuffer } from './core/rolling-buffer';
