export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      console.log('VibeCope installed — storage defaults initialized via fallbacks');
    }
  });
});
