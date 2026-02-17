import type { PlatformSelectors } from './types';

export const xSelectors: PlatformSelectors = {
  postContainer: ['article[data-testid="tweet"]'],
  postText: ['div[data-testid="tweetText"]'],
  feedContainer: ['div[aria-label="Home timeline"]', 'main'],
};
