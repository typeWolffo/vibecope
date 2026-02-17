import { useState, useEffect } from 'react';
import { customSelectors } from '../../utils/storage';
import type { CustomSelectorConfig, PlatformSelectors } from '../../utils/platforms/types';
import type { Platform } from '../../utils/types';
import { xSelectors } from '../../utils/platforms/x';
import './style.css';

const PLATFORMS: Platform[] = ['x'];

const DEFAULT_SELECTORS: Record<string, PlatformSelectors> = {
  x: xSelectors,
};

const SELECTOR_FIELDS = [
  { key: 'postContainer', label: 'Post Container' },
  { key: 'postText', label: 'Post Text' },
  { key: 'feedContainer', label: 'Feed Container' },
] as const;

function App() {
  const [activeTab, setActiveTab] = useState<Platform>('x');
  const [custom, setCustom] = useState<CustomSelectorConfig>({
    linkedin: [],
    x: [],
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    customSelectors.getValue().then(setCustom);
  }, []);

  const handleCustomChange = (platform: Platform, value: string) => {
    const selectors = value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = { ...custom, [platform]: selectors };

    setCustom(updated);
    customSelectors.setValue(updated);
  };

  const handleReset = (platform: Platform) => {
    const updated = { ...custom, [platform]: [] };

    setCustom(updated);
    customSelectors.setValue(updated);
  };

  const handleTest = async (selector: string) => {
    if (!selector.trim()) {
      setTestResult('Enter a selector first');

      return;
    }

    try {
      document.querySelector(selector);
    } catch {
      setTestResult(`Invalid CSS selector: "${selector}"`);

      return;
    }

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        setTestResult('No active tab found');

        return;
      }

      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (sel: string) => document.querySelectorAll(sel).length,
        args: [selector],
      });

      const count = results?.[0]?.result ?? 0;

      setTestResult(`Found ${count} element${count !== 1 ? 's' : ''} matching "${selector}"`);
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const defaults = DEFAULT_SELECTORS[activeTab];

  return (
    <div className="options">
      <header className="opts-header">
        <h1>{'\u{1F402}'} VibeCope Settings</h1>
      </header>

      <section className="opts-section">
        <h2>Custom Selectors</h2>
        <p className="opts-hint">
          Override default DOM selectors when platforms change their layout. Custom selectors have
          priority over defaults (prepended to fallback chain).
        </p>

        <div className="opts-tabs">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              className={`opts-tab ${activeTab === p ? 'opts-tab-active' : ''}`}
              onClick={() => {
                setActiveTab(p);
                setTestResult(null);
              }}
            >
              {p === 'x' ? 'X' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="opts-tab-content">
          <div className="opts-fields">
            {SELECTOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="opts-field">
                <label>{label}</label>
                <div className="opts-defaults">Default: {defaults[key].join(', ') || 'none'}</div>
                {key === 'postContainer' ? (
                  <>
                    <textarea
                      rows={3}
                      placeholder="One custom selector per line..."
                      value={custom[activeTab].join('\n')}
                      onChange={(e) => handleCustomChange(activeTab, e.target.value)}
                    />
                    <div className="opts-test-row">
                      <button
                        className="btn-outline"
                        onClick={() => handleTest(custom[activeTab][0] || defaults[key][0])}
                      >
                        Test on current tab
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="opts-readonly">
                    Using defaults (override not yet supported for {label.toLowerCase()})
                  </div>
                )}
              </div>
            ))}
          </div>

          {testResult && <div className="opts-test-result">{testResult}</div>}

          <button className="btn-danger" onClick={() => handleReset(activeTab)}>
            Reset {activeTab} to defaults
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
