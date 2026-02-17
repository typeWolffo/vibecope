import { useState, useEffect } from 'react';
import { threshold, enabledPlatforms, action, sessionStats } from '../../utils/storage';
import type { FilterAction, EnabledPlatforms } from '../../utils/types';
import './App.css';

function App() {
  const [thresholdVal, setThresholdVal] = useState(50);
  const [platforms, setPlatforms] = useState<EnabledPlatforms>({
    linkedin: false,
    x: true,
  });
  const [actionVal, setActionVal] = useState<FilterAction>('collapse');
  const [filteredCount, setFilteredCount] = useState(0);
  const [version, setVersion] = useState('');

  useEffect(() => {
    threshold.getValue().then(setThresholdVal);
    enabledPlatforms.getValue().then(setPlatforms);
    action.getValue().then(setActionVal);
    sessionStats.getValue().then(setFilteredCount);

    const manifest = browser.runtime.getManifest();

    setVersion(manifest.version || '0.0.0');

    const unwatch = sessionStats.watch((val: number) => setFilteredCount(val));

    return () => unwatch();
  }, []);

  const handleThreshold = (val: number) => {
    setThresholdVal(val);
    threshold.setValue(val);
  };

  const handlePlatform = (platform: keyof EnabledPlatforms, enabled: boolean) => {
    const updated = { ...platforms, [platform]: enabled };

    setPlatforms(updated);
    enabledPlatforms.setValue(updated);
  };

  const handleAction = (val: FilterAction) => {
    setActionVal(val);
    action.setValue(val);
  };

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  return (
    <div className="deck">
      <header className="deck-header">
        <div className="deck-title">
          <span className="deck-icon">{'\u{1F402}'}</span>
          <h1>VIBECOPE</h1>
        </div>
        <span className="deck-version">v{version}</span>
      </header>

      <section className="deck-section">
        <div className="section-header">
          <span className="section-label">Sensitivity</span>
          <span className="section-value">{thresholdVal}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={thresholdVal}
          onChange={(e) => handleThreshold(Number(e.target.value))}
          className="deck-slider"
          style={{
            background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${thresholdVal}%, var(--bg-control) ${thresholdVal}%, var(--bg-control) 100%)`,
          }}
        />
        <div className="slider-labels">
          <span>Aggressive</span>
          <span>Lenient</span>
        </div>
      </section>

      <section className="deck-section">
        <div className="section-header">
          <span className="section-label">Platforms</span>
        </div>
        <div className="platform-toggles">
          <label className="toggle-row">
            <span className="toggle-switch">
              <input
                type="checkbox"
                checked={platforms.x}
                onChange={(e) => handlePlatform('x', e.target.checked)}
              />
              <span className="toggle-track" />
            </span>
            <span className={`toggle-label ${platforms.x ? 'toggle-label-active' : ''}`}>X</span>
          </label>
          <label className="toggle-row toggle-row-disabled">
            <span className="toggle-switch">
              <input type="checkbox" checked={false} disabled />
              <span className="toggle-track" />
            </span>
            <span className="toggle-label">
              LinkedIn <span className="coming-soon">soon</span>
            </span>
          </label>
        </div>
      </section>

      <section className="deck-section">
        <div className="section-header">
          <span className="section-label">Action</span>
        </div>
        <div className="segmented-group">
          {(['collapse', 'blur', 'badge'] as const).map((a) => (
            <button
              key={a}
              className={`segment ${actionVal === a ? 'segment-active' : ''}`}
              onClick={() => handleAction(a)}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="deck-section stats-section">
        <span className="stat-count">{filteredCount}</span>
        <span className="stat-desc">
          posts filtered
          <br />
          this session
        </span>
      </section>

      <button className="deck-link" onClick={openOptions}>
        Advanced settings →
      </button>
    </div>
  );
}

export default App;
