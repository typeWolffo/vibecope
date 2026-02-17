import type { PlatformSelectors } from './types';

export const linkedinSelectors: PlatformSelectors = {
  postContainer: [
    'div[role="listitem"]',
    'div[data-view-name="feed-full-update"]',
    'div[componentkey*="FeedType_MAIN_FEED_RELEVANCE"]',
  ],
  postText: ['p[data-view-name="feed-commentary"]', 'span[data-testid="expandable-text-box"]'],
  feedContainer: ['div[data-testid="mainFeed"]', 'main'],
};
