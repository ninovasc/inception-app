import { state } from '../state.js';
import { t } from '../i18n.js';
import { SYNTH_PRESETS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES } from '../config.js';
import { getCurrentModeWorlds } from '../config.js';

// ============================================================
// UI Base Comum - Funções compartilhadas entre todos os modos
// ============================================================

// Renderiza o dropdown de seleção de mundo (filtrado por modo)
export function renderWorldSelect() {
  const sel = document.getElementById('worldSelect');
  if (!sel) return;
  
  const worlds = getCurrentModeWorlds(state.currentMode);
  const currentLevel = state.currentLevel;
  
  sel.innerHTML = worlds.map((w, i) =>
    `<option value="${i}" ${i === currentLevel ? 'selected' : ''}>${w}</option>`
  ).join('');
}

// Renderiza a lista de presets de voz (filtrada por modo)
export function renderVoicePresets() {
  const sel = document.getElementById('voicePresetSelect');
  if (!sel) return;
  
  const worlds = getCurrentModeWorlds(state.currentMode);
  const currentWorld = state.currentLevel;
  
  sel.innerHTML = [
    ...worlds.map((w, i) => 
      `<option value="${i}" ${i === currentWorld ? 'selected' : ''}>${w}</option>`
    ),
    `<option value="custom" ${state.voicePreset === 'custom' ? 'selected' : ''}>${t('voice.custom') || 'Personalizado'}</option>`
  ].join('');
}

// Renderiza a lista de fontes sonoras por mundo
export function renderSourceList() {
  const container = document.getElementById('sourceList');
  if (!container) return;
  
  const worlds = getCurrentModeWorlds(state.currentMode);
  let html = '';
  
  for (let i = 0; i < worlds.length; i++) {
    const worldName = worlds[i];
    const sourceType = state.worldSourceType?.[i] || 'synth';
    const synthIdx = state.worldSynth?.[i] || 0;
    const synthName = SYNTH_PRESETS[synthIdx]?.name || `Synth ${synthIdx}`;
    const volume = state.worldVolume?.[i] || 0.2;
    const mp3Name = state.worldSources?.mp3?.[i];
    const ytLink = state.worldSources?.youtube?.[i];
    
    const isActive = i === state.currentLevel;
    
    html += `
      <div class="source-row" data-world="${i}" style="margin-bottom:8px; padding:8px; background:${isActive ? 'rgba(255,255,255,0.05)' : 'transparent'}; border-radius:6px; border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <strong style="font-size:0.75rem; color:${isActive ? 'var(--accent)' : '#fff'};">${worldName}</strong>
          <span style="font-size:0.6rem; color:var(--muted); font-family:monospace;">${isActive ? '● ATIVO' : ''}</span>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <select onchange="setSourceMode(${i}, this.value)" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:4px 8px;font-size:0.65rem;border-radius:4px;">
            <option value="synth" ${sourceType === 'synth' ? 'selected' : ''}>${t('source.synth') || 'Synth'}</option>
            <option value="mp3" ${sourceType === 'mp3' ? 'selected' : ''}>${t('source.mp3') || 'MP3'}</option>
            <option value="youtube" ${sourceType === 'youtube' ? 'selected' : ''} disabled>${t('source.youtube') || 'YouTube'}</option>
          </select>
          
          ${sourceType === 'synth' ? `
            <select onchange="setWorldSynth(${i}, parseInt(this.value))" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:4px 8px;font-size:0.65rem;border-radius:4px; flex:1;">
              ${SYNTH_PRESETS.map((s, idx) => 
                `<option value="${idx}" ${idx === synthIdx ? 'selected' : ''}>${s.name}</option>`
              ).join('')}
            </select>
          ` : ''}
          
          ${sourceType === 'mp3' ? `
            <label class="file-btn" for="sourceMp3_${i}" style="margin:0; padding:4px 8px; font-size:0.65rem; position:relative; cursor:pointer;">
              <span id="mp3Label_${i}">${mp3Name ? mp3Name.slice(0,20) : (t('source.selectMp3') || '[Selecionar MP3]')}</span><span>📁</span>
              <input type="file" id="sourceMp3_${i}" onchange="const f=this.files[0]; if(f) loadWorldMp3(${i}, f)" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:10;">
            </label>
          ` : ''}
          
          <input type="range" min="0" max="1" step="0.01" value="${volume}" 
            oninput="setWorldMp3Volume(${i}, this.value)" 
            style="flex:1; max-width:120px;"
            ${sourceType === 'synth' ? 'disabled' : ''}>
          <span style="font-size:0.6rem; color:var(--muted); font-family:monospace; min-width:35px;">${Math.round(volume*100)}%</span>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Sincroniza sliders com estado atual
export function syncSlidersFromState() {
  if (state.currentLevel >= 0) {
    const speed = document.getElementById('sliderSpeed');
    const filter = document.getElementById('sliderFilter');
    const delay = document.getElementById('sliderDelay');
    const reverb = document.getElementById('sliderReverb');
    
    if (speed) speed.value = state.xyState?.x || 1.0;
    if (filter) filter.value = state.masterFilter?.frequency?.value || 18000;
    if (delay) delay.value = state.delayWet || 0.12;
    if (reverb) reverb.value = state.reverbWet || 0.3;
  }
}

// Função principal para inicializar UI comum
export function initCommonUI() {
  renderWorldSelect();
  renderVoicePresets();
  renderSourceList();
  syncSlidersFromState();
  if (typeof window.updateTriggerIndicator === 'function') window.updateTriggerIndicator();
}