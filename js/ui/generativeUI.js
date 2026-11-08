import { state } from '../state.js';
import { SYNTH_PRESETS, WORLD_SYNTH, WORLD_NAMES } from '../config.js';
import { getGenerativeEngine, generateSynthVariation, applyGenerativeVariation } from '../synth/generativeEngine.js';
import { t } from '../i18n.js';
import { renderSourceList } from '../ui/commonUI.js';

// Cria a interface do motor generativo
export function createGenerativeUI() {
  const container = document.createElement('div');
  container.id = 'generativeUI';
  container.style.cssText = 'display: none;'; // escondido por padrão
  
  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <!-- Toggle principal -->
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:12px;">
        <input type="checkbox" id="generativeEnabled" data-action="toggleGenerative" style="width:18px; height:18px; accent-color:#fff;">
        <span style="font-size:0.7rem; color:#fff; font-family:monospace; text-transform:uppercase; letter-spacing:1px;">${t('generative.enable') || 'IA Generativa'}</span>
        <span id="generativeBadge" style="margin-left:auto; font-size:0.55rem; color:var(--muted); font-family:monospace; background:#1a1a1a; padding:2px 6px; border-radius:4px;">${t('generative.off') || 'OFF'}</span>
      </label>
      
      <div style="font-size:0.6rem; color:var(--muted); font-family:monospace; margin-bottom:12px; line-height:1.4;">${t('generative.desc') || 'Gera variações infinitas e musicais do sintetizador atual. Ajuste a intensidade e clique em "Nova Variação" para criar; use "Salvar" para manter e "Reset" para voltar ao original.'}</div>
      
      <!-- Slider de intensidade -->
      <div class="slider-group" style="margin-bottom:10px;">
        <div class="slider-header"><span>${t('generative.variation') || 'Variação'}</span><span id="generativeVariationVal">50%</span></div>
        <input type="range" id="generativeVariation" min="0" max="100" step="1" value="50" data-action="updateGenerativeVariation">
      </div>
      
      <!-- Botões de ação -->
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px;">
        <button id="generativeNew" class="menu-item" style="flex:1; max-width:120px; justify-content:center;" data-action="generateNewVariation">
          <span>${t('generative.new') || 'Nova Variação'}</span>
        </button>
        <button id="generativeSave" class="menu-item" style="flex:1; max-width:120px; justify-content:center;" data-action="saveGenerativeVariation">
          <span>${t('generative.save') || 'Salvar'}</span>
        </button>
        <button id="generativeReset" class="menu-item" style="flex:1; max-width:120px; justify-content:center;" data-action="resetGenerative">
          <span>${t('generative.reset') || 'Reset'}</span>
        </button>
      </div>
      
      <!-- Status/Seed -->
      <div id="generativeStatus" style="margin-top:8px; font-size:0.6rem; color:var(--muted); font-family:monospace; text-align:center; min-height:1.2em;">
        ${t('generative.ready') || 'Pronto para gerar'}
      </div>
      
      <!-- Reproduzir variação por seed (opcional) -->
      <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--border);">
        <div style="font-size:0.6rem; color:var(--muted); font-family:monospace; margin-bottom:6px; width:100%;">${t('generative.seedLabel') || 'Reproduzir variação por seed (opcional):'}</div>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" id="generativeSeedInput" placeholder="${t('generative.seedPlaceholder') || 'ex: 12345'}" style="flex:1; background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:8px 10px;font-size:0.85rem;border-radius:6px;font-family:monospace;">
          <button id="generativeApplySeed" class="menu-item" style="padding:8px 16px; font-size:0.8rem; white-space:nowrap;" data-action="applyGenerativeSeed">${t('generative.applySeed') || 'Aplicar'}</button>
        </div>
        <div id="generativeCurrentSeed" style="font-size:0.55rem; color:var(--muted); font-family:monospace; margin-top:4px; width:100%;"></div>
      </div>
    </div>
  `;
  
  return container;
}

let _generativeActive = false;
let _currentVariation = null;
let _currentSeed = null;

// Ativa/desativa motor generativo
export function toggleGenerative(enabled) {
  _generativeActive = enabled;
  
  const badge = document.getElementById('generativeBadge');
  const statusEl = document.getElementById('generativeStatus');
  
  if (badge) {
    badge.textContent = enabled ? t('generative.on') : t('generative.off');
    badge.style.color = enabled ? '#0f0' : 'var(--muted)';
    badge.style.background = enabled ? '#030' : '#1a1a1a';
  }
  
  if (statusEl) {
    statusEl.textContent = enabled ? t('generative.active') : t('generative.disabled');
  }
  
  // Aplica/remove variação do synth atual
  applyGenerativeToCurrentSynth();
  
  }

// Atualiza slider de variação
export function updateGenerativeVariation(val) {
  document.getElementById('generativeVariationVal').textContent = `${val}%`;
  applyGenerativeToCurrentSynth();
}

// Gera nova variação aleatória (ou com seed específico)
export async function generateNewVariation(seed = null) {
  const statusEl = document.getElementById('generativeStatus');
  if (statusEl) statusEl.textContent = t('generative.generating');
  
  try {
    const variation = await getNewVariation(seed);
    _currentVariation = variation.variation;
    _currentSeed = variation.seed;
    
    // Atualiza UI
    if (statusEl) statusEl.textContent = t('generative.generated').replace('{seed}', variation.seed);
    const currentSeedEl = document.getElementById('generativeCurrentSeed');
    if (currentSeedEl) currentSeedEl.textContent = t('generative.currentSeed').replace('{seed}', variation.seed);
    
    // Aplica ao synth atual
    applyGenerativeToCurrentSynth();
    
    } catch (err) {
    console.error('[Generative] Erro ao gerar variação:', err);
    const statusEl = document.getElementById('generativeStatus');
    if (statusEl) statusEl.textContent = t('generative.error');
  }
}

// Obtém nova variação do motor (opcionalmente com seed específico)
async function getNewVariation(seed = null) {
  const engine = await import('../synth/generativeEngine.js').then(m => m.getGenerativeEngine());
  await engine.loadModel();
  
  // Pega synth atual
  const { state } = await import('../state.js');
  const { WORLD_SYNTH, SYNTH_PRESETS } = await import('../config.js');
  
  const synthIdx = (state.currentSynthType != null && SYNTH_PRESETS[state.currentSynthType] != null)
    ? state.currentSynthType
    : (WORLD_SYNTH[state.currentLevel] != null && SYNTH_PRESETS[WORLD_SYNTH[state.currentLevel]] != null)
      ? WORLD_SYNTH[state.currentLevel]
      : 0;
  const baseSynth = SYNTH_PRESETS[synthIdx];
  
  if (!baseSynth) throw new Error('Synth base não encontrado');
  
  // Usa seed fornecido ou gera um novo
  const finalSeed = seed || Date.now();
  
  // Prepara input para o motor
  const input = {
    baseFreqs: baseSynth.freqs,
    baseTypes: baseSynth.types,
    baseGains: baseSynth.gains,
    baseLfo: baseSynth.lfo || 0,
    pluck: baseSynth.pluck,
    pulse: baseSynth.pulse,
    noise: baseSynth.noise,
    drift: baseSynth.drift || 0,
    binaural: baseSynth.binaural || 0,
    bpm: baseSynth.bpm || 60,
    worldName: WORLD_NAMES?.[state.currentLevel] || 'Unknown',
    worldBgColor: document.body.style.backgroundColor || '#000000',
    targetMood: getCurrentMood(),
    variationIntensity: parseInt(document.getElementById('generativeVariation')?.value || 50) / 100,
    seed: finalSeed
  };
  
  const variation = await import('../synth/generativeEngine.js').then(m => m.generateSynthVariation(input, input.variationIntensity, input.seed));
  return { variation, seed: input.seed };
}

// Determina mood baseado no mundo atual
function getCurrentMood() {
  const state = state || {};
  const moodMap = {
    0: 'neutral',    // Half Remembered Dream
    1: 'energy',     // We Built Our Own World
    2: 'energy',     // Dream Is Collapsing
    3: 'focus',      // Radical Notion
    4: 'melancholy', // Old Souls
    5: 'energy',     // 528491
    6: 'energy',     // Mombasa
    7: 'focus',      // One Simple Idea
    8: 'relax',      // Dream Within a Dream
    9: 'melancholy', // Waiting for a Train
    10: 'melancholy', // Paradox
    11: 'energy',    // Time
    12: 'relax'      // Bonus Track
  };
  return moodMap[state.currentLevel] || 'neutral';
}

// Aplica variação ao synth atual
export async function applyGenerativeToCurrentSynth() {
  if (!_generativeActive || !_currentVariation) return;
  
  const { state } = await import('../state.js');
  const { SYNTH_PRESETS, WORLD_SYNTH } = await import('../config.js');
  const { applyGenerativeVariation } = await import('../synth/generativeEngine.js');
  const { audio } = await import('../audio.js');
  
  const synthIdx = (state.currentSynthType != null && SYNTH_PRESETS[state.currentSynthType] != null)
    ? state.currentSynthType
    : (WORLD_SYNTH[state.currentLevel] != null && SYNTH_PRESETS[WORLD_SYNTH[state.currentLevel]] != null)
      ? WORLD_SYNTH[state.currentLevel]
      : 0;
  const baseSynth = SYNTH_PRESETS[synthIdx];
  
  if (!baseSynth || !_currentVariation) return;
  
  const intensity = parseInt(document.getElementById('generativeVariation')?.value || 50) / 100;
  const varied = applyGenerativeVariation(baseSynth, _currentVariation, _currentVariation ? 1 : 0);
  
  // Aplica ao audio engine
  if (state.isPlaying && state.sourceMode === 'synth') {
    // Para e reinicia com novos parâmetros
    audio.stopSynth(50);
    setTimeout(() => {
      // Aplica parâmetros variados
      Object.assign(baseSynth, varied);
      audio.startSynth(0, 100);
      audio.startChordProgression();
    }, 60);
  }
}

// Salva variação atual como preset customizado
export async function saveGenerativeVariation() {
  if (!_currentVariation) {
    alert('Nenhuma variação para salvar');
    return;
  }
  
  const name = prompt('Nome para a variação:');
  if (!name) return;
  
  const { state } = await import('../state.js');
  const { SYNTH_PRESETS } = await import('../config.js');
  
  // Cria novo preset baseado no synth atual + variação
  const { applyGenerativeVariation } = await import('../synth/generativeEngine.js');
  const synthIdx = state.currentSynthType;
  const baseSynth = SYNTH_PRESETS[synthIdx];
  const intensity = parseInt(document.getElementById('generativeVariation')?.value || 50) / 100;
  const varied = applyGenerativeVariation(SYNTH_PRESETS[synthIdx], _currentVariation, intensity);
  
  const newPreset = {
    name,
    ...varied,
    // Garante campos obrigatórios
    freqs: varied.freqs,
    types: varied.types,
    gains: varied.gains,
    lfo: varied.lfo
  };
  
  // Adiciona à lista de presets (apenas na sessão atual)
  SYNTH_PRESETS.push(newPreset);
  state.currentSynthType = SYNTH_PRESETS.length - 1;
  
  // Atualiza UI
  if (typeof renderSourceList === 'function') renderSourceList();
  
  alert(`Preset "${name}" salvo!`);
}

// Reseta para original
export async function resetGenerative() {
  _currentVariation = null;
  _currentSeed = null;
  
  const statusEl = document.getElementById('generativeStatus');
  if (statusEl) statusEl.textContent = t('generative.reset');
  
  // Recarrega synth original
  const { state } = await import('../state.js');
  const { audio } = await import('../audio.js');
  const { WORLD_SYNTH, SYNTH_PRESETS } = await import('../config.js');
  
  const synthIdx = WORLD_SYNTH[state.currentLevel];
  state.currentSynthType = synthIdx;
  
  if (state.isPlaying && state.sourceMode === 'synth') {
    audio.stopSynth(50);
    setTimeout(() => audio.startSynth(0, 100), 60);
  }
  
  if (typeof renderSourceList === 'function') renderSourceList();
}

// Aplica seed manual
export function applyGenerativeSeed() {
  const seedInput = document.getElementById('generativeSeedInput');
  const seed = parseInt(seedInput?.value) || Date.now();
  
  // Gera variação usando o seed fornecido pelo usuário
  generateNewVariation(seed).then(() => {
    const statusEl = document.getElementById('generativeStatus');
    if (statusEl) statusEl.textContent = t('generative.applied').replace('{seed}', _currentSeed);
    const currentSeedEl = document.getElementById('generativeCurrentSeed');
    if (currentSeedEl) currentSeedEl.textContent = t('generative.currentSeed').replace('{seed}', _currentSeed);
  });
};

// Inicializa UI do generativo

// Inicializa UI do generativo
export function initGenerativeUI() {
  // Cria container se não existir
  if (!document.getElementById('generativeUI')) {
    const container = createGenerativeUI();
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  
  // Insere no painel de Fonte Sonora (após sourceList)
  const sourcePanel = document.getElementById('sourcePanel');
  if (sourcePanel) {
    const generativeUI = document.getElementById('generativeUI');
    if (generativeUI && !sourcePanel.contains(document.getElementById('generativeUI'))) {
      sourcePanel.appendChild(generativeUI);
    }
  }
}

// Atualiza visibilidade baseado no modo
export function updateGenerativeUIVisibility() {
  const container = document.getElementById('generativeUI');
  if (!container) return;
  
  // Mostra apenas nos modos que suportam (narrative, free, pomodoro)
  const show = ['narrative', 'free', 'pomodoro'].includes(state.currentMode);
  container.style.display = show ? 'block' : 'none';
}

// Expor funções para uso por outros módulos via import direto
// Não expostas mais em window.* para evitar poluição global