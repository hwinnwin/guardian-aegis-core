/* global chrome */

export {};

declare const chrome: unknown;

chrome?.runtime?.onInstalled?.addListener?.(() => {
  console.info('[Lumen Guardian] Service worker installed');
});

chrome?.runtime?.onStartup?.addListener?.(() => {
  console.info('[Lumen Guardian] Service worker startup');
});
