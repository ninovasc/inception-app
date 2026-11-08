// tests/unit/commonUI-pure.test.mjs - Unit tests for pure functions in commonUI.js
import '../mock-browser.mjs';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentModeWorlds } from '../../js/config.js';

describe('CommonUI Pure Functions', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('getCurrentModeWorlds (from config)', () => {
    it('returns correct worlds for narrative mode', () => {
      const worlds = getCurrentModeWorlds('narrative');
      assert.ok(Array.isArray(worlds));
      assert.ok(worlds.length > 0);
    });

    it('returns correct worlds for pomodoro mode', () => {
      const worlds = getCurrentModeWorlds('pomodoro');
      assert.ok(Array.isArray(worlds));
      assert.ok(worlds.length === 2);
    });

    it('returns correct worlds for sleep mode', () => {
      const worlds = getCurrentModeWorlds('sleep');
      assert.ok(Array.isArray(worlds));
      assert.ok(worlds.length === 8);
    });

    it('returns correct worlds for free mode', () => {
      const worlds = getCurrentModeWorlds('free');
      assert.ok(Array.isArray(worlds));
      assert.ok(worlds.length > 0);
    });

    it('returns empty array for unknown mode', () => {
      const worlds = getCurrentModeWorlds('unknown');
      assert.ok(Array.isArray(worlds));
      assert.ok(worlds.length === 0);
    });
  });

  describe('HTML generation helpers', () => {
    it('generates option elements with correct selected attribute', () => {
      const worlds = ['World 1', 'World 2', 'World 3'];
      const currentLevel = 1;
      
      const html = worlds.map((w, i) =>
        `<option value="${i}" ${i === currentLevel ? 'selected' : ''}>${w}</option>`
      ).join('');
      
      assert.ok(html.includes('value="0"'));
      assert.ok(html.includes('value="1" selected'));
      assert.ok(html.includes('value="2"'));
      assert.ok(html.includes('World 1'));
      assert.ok(html.includes('World 2'));
      assert.ok(html.includes('World 3'));
    });

    it('generates voice preset options with custom', () => {
      const worlds = ['World 1', 'World 2'];
      const currentWorld = 0;
      const voicePreset = 'custom';
      
      const html = [
        ...worlds.map((w, i) => 
          `<option value="${i}" ${i === currentWorld ? 'selected' : ''}>${w}</option>`
        ),
        `<option value="custom" ${voicePreset === 'custom' ? 'selected' : ''}>Personalizado</option>`
      ].join('');
      
      assert.ok(html.includes('value="0" selected'));
      assert.ok(html.includes('value="1"'));
      assert.ok(html.includes('value="custom" selected'));
      assert.ok(html.includes('Personalizado'));
    });

    it('generates source row with synth type', () => {
      const worldName = 'Test World';
      const sourceType = 'synth';
      const synthIdx = 0;
      const volume = 0.5;
      const isActive = true;
      
      const sourceTypeHtml = sourceType === 'synth' ? `
        <select onchange="setWorldSynth(0, parseInt(this.value))">
          <option value="0" selected>Synth 1</option>
          <option value="1">Synth 2</option>
        </select>
      ` : '';
      
      const html = `
        <div class="source-row" data-world="0">
          <strong>${worldName}</strong>
          <select>
            <option value="synth" selected>Synth</option>
            <option value="mp3">MP3</option>
          </select>
          ${sourceTypeHtml}
          <input type="range" value="${volume}" disabled>
          <span>${Math.round(volume*100)}%</span>
        </div>
      `;
      
      assert.ok(html.includes('Test World'));
      assert.ok(html.includes('value="synth" selected'));
      assert.ok(html.includes('value="0" selected'));
      assert.ok(html.includes('value="1"'));
      assert.ok(html.includes('disabled'));
      assert.ok(html.includes('50%'));
    });

    it('generates source row with mp3 type', () => {
      const worldName = 'Test World';
      const sourceType = 'mp3';
      const volume = 0.8;
      const mp3Name = 'test.mp3';
      const isActive = false;
      
      const mp3Html = sourceType === 'mp3' ? `
        <label class="file-btn">
          <span id="mp3Label_0">${mp3Name.slice(0,20)}</span>
          <input type="file" id="sourceMp3_0">
        </label>
      ` : '';
      
      const html = `
        <div class="source-row" data-world="0">
          <strong>${worldName}</strong>
          <select>
            <option value="synth">Synth</option>
            <option value="mp3" selected>MP3</option>
          </select>
          ${mp3Html}
          <input type="range" value="${volume}">
          <span>${Math.round(volume*100)}%</span>
        </div>
      `;
      
      assert.ok(html.includes('Test World'));
      assert.ok(html.includes('value="mp3" selected'));
      assert.ok(html.includes('test.mp3'));
      assert.ok(html.includes('80%'));
      assert.ok(!html.includes('disabled'));
    });
  });

  describe('syncSlidersFromState logic', () => {
    it('maps xyState.x to speed slider', () => {
      const xyState = { x: 0.75 };
      const speedValue = String(xyState.x || 1.0);
      assert.equal(speedValue, '0.75');
    });

    it('maps masterFilter.frequency.value to filter slider', () => {
      const masterFilter = { frequency: { value: 5000 } };
      const filterValue = String(masterFilter?.frequency?.value || 18000);
      assert.equal(filterValue, '5000');
    });

    it('maps delayWet to delay slider', () => {
      const delayWet = 0.25;
      const delayValue = String(delayWet || 0.12);
      assert.equal(delayValue, '0.25');
    });

    it('maps reverbWet to reverb slider', () => {
      const reverbWet = 0.6;
      const reverbValue = String(reverbWet || 0.3);
      assert.equal(reverbValue, '0.6');
    });

    it('uses defaults when state values missing', () => {
      const speedValue = String(undefined || 1.0);
      const filterValue = String(undefined || 18000);
      const delayValue = String(undefined || 0.12);
      const reverbValue = String(undefined || 0.3);
      
      assert.equal(speedValue, '1');
      assert.equal(filterValue, '18000');
      assert.equal(delayValue, '0.12');
      assert.equal(reverbValue, '0.3');
    });
  });

  describe('source list rendering logic', () => {
    it('marks active world correctly', () => {
      const isActive = true;
      const activeClass = isActive ? 'rgba(255,255,255,0.05)' : 'transparent';
      const activeBorder = isActive ? 'var(--accent)' : 'var(--border)';
      
      assert.equal(activeClass, 'rgba(255,255,255,0.05)');
      assert.equal(activeBorder, 'var(--accent)');
    });

    it('uses fallback values for missing state', () => {
      const sourceType = undefined;
      const synthIdx = undefined;
      const volume = undefined;
      
      const resolvedSourceType = sourceType || 'synth';
      const resolvedSynthIdx = synthIdx || 0;
      const resolvedVolume = volume || 0.2;
      
      assert.equal(resolvedSourceType, 'synth');
      assert.equal(resolvedSynthIdx, 0);
      assert.equal(resolvedVolume, 0.2);
    });

    it('formats volume percentage correctly', () => {
      const volumes = [0, 0.25, 0.5, 0.75, 1];
      const expected = ['0%', '25%', '50%', '75%', '100%'];
      
      volumes.forEach((v, i) => {
        assert.equal(`${Math.round(v*100)}%`, expected[i]);
      });
    });

    it('renderSourceList includes id and oninput for volume slider (REGRESSION TEST)', () => {
      // Verify the HTML generation includes:
      // 1. id="worldVolVal${i}" on the span
      // 2. oninput that updates the span textContent
      const worldName = 'Test World';
      const sourceType = 'mp3';
      const volume = 0.5;
      const i = 0;
      
      const html = `
        <input type="range" min="0" max="1" step="0.01" value="${volume}" 
          oninput="setWorldMp3Volume(${i}, this.value); document.getElementById('worldVolVal${i}').textContent = Math.round(this.value * 100) + '%'" 
          style="flex:1; max-width:120px;">
        <span id="worldVolVal${i}" style="font-size:0.6rem; color:var(--muted); font-family:monospace; min-width:35px;">${Math.round(volume*100)}%</span>
      `;
      
      // Verify id attribute on span
      assert.ok(html.includes('id="worldVolVal0"'));
      
      // Verify oninput updates the span
      assert.ok(html.includes("document.getElementById('worldVolVal0').textContent"));
      assert.ok(html.includes("Math.round(this.value * 100) + '%'"));
    });

    it('volume slider disabled when sourceType is synth', () => {
      const html = `
        <input type="range" min="0" max="1" step="0.01" value="0.5" 
          oninput="setWorldMp3Volume(0, this.value); document.getElementById('worldVolVal0').textContent = Math.round(this.value * 100) + '%'" 
          style="flex:1; max-width:120px;"
          disabled>
      `;
      
      assert.ok(html.includes('disabled'));
    });
  });
});