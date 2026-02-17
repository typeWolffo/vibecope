import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'VibeCope',
    description: 'Detects hustle-culture hype and AI slop in your feed',
    permissions: ['storage'],
  },
});
