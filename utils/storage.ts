import { storage } from 'wxt/utils/storage';
import type { FilterAction, EnabledPlatforms } from './types';
import type { CustomSelectorConfig } from './platforms/types';

export const threshold = storage.defineItem<number>('local:threshold', {
  fallback: 50,
});

export const enabledPlatforms = storage.defineItem<EnabledPlatforms>('local:enabledPlatforms', {
  fallback: { linkedin: false, x: true },
});

export const action = storage.defineItem<FilterAction>('local:action', {
  fallback: 'collapse',
});

export const sessionStats = storage.defineItem<number>('session:filteredCount', {
  fallback: 0,
});

export const enabledLocales = storage.defineItem<string[]>('local:enabledLocales', {
  fallback: ['en', 'pl'],
});

export const customSelectors = storage.defineItem<CustomSelectorConfig>('local:customSelectors', {
  fallback: { linkedin: [], x: [] },
});
