import { initContentScript } from '../utils/content-script-helper';

export default defineContentScript({
  matches: ['*://*.linkedin.com/*'],
  runAt: 'document_idle',
  main(ctx) {
    initContentScript('linkedin', ctx).catch(console.error);
  },
});
