import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import type { Platform, FilterAction } from './types';
import type { PlatformSelectors } from './platforms/types';
import { resolveSelectors, queryWithFallback, queryAllWithFallback } from './platforms/resolver';
import { initPatterns, watchLocaleChanges } from './scoring/patterns';
import { scorePost } from './scoring/engine';
import { applyOverlay, removeOverlay, isProcessed } from './ui/overlay';
import { threshold, enabledPlatforms, action, customSelectors } from './storage';

const state = {
  currentThreshold: 50,
  currentAction: 'collapse' as FilterAction,
  currentSelectors: null as PlatformSelectors | null,
  platformEnabled: true,
  activeObserver: null as MutationObserver | null,
  observerTarget: null as Element | null,
};

function processPost(postEl: HTMLElement, selectors: PlatformSelectors): void {
  if (isProcessed(postEl)) return;

  const textEl = queryWithFallback(postEl, selectors.postText);
  const text = textEl?.textContent?.trim();

  if (!text) {
    console.log('[VibeCope] Post found but no text extracted', postEl);

    return;
  }

  const result = scorePost(text);

  console.log(`[VibeCope] Score: ${result.score}/${state.currentThreshold}`, {
    text: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
    reasons: result.reasons,
  });

  if (result.score >= state.currentThreshold) {
    console.log(`[VibeCope] FILTERED — applying ${state.currentAction}`);
    applyOverlay(postEl, result, state.currentAction);
  }
}

function scanExistingPosts(selectors: PlatformSelectors): void {
  const posts = queryAllWithFallback(document, selectors.postContainer);

  console.log(`[VibeCope] Scanning ${posts.length} posts`);

  if (posts.length === 0) {
    const feedEl = state.observerTarget ?? document.querySelector('main');

    console.warn('[VibeCope] 0 posts found. Feed children:', feedEl?.children.length ?? 'N/A');
    console.warn('[VibeCope] Tried selectors:', selectors.postContainer);

    for (const testSel of [
      'div[role="listitem"]',
      'div[data-view-name="feed-full-update"]',
      '[componentkey*="FeedType"]',
      '[data-component-type="LazyColumn"]',
      'article',
      'div[data-urn]',
    ]) {
      try {
        const count = document.querySelectorAll(testSel).length;

        if (count > 0) console.warn(`[VibeCope] DIAGNOSTIC: "${testSel}" → ${count} matches`);
      } catch {
        /* skip invalid */
      }
    }
  }

  for (const post of posts) {
    processPost(post as HTMLElement, selectors);
  }
}

function pauseObserver(): void {
  state.activeObserver?.disconnect();
}

function resumeObserver(): void {
  if (state.activeObserver && state.observerTarget) {
    state.activeObserver.observe(state.observerTarget, { childList: true, subtree: true });
  }
}

function reprocessVisiblePosts(selectors: PlatformSelectors): void {
  pauseObserver();
  const posts = queryAllWithFallback(document, selectors.postContainer);

  for (const post of posts) {
    if (isProcessed(post)) removeOverlay(post as HTMLElement);

    processPost(post as HTMLElement, selectors);
  }

  resumeObserver();
}

/**
 * Wait for an element matching selectors to appear (SPA feeds load async).
 */
function waitForElement(selectors: string[], timeout = 10000): Promise<Element | null> {
  const existing = queryWithFallback(document, selectors);

  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      obs.disconnect();
      console.warn(`[VibeCope] Timed out waiting for: ${selectors.join(', ')}`);
      resolve(null);
    }, timeout);

    const obs = new MutationObserver(() => {
      const el = queryWithFallback(document, selectors);

      if (el) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });
  });
}

function createFeedObserver(
  ctx: ContentScriptContext,
  feedEl: Element,
  selectors: PlatformSelectors,
): void {
  // MutationObserver — catches non-scroll DOM changes
  const mutFlag = { scheduled: false };
  const observer = new MutationObserver(() => {
    if (mutFlag.scheduled) return;

    mutFlag.scheduled = true;
    requestAnimationFrame(() => {
      mutFlag.scheduled = false;

      if (!state.platformEnabled) return;

      scanExistingPosts(selectors);
    });
  });

  state.activeObserver = observer;
  state.observerTarget = feedEl;
  observer.observe(feedEl, { childList: true, subtree: true });
  console.log('[VibeCope] MutationObserver active on', feedEl);

  /**
   *
   * TODO: find better way to detect infinite scroll (virtual scroll won't trigger mutations reliably - Linkedin)
   *
   */

  // Scroll listener — main trigger for infinite scroll (virtual scroll won't fire mutations reliably)
  const scrollFlag = { scheduled: false };
  const onScroll = () => {
    if (scrollFlag.scheduled || !state.platformEnabled) return;

    scrollFlag.scheduled = true;
    setTimeout(() => {
      scrollFlag.scheduled = false;
      scanExistingPosts(selectors);
    }, 300);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  console.log('[VibeCope] Scroll listener active');

  ctx.onInvalidated(() => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
    state.activeObserver = null;
    state.observerTarget = null;
  });
}

function setupStorageWatchers(platform: Platform): void {
  threshold.watch((val) => {
    state.currentThreshold = val;

    if (state.currentSelectors) reprocessVisiblePosts(state.currentSelectors);
  });

  action.watch((val) => {
    state.currentAction = val;

    if (state.currentSelectors) reprocessVisiblePosts(state.currentSelectors);
  });

  enabledPlatforms.watch((val) => {
    state.platformEnabled = val[platform];

    if (!state.platformEnabled && state.currentSelectors) {
      pauseObserver();
      const posts = queryAllWithFallback(document, state.currentSelectors.postContainer);

      for (const post of posts) {
        if (isProcessed(post)) removeOverlay(post as HTMLElement);
      }

      resumeObserver();
    } else if (state.platformEnabled && state.currentSelectors) {
      scanExistingPosts(state.currentSelectors);
    }
  });

  customSelectors.watch(async () => {
    state.currentSelectors = await resolveSelectors(platform);
    reprocessVisiblePosts(state.currentSelectors);
  });

  watchLocaleChanges();
}

export async function initContentScript(
  platform: Platform,
  ctx: ContentScriptContext,
): Promise<void> {
  console.log(`[VibeCope] Content script loaded on ${platform}`);

  const [thresholdVal, actionVal, platforms] = await Promise.all([
    threshold.getValue(),
    action.getValue(),
    enabledPlatforms.getValue(),
  ]);

  state.currentThreshold = thresholdVal;
  state.currentAction = actionVal;
  state.platformEnabled = platforms[platform];

  if (!state.platformEnabled) {
    console.log(`[VibeCope] ${platform} is disabled, skipping`);

    return;
  }

  console.log(
    `[VibeCope] Initializing on ${platform} (threshold: ${state.currentThreshold}, action: ${state.currentAction})`,
  );

  await initPatterns();
  console.log('[VibeCope] Patterns compiled');

  state.currentSelectors = await resolveSelectors(platform);
  console.log('[VibeCope] Selectors:', state.currentSelectors);

  // Wait for feed container (SPA — may not exist at document_idle)
  const feedEl = await waitForElement(state.currentSelectors.feedContainer);

  if (!feedEl) {
    console.warn('[VibeCope] Feed container never appeared, aborting');

    return;
  }

  console.log('[VibeCope] Feed container found:', feedEl);

  scanExistingPosts(state.currentSelectors);
  createFeedObserver(ctx, feedEl, state.currentSelectors);
  setupStorageWatchers(platform);
}
