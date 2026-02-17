import { initContentScript } from '../utils/content-script-helper';

export default defineContentScript({
  matches: ['*://*.x.com/*', '*://*.twitter.com/*'],
  runAt: 'document_idle',
  main(ctx) {
    initContentScript('x', ctx).catch(console.error);
  },
});
