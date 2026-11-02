// Generative Engine para Soundscapes IA
// Carrega modelo TFLite/ONNX via WebAssembly, roda inferência on-device

class GenerativeEngine {
  constructor() {
    this.model = null;
    this.session = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.inputTensor = null;
    this.outputTensors = null;
    this.inputShape = [1, 64]; // Tamanho do vetor de entrada (condicionamento)
    this.outputShape = [1, 64]; // Tamanho do vetor de saída (deltas)
  }

  // Carrega modelo TFLite via fetch + WebAssembly
  async loadModel(modelUrl = '/models/generative_synth.tflite') {
    if (this.isLoaded || this.isLoading) return this.isLoaded;
    
    this.isLoading = true;
    console.log('[GenerativeEngine] Carregando modelo:', modelUrl);
    
    try {
      // Tenta carregar via TFLite Web (tflite-web ou @tensorflow/tfjs-tflite)
      // Por enquanto, usa implementação fallback procedural
      await this._loadFallbackModel();
      this.isLoaded = true;
      this.isLoading = false;
      console.log('[GenerativeEngine] Modelo carregado com sucesso (fallback procedural)');
      return true;
    } catch (err) {
      console.error('[GenerativeEngine] Erro ao carregar modelo:', err);
      this.isLoading = false;
      return false;
    }
  }

  // Fallback procedural: gera variações usando algoritmos determinísticos baseados em seed
  // Isso funciona sem modelo ML real, mantendo a API compatível
  async _loadFallbackModel() {
    // Simula carregamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Prepara buffers de entrada/saída simulados
    this.inputTensor = new Float32Array(this.inputShape[1]);
    this.outputTensor = new Float32Array(this.outputShape[1]);
    
    // Marca como carregado
    this.session = { fallback: true };
  }

  // Gera variação para um synth base
  // input: objeto com parâmetros base + contexto
  // intensity: 0..1 (quanto aplicar da variação)
  // seed: número para reprodutibilidade
  async generateVariation(input, intensity = 0.5, seed = Date.now()) {
    if (!this.isLoaded) {
      await this.loadModel();
    }
    
    if (!this.isLoaded) {
      console.warn('[GenerativeEngine] Modelo não carregado, retornando parâmetros originais');
      return this._emptyOutput();
    }
    
    // Prepara vetor de entrada
    this._prepareInput(input, this.inputTensor);
    
    // Inferência (fallback procedural determinístico)
    const output = this._inferFallback(this.inputTensor, seed);
    
    // Converte saída para deltas aplicáveis
    return this._parseOutput(output, intensity);
  }

  // Prepara vetor de entrada normalizado
  _prepareInput(input, tensor) {
    const {
      baseFreqs = [0,0,0,0],
      baseTypes = ['sine','sine','sine','sine'],
      baseGains = [0,0,0,0],
      baseLfo = 0,
      pluck = null,
      pulse = null,
      noise = null,
      drift = 0,
      binaural = 0,
      bpm = 60,
      worldName = '',
      worldBgColor = '#000000',
      targetMood = 'neutral',
      variationIntensity = 0.5,
      seed = Date.now()
    } = input;

    // Normaliza e empacota no tensor (64 features)
    let idx = 0;
    
    // Frequências base (normalizadas 0-1, assumindo max 2000Hz)
    for (let i = 0; i < 4; i++) tensor[idx++] = Math.min(baseFreqs[i] / 2000, 1);
    
    // Tipos (one-hot aproximado: sine=0, triangle=0.25, sawtooth=0.5, square=0.75)
    const typeMap = { sine: 0, triangle: 0.25, sawtooth: 0.5, square: 0.75 };
    for (let i = 0; i < 4; i++) tensor[idx++] = typeMap[baseTypes[i]] || 0;
    
    // Gains (já 0-1)
    for (let i = 0; i < 4; i++) tensor[idx++] = Math.min(Math.max(baseGains[i], 0), 1);
    
    // LFO (0-1)
    tensor[idx++] = Math.min(Math.max(baseLfo, 0), 1);
    
    // Pluck
    tensor[idx++] = pluck ? Math.min(pluck.gain || 0, 1) : 0;
    tensor[idx++] = pluck ? Math.min((pluck.bpm || 60) / 240, 1) : 0;
    
    // Pulse
    tensor[idx++] = pulse ? Math.min(pulse.gain || 0, 1) : 0;
    tensor[idx++] = pulse ? Math.min((pulse.bpm || 60) / 240, 1) : 0;
    tensor[idx++] = pulse && pulse.offbeat ? 1 : 0;
    
    // Noise
    tensor[idx++] = noise ? Math.min(noise.gain || 0, 1) : 0;
    tensor[idx++] = noise ? Math.min((noise.freq || 500) / 5000, 1) : 0;
    
    // Drift
    tensor[idx++] = Math.min(Math.max(drift, 0), 0.1) * 10; // 0-0.1 -> 0-1
    
    // Binaural
    tensor[idx++] = Math.min(Math.max(binaural, 0), 50) / 50; // 0-50Hz -> 0-1
    
    // BPM
    tensor[idx++] = Math.min(Math.max(bpm, 30), 240) / 240;
    
    // Mood (one-hot: focus=0, relax=1, sleep=2, energy=3, melancholy=4, neutral=5)
    const moodMap = { focus: 0, relax: 1, sleep: 2, energy: 3, melancholy: 4, neutral: 5 };
    const moodIdx = moodMap[targetMood] || 5;
    for (let i = 0; i < 6; i++) tensor[idx++] = (i === moodIdx) ? 1 : 0;
    
    // World name hash (simple hash -> 0-1)
    let hash = 0;
    for (let i = 0; i < worldName.length; i++) hash = (hash * 31 + worldName.charCodeAt(i)) >>> 0;
    tensor[idx++] = (hash % 1000) / 1000;
    
    // Bg color brightness (0-1)
    const bgBrightness = this._colorBrightness(worldBgColor);
    tensor[idx++] = bgBrightness;
    
    // Variation intensity
    tensor[idx++] = Math.min(Math.max(variationIntensity, 0), 1);
    
    // Seed normalized
    tensor[idx++] = (seed % 10000) / 10000;
    
    // Pad remaining with zeros
    while (idx < this.inputShape[1]) tensor[idx++] = 0;
  }

  _colorBrightness(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0,2), 16);
    const g = parseInt(c.substr(2,2), 16);
    const b = parseInt(c.substr(4,2), 16);
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }

  // Inferência fallback determinística baseada em seed
  _inferFallback(inputTensor, seed) {
    const output = new Float32Array(this.outputShape[1]);
    
    // PRNG determinístico baseado em seed + input
    let rngState = seed >>> 0;
    const rand = () => {
      rngState = (rngState * 1664525 + 1013904223) >>> 0;
      return (rngState >>> 0) / 0x100000000;
    }
    
    // Gera deltas baseados em input + ruído determinístico
    for (let i = 0; i < this.outputShape[1]; i++) {
      // Combina features de entrada com ruído
      const inputFeature = inputTensor[i % 64] || 0;
      const noise = (rand() - 0.5) * 2; // -1 a 1
      
      // Deltas são suaves: baseados em features de entrada + ruído controlado
      output[i] = (inputFeature * 0.3 + noise * 0.7) * 0.5; // Range aprox -0.5 a 0.5
    }
    
    return output;
  }

  // Converte saída do modelo para deltas aplicáveis
  _parseOutput(outputTensor, intensity) {
    const t = Math.min(Math.max(intensity, 0), 1);
    const out = {};
    
    let idx = 0;
    
    // Freq deltas (4 valores, semitons)
    out.freqDeltas = [];
    for (let i = 0; i < 4; i++) {
      out.freqDeltas.push(output[i] * 12 * intensity); // max +/-12 semitons
    }
    idx = 4;
    
    // Gain deltas (4 valores, dB)
    out.gainDeltas = [];
    for (let i = 0; i < 4; i++) {
      out.gainDeltas.push(output[idx++] * 12 * intensity); // max +/-12dB
    }
    
    // Type changes (opcional - raramente muda)
    out.typeChanges = null; // Por enquanto não muda tipos
    
    // LFO delta
    out.lfoDelta = output[idx++] * intensity;
    
    // Pluck
    out.pluck = {
      gainDelta: output[idx++] * intensity,
      bpmDelta: output[idx++] * intensity
    };
    
    // Pulse
    out.pulse = {
      gainDelta: output[idx++] * intensity,
      bpmDelta: output[idx++] * intensity,
      offbeatFlip: output[idx++] > 0.5
    };
    
    // Noise
    out.noise = {
      gainDelta: output[idx++] * intensity,
      freqDelta: output[idx++] * intensity
    };
    
    // Drift
    out.driftDelta = output[idx++] * intensity;
    
    // Binaural
    out.binauralDelta = output[idx++] * intensity;
    
    // BPM
    out.bpmDelta = output[idx++] * intensity;
    
    // Metadados
    out.confidence = 0.8; // Fallback tem confiança média
    out.variationHash = this._hashVariation(output);
    
    return out;
  }

  _hashVariation(output) {
    let hash = 0;
    for (let i = 0; i < output.length; i++) {
      hash = (hash * 31 + Math.round(output[i] * 1000)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  _emptyOutput() {
    return {
      freqDeltas: [0,0,0,0],
      gainDeltas: [0,0,0,0],
      typeChanges: null,
      lfoDelta: 0,
      pluck: { gainDelta: 0, bpmDelta: 0 },
      pulse: { gainDelta: 0, bpmDelta: 0, offbeatFlip: false },
      noise: { gainDelta: 0, freqDelta: 0 },
      driftDelta: 0,
      binauralDelta: 0,
      bpmDelta: 0,
      confidence: 0,
      variationHash: '00000000'
    };
  }

  // Gera variação com seed específica (para reprodutibilidade)
  async generateWithSeed(input, intensity, seed) {
    return this.generateVariation(input, intensity, seed);
  }

  // Verifica se modelo está pronto
  ready() {
    return this.isLoaded;
  }
}

// Singleton global
let _generativeEngine = null;

export function getGenerativeEngine() {
  if (!_generativeEngine) {
    _generativeEngine = new GenerativeEngine();
  }
  return _generativeEngine;
}

export async function initGenerativeEngine(modelUrl) {
  const engine = getGenerativeEngine();
  return engine.loadModel(modelUrl);
}

export async function generateSynthVariation(synthConfig, intensity, seed) {
  const engine = getGenerativeEngine();
  return engine.generateVariation(synthConfig, intensity, seed);
}

export function applyGenerativeVariation(baseSynth, variation, intensity) {
  const t = Math.min(Math.max(intensity, 0), 1);
  const v = variation;
  
  return {
    freqs: baseSynth.freqs.map((f, i) => f * Math.pow(2, v.freqDeltas[i] * t / 12)),
    gains: baseSynth.gains.map((g, i) => g * Math.pow(10, v.gainDeltas[i] * t / 20)),
    types: v.typeChanges?.map((nt, i) => nt || baseSynth.types[i]) || baseSynth.types,
    lfo: baseSynth.lfo + v.lfoDelta * t,
    pluck: baseSynth.pluck ? {
      gain: Math.max(0, baseSynth.pluck.gain + v.pluck.gainDelta * t),
      bpm: Math.max(1, baseSynth.pluck.bpm + v.pluck.bpmDelta * t)
    } : undefined,
    pulse: baseSynth.pulse ? {
      gain: Math.max(0, baseSynth.pulse.gain + v.pulse.gainDelta * t),
      bpm: Math.max(1, baseSynth.pulse.bpm + v.pulse.bpmDelta * t),
      offbeat: v.pulse.offbeatFlip !== undefined ? v.pulse.offbeatFlip : baseSynth.pulse.offbeat
    } : undefined,
    noise: baseSynth.noise ? {
      gain: Math.max(0, baseSynth.noise.gain + v.noise.gainDelta * t),
      freq: Math.max(1, baseSynth.noise.freq + v.noise.freqDelta * t)
    } : undefined,
    drift: Math.max(0, baseSynth.drift + v.driftDelta * t),
    binaural: Math.max(0, baseSynth.binaural + v.binauralDelta * t),
    bpm: Math.max(1, baseSynth.bpm + v.bpmDelta * t)
  };
}