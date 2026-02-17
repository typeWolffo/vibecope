import type { FilterAction, ScoringResult } from '../types';
import { sessionStats } from '../storage';

const ATTR = 'data-vibecope';
const PROCESSED = 'processed';
const REVEALED = 'revealed';

export function isProcessed(el: Element): boolean {
  return el.getAttribute(ATTR) === PROCESSED || el.getAttribute(ATTR) === REVEALED;
}

export function markProcessed(el: Element): void {
  el.setAttribute(ATTR, PROCESSED);
}

function createCollapseOverlay(result: ScoringResult): HTMLElement {
  const bar = document.createElement('div');

  bar.className = 'vibecope-collapse';
  bar.style.cssText = `
    padding: 10px 14px;
    background: #1a1a2e;
    color: #e0e0e0;
    border-left: 3px solid #e94560;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 4px 0;
    user-select: none;
  `;
  bar.textContent = `\u{1F402} VibeCope: Hustle hype detected (score: ${result.score}) \u2014 click to reveal`;
  bar.title = result.reasons.join('\n');

  return bar;
}

function createBlurOverlay(result: ScoringResult): HTMLElement {
  const overlay = document.createElement('div');

  overlay.className = 'vibecope-blur-overlay';
  overlay.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(0,0,0,0.15);
    cursor: pointer;
    z-index: 10;
    border-radius: 4px;
  `;
  const label = document.createElement('span');

  label.style.cssText = `
    background: #1a1a2e;
    color: #e0e0e0;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    pointer-events: none;
  `;
  label.textContent = `\u{1F402} VibeCope: Hustle hype detected (score: ${result.score}) \u2014 click to reveal`;
  overlay.appendChild(label);
  overlay.title = result.reasons.join('\n');

  return overlay;
}

function createBadge(result: ScoringResult): HTMLElement {
  const badge = document.createElement('div');

  badge.className = 'vibecope-badge';
  badge.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: #e94560;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-weight: 600;
    z-index: 10;
    cursor: default;
    user-select: none;
  `;
  badge.textContent = `\u{1F402} ${result.score}`;
  badge.title = result.reasons.join('\n');

  return badge;
}

export function applyOverlay(
  postEl: HTMLElement,
  result: ScoringResult,
  filterAction: FilterAction,
): void {
  markProcessed(postEl);

  switch (filterAction) {
    case 'collapse': {
      const bar = createCollapseOverlay(result);

      postEl.dataset.vibecopeOrigDisplay = postEl.style.display;
      postEl.dataset.vibecopeOrigOverflow = postEl.style.overflow;
      postEl.dataset.vibecopeOrigHeight = postEl.style.height;

      postEl.style.overflow = 'hidden';
      postEl.style.height = '0';
      postEl.style.display = 'none';
      postEl.parentElement?.insertBefore(bar, postEl);

      bar.addEventListener('click', () => {
        postEl.style.display = postEl.dataset.vibecopeOrigDisplay || '';
        postEl.style.overflow = postEl.dataset.vibecopeOrigOverflow || '';
        postEl.style.height = postEl.dataset.vibecopeOrigHeight || '';
        postEl.setAttribute(ATTR, REVEALED);
        bar.remove();
      });
      break;
    }

    case 'blur': {
      const computedPosition = getComputedStyle(postEl).position;

      if (computedPosition === 'static') {
        postEl.style.position = 'relative';
      }

      const overlay = createBlurOverlay(result);

      postEl.appendChild(overlay);

      overlay.addEventListener('click', () => {
        if (computedPosition === 'static') {
          postEl.style.position = '';
        }

        postEl.setAttribute(ATTR, REVEALED);
        overlay.remove();
      });
      break;
    }

    case 'badge': {
      const computedPosition = getComputedStyle(postEl).position;

      if (computedPosition === 'static') {
        postEl.style.position = 'relative';
      }

      const badge = createBadge(result);

      postEl.appendChild(badge);
      break;
    }
  }

  sessionStats.getValue().then((count) => sessionStats.setValue(count + 1));
}

export function removeOverlay(postEl: HTMLElement): void {
  const prevSibling = postEl.previousElementSibling;

  if (prevSibling?.classList.contains('vibecope-collapse')) {
    postEl.style.display = postEl.dataset.vibecopeOrigDisplay || '';
    postEl.style.overflow = postEl.dataset.vibecopeOrigOverflow || '';
    postEl.style.height = postEl.dataset.vibecopeOrigHeight || '';
    prevSibling.remove();
  }

  const blurOverlay = postEl.querySelector('.vibecope-blur-overlay');

  if (blurOverlay) {
    blurOverlay.remove();
  }

  const badge = postEl.querySelector('.vibecope-badge');

  if (badge) {
    badge.remove();
  }

  postEl.removeAttribute(ATTR);
}
