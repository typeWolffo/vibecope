import type { PlatformSelectors } from './types';
import type { Platform } from '../types';
import { linkedinSelectors } from './linkedin';
import { xSelectors } from './x';
import { customSelectors } from '../storage';

const DEFAULT_SELECTORS: Record<Platform, PlatformSelectors> = {
  linkedin: linkedinSelectors,
  x: xSelectors,
};

/**
 * Resolve selectors for a platform: custom selectors prepended to defaults.
 * Custom selectors are stored as flat string arrays (one selector per line in options UI).
 * They are prepended to postContainer fallback chain only (main use case).
 */
export async function resolveSelectors(platform: Platform): Promise<PlatformSelectors> {
  const defaults = DEFAULT_SELECTORS[platform];
  const custom = await customSelectors.getValue();
  const customForPlatform = custom[platform] ?? [];

  if (customForPlatform.length === 0) {
    return defaults;
  }

  return {
    postContainer: [...customForPlatform, ...defaults.postContainer],
    postText: defaults.postText,
    feedContainer: defaults.feedContainer,
  };
}

export function queryWithFallback(root: Element | Document, selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const el = root.querySelector(selector);

      if (el) return el;
    } catch {
      // Invalid selector — skip silently
    }
  }

  return null;
}

export function queryAllWithFallback(root: Element | Document, selectors: string[]): Element[] {
  for (const selector of selectors) {
    try {
      const els = root.querySelectorAll(selector);

      if (els.length > 0) {
        console.log(`[VibeCope] Selector hit: "${selector}" → ${els.length} elements`);

        return [...els];
      }
    } catch {
      // Invalid selector — skip silently
    }
  }

  return [];
}
