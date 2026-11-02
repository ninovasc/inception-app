// i18n - Internacionalização do PASIV Engine
// Suporta: en-US, es-ES, pt-BR

const translations = {
  'en-US': {
    // Header / Status
    'app.title': 'PASIV Engine',
    'status.stopped': 'STOPPED',
    'status.dreaming': 'DREAMING',
    'status.sensoryDeprivation': 'SENSORY DEPRIVATION',

    // Main actions
    'btn.startDream': 'Start Dream',
    'btn.kick': 'The Kick (Piaf + BRAAAM)',
    'btn.autoMode': 'Auto Mode (Sensors)',
    'sub.off': 'OFF',
    'sub.active': 'ACTIVE',
    'sub.freefall': 'Freefall',

    // Sensors
    'sensors.title': 'Sensors (On / Off)',
    'btn.mic': 'Mic',
    'btn.motion': 'Motion',
    'btn.gps': 'GPS',
    'sensorStatus.default': 'Tap a sensor to turn on or off.',
    'sensorStatus.micOn': 'Microphone on.',
    'sensorStatus.micOff': 'Microphone off.',
    'sensorStatus.motionOn': 'Gyroscope on.',
    'sensorStatus.motionOff': 'Gyroscope off.',
    'sensorStatus.gpsOn': 'GPS on and weather synced.',
    'sensorStatus.gpsOff': 'GPS off.',
    'sensorStatus.gpsDenied': 'GPS denied in iOS Settings.',
    'sensorStatus.gpsNoSupport': 'GPS not supported.',
    'sensorStatus.micDenied': 'Microphone permission denied.',

    // World Triggers
    'triggers.title': 'World Triggers',
    'triggers.desc': 'The first true trigger chooses the world (curated priority, top to bottom). Use "disabled" to ignore a trigger.',
    'trigger.active': 'active trigger: {label} → {world}',
    'trigger.none': 'active trigger: none',
    'trigger.fallbackNote': '"No trigger" is the resting world and cannot be disabled.',
    'trigger.motionThreshold': 'Motion threshold',
    'trigger.silenceThreshold': 'Silence threshold',
    'trigger.label.bonusRain': 'Heavy Rain (Mic)',
    'trigger.label.clap': 'Two Claps (Mic)',
    'trigger.label.inverted': 'Device Inverted (Gyro)',
    'trigger.label.freefall': 'Freefall (The Kick)',
    'trigger.label.motion': 'Motion (Gyro)',
    'trigger.label.vehicle': 'Vehicle (GPS)',
    'trigger.label.sessionStart': 'Session Start',
    'trigger.label.silence': 'Silence (Mic)',
    'trigger.label.rain': 'Rain (GPS)',
    'trigger.label.flat': 'Device Flat (Gyro)',
    'trigger.label.night': 'Night (GPS)',
    'trigger.label.sessionLong': 'Long Session (Reward)',
    'trigger.label.fallback': 'No Trigger',

    // Worlds
    'worlds.title': 'Worlds',

    // Voice
    'voice.title': 'Voice',
    'voice.desc': 'Each world has its own voice; Auto Mode switches together.',
    'voice.custom': 'Custom',
    'voice.gate': 'Gate',
    'voice.delay': 'Delay',
    'voice.feedback': 'Feedback',
    'voice.reverb': 'Reverb',
    'voice.dryWet': 'Dry/Wet',
    'voice.led.capturing': 'LED: capturing',
    'voice.led.silence': 'LED: silence',

    // Sound Source
    'source.title': 'Sound Source',
    'source.synth': 'Synth',
    'source.mp3': 'MP3',
    'source.youtube': 'YouTube',
    'source.selectMp3': '[Select MP3]',
    'source.noLink': '[no link]',
    'source.ytPlaceholder': 'YouTube Link',

    // Architecture params
    'params.speed': 'Speed',
    'params.filter': 'Filter',
    'params.delay': 'Delay (Echo)',
    'params.reverb': 'Reverb',

    // Mechanics
    'mechanics.title': 'Dream Mechanics',
    'mechanic.memCatcher': 'Environment Echoes',
    'mechanic.memCatcher.on': 'ON (Recording Echoes)',
    'mechanic.memCatcher.off': 'OFF',
    'mechanic.autoKick': 'Auto Kick (Freefall)',
    'mechanic.autoKick.on': 'ON (Sensor G)',
    'mechanic.autoKick.off': 'OFF',
    'mechanic.spatial3d': '3D Audio (Compass)',
    'mechanic.spatial3d.on': 'ON (3D Active)',
    'mechanic.spatial3d.off': 'OFF (Center)',
    'mechanic.lucidTimer': 'Lucid Dream Timer',
    'mechanic.lucidTimer.off': 'OFF',
    'mechanic.deprivation': 'Sensory Deprivation',
    'mechanic.deprivation.on': 'WATCHING (0/15s)',
    'mechanic.deprivation.off': 'OFF',
    'deprivation.silence': 'SILENCE ({sec}/15s)',
    'deprivation.active': 'ACTIVE (Heartbeat)',

    // Seed
    'seed.title': 'Dream Code',
    'seed.desc': 'Serializes all state into a string. Use Copy to share and Load to restore.',
    'seed.copy': 'Copy',
    'seed.load': 'Load',
    'seed.copied': 'Code copied to clipboard!',
    'seed.copiedFallback': 'Code copied (fallback).',
    'seed.invalid': 'Invalid Code format.',
    'seed.restored': 'Code restored successfully!',

    // Help Modal
    'help.title': 'PASIV Engine',
    'help.intro': 'Psychoacoustic audio engine inspired by dream levels from <em>Inception</em>. Create soundscapes, use phone sensors, and share configs via Seed.',
    'help.worlds': 'Worlds',
    'help.worlds.desc': '13 worlds named after OST tracks: Half Remembered Dream, We Built Our Own World, Dream Is Collapsing, Radical Notion, Old Souls, 528491, Mombasa, One Simple Idea, Dream Within a Dream, Waiting for a Train, Paradox, Time and Bonus Track. Each adjusts speed, filter, delay and reverb at once.',
    'help.source': 'Sound Source',
    'help.source.items': [
      '<strong>One type per world</strong>: open the world row (▶) and choose Synth or MP3. Tap the name to go to the world.',
      '<strong>Synth</strong>: 18 synthesizers — each world has its own preset, with pluck, pulse (BPM), noise, drift and binaural layers.',
      '<strong>Smart MP3</strong>: when switching worlds the music resumes from a musical random point; when it ends, it continues from another point — the whole track circulates.',
      '<strong>YouTube</strong>: temporarily unavailable in this version.',
      '<strong>Volume</strong>: each world has its own volume.',
      '<strong>Auto Mode</strong>: uses sensors to pick the best world and voice.'
    ],
    'help.autoMode': 'Auto Mode',
    'help.autoMode.desc': 'Enabled by default. Uses sensors (GPS, gyro, mic, session) to choose world and matching voice automatically, evaluating every 10s.',
    'help.triggers': 'World Triggers',
    'help.triggers.items': [
      '<strong>Exclusive priority</strong>: the 13 rules are evaluated in curated order (rare/specific first) and only the first true one chooses the world. No overlap.',
      '<strong>Curated order</strong>: Heavy Rain → Claps → Inverted → Freefall → Motion → Vehicle → Session Start → Silence → Rain → Device Flat → Night → Long Session → No Trigger.',
      '<strong>Remappable destination</strong>: each trigger can point to any world. "No Trigger" is the resting world (Half Remembered Dream) and cannot be disabled.',
      '<strong>Real easter eggs</strong>: two claps trigger 528491; very heavy rain on mic triggers Bonus Track; 20 min session grants a Time passage.',
      '<strong>Thresholds</strong>: adjust motion intensity and silence seconds that trigger the switch.',
      '<strong>Seed</strong>: chosen destinations and thresholds are saved in the Dream Code.'
    ],
    'help.kick': 'The Kick',
    'help.kick.desc': 'Triggers a brass fanfare + deep BRAAAM and descends to Waiting for a Train (the limbo station).',
    'help.sensors': 'Sensors',
    'help.sensors.items': [
      '<strong>Mic</strong>: audio input and silence detection.',
      '<strong>Gyro</strong>: modulates speed and detects freefall (Auto Kick).',
      '<strong>GPS</strong>: syncs level with weather (rain/night/day) and detects vehicle by speed.'
    ],
    'help.synths': 'Synthesizers',
    'help.synths.items': [
      '<strong>Layers</strong>: pluck (picking), pulse (beat at BPM), noise (wind/station), drift (instability) and binaural.',
      '<strong>BPM</strong>: worlds with pulse (Mombasa 120, Radical Notion 96, Waiting for a Train 100...) change chord every bar.'
    ],
    'help.mechanics': 'Dream Mechanics',
    'help.mechanics.items': [
      '<strong>Environment Echoes</strong>: records ambient echoes and projects them (sometimes reversed).',
      '<strong>Auto Kick</strong>: triggers The Kick on freefall detection.',
      '<strong>3D Audio</strong>: stereo pan controlled by compass.',
      '<strong>Lucid Timer</strong>: progressive descent to limbo station with wakeup at end.',
      '<strong>Sensory Deprivation</strong>: after 15s silence with phone face down, enters heartbeat mode.'
    ],
    'help.seed': 'Dream Code',
    'help.seed.desc': 'Serializes all state into a string. Use <em>Copy</em> to share and <em>Load</em> to restore.',
    'help.pwa': 'Installation (PWA)',
    'help.pwa.desc': 'On iOS/Android: "Add to Home Screen" to use as app, with totem (spinning top) icon and splash.',

    // Language selector
    'lang.label': 'Language',
    'lang.en': 'English (US)',
    'lang.es': 'Español',
    'lang.pt': 'Português (BR)'
  },

  'es-ES': {
    'app.title': 'PASIV Engine',
    'status.stopped': 'DETENIDO',
    'status.dreaming': 'SOÑANDO',
    'status.sensoryDeprivation': 'PRIVACIÓN SENSORIAL',

    'btn.startDream': 'Iniciar Sueño',
    'btn.kick': 'La Patada (Piaf + BRAAAM)',
    'btn.autoMode': 'Modo Automático (Sensores)',
    'sub.off': 'APAGADO',
    'sub.active': 'ACTIVO',
    'sub.freefall': 'Caída Libre',

    'sensors.title': 'Sensores (Encender / Apagar)',
    'btn.mic': 'Mic',
    'btn.motion': 'Giro',
    'btn.gps': 'GPS',
    'sensorStatus.default': 'Toca un sensor para encender o apagar.',
    'sensorStatus.micOn': 'Micrófono encendido.',
    'sensorStatus.micOff': 'Micrófono apagado.',
    'sensorStatus.motionOn': 'Giroscopio encendido.',
    'sensorStatus.motionOff': 'Giroscopio apagado.',
    'sensorStatus.gpsOn': 'GPS encendido y clima sincronizado.',
    'sensorStatus.gpsOff': 'GPS apagado.',
    'sensorStatus.gpsDenied': 'GPS denegado en Ajustes de iOS.',
    'sensorStatus.gpsNoSupport': 'GPS no soportado.',
    'sensorStatus.micDenied': 'Permiso de micrófono denegado.',

    'triggers.title': 'Gatillos de Mundo',
    'triggers.desc': 'El primer gatillo verdadero elige el mundo (prioridad curada, de arriba a abajo). Usa "desactivado" para ignorar un gatillo.',
    'trigger.active': 'gatillo activo: {label} → {world}',
    'trigger.none': 'gatillo activo: ninguno',
    'trigger.fallbackNote': '"Sin gatillo" es el mundo de reposo y no puede desactivarse.',
    'trigger.motionThreshold': 'Umbral de movimiento',
    'trigger.silenceThreshold': 'Umbral de silencio',
    'trigger.label.bonusRain': 'Lluvia Intensa (Mic)',
    'trigger.label.clap': 'Dos Palmas (Mic)',
    'trigger.label.inverted': 'Dispositivo Invertido (Giro)',
    'trigger.label.freefall': 'Caída Libre (La Patada)',
    'trigger.label.motion': 'Movimiento (Giro)',
    'trigger.label.vehicle': 'Vehículo (GPS)',
    'trigger.label.sessionStart': 'Inicio de Sesión',
    'trigger.label.silence': 'Silencio (Mic)',
    'trigger.label.rain': 'Lluvia (GPS)',
    'trigger.label.flat': 'Dispositivo Apoyado (Giro)',
    'trigger.label.night': 'Noche (GPS)',
    'trigger.label.sessionLong': 'Sesión Larga (Recompensa)',
    'trigger.label.fallback': 'Sin Gatillo',

    // Worlds
    'worlds.title': 'Mundos',

    'voice.title': 'Voz',
    'voice.desc': 'Cada mundo tiene su propia voz; el Modo Automático cambia junto.',
    'voice.custom': 'Personalizado',
    'voice.gate': 'Gate',
    'voice.delay': 'Delay',
    'voice.feedback': 'Feedback',
    'voice.reverb': 'Reverb',
    'voice.dryWet': 'Dry/Wet',
    'voice.led.capturing': 'LED: capturando',
    'voice.led.silence': 'LED: silencio',

    'source.title': 'Fuente Sonora',
    'source.synth': 'Synth',
    'source.mp3': 'MP3',
    'source.youtube': 'YouTube',
    'source.selectMp3': '[Seleccionar MP3]',
    'source.noLink': '[sin enlace]',
    'source.ytPlaceholder': 'Enlace YouTube',

    'params.speed': 'Velocidad',
    'params.filter': 'Filtro',
    'params.delay': 'Eco (Delay)',
    'params.reverb': 'Reverb',

    'mechanics.title': 'Mecánicas del Sueño',
    'mechanic.memCatcher': 'Ecos del Ambiente',
    'mechanic.memCatcher.on': 'ON (Grabando Ecos)',
    'mechanic.memCatcher.off': 'OFF',
    'mechanic.autoKick': 'Patada Automática (Caída Libre)',
    'mechanic.autoKick.on': 'ON (Sensor G)',
    'mechanic.autoKick.off': 'OFF',
    'mechanic.spatial3d': 'Audio 3D (Brújula)',
    'mechanic.spatial3d.on': 'ON (3D Activo)',
    'mechanic.spatial3d.off': 'OFF (Centro)',
    'mechanic.lucidTimer': 'Timer de Sueño Lúcido',
    'mechanic.lucidTimer.off': 'OFF',
    'mechanic.deprivation': 'Privación Sensorial (Silencio)',
    'mechanic.deprivation.on': 'VIGILANDO (0/15s)',
    'mechanic.deprivation.off': 'OFF',
    'deprivation.silence': 'SILENCIO ({sec}/15s)',
    'deprivation.active': 'ACTIVO (Latido)',

    'seed.title': 'Código del Sueño',
    'seed.desc': 'Serializa todo el estado en una cadena. Usa Copiar para compartir y Cargar para restaurar.',
    'seed.copy': 'Copiar',
    'seed.load': 'Cargar',
    'seed.copied': '¡Código copiado al portapapeles!',
    'seed.copiedFallback': 'Código copiado (fallback).',
    'seed.invalid': 'Formato de Código inválido.',
    'seed.restored': '¡Código restaurado con éxito!',

    'help.title': 'PASIV Engine',
    'help.intro': 'Motor de audio psicoacústico inspirado en los niveles de sueño de <em>Inception</em>. Crea paisajes sonoros, usa sensores del móvil y comparte configuraciones vía Seed.',
    'help.worlds': 'Mundos',
    'help.worlds.desc': '13 mundos nombrados por las pistas de la BSO: Half Remembered Dream, We Built Our Own World, Dream Is Collapsing, Radical Notion, Old Souls, 528491, Mombasa, One Simple Idea, Dream Within a Dream, Waiting for a Train, Paradox, Time y Bonus Track. Cada uno ajusta velocidad, filtro, eco y reverb de una vez.',
    'help.source': 'Fuente Sonora',
    'help.source.items': [
      '<strong>Un tipo por mundo</strong>: abre la fila del mundo (▶) y elige Synth o MP3. Toca el nombre para ir al mundo.',
      '<strong>Synth</strong>: 18 sintetizadores — cada mundo tiene su preset propio, con capas pluck, pulse (BPM), noise, drift y binaural.',
      '<strong>MP3 inteligente</strong>: al cambiar de mundo la música retoma de un punto musical aleatorio; al terminar, continúa de otro punto — la pista entera circula.',
      '<strong>YouTube</strong>: opción temporalmente indisponible en esta versión.',
      '<strong>Volumen</strong>: cada mundo tiene su propio volumen.',
      '<strong>Modo Automático</strong>: usa sensores para elegir el mejor mundo y voz.'
    ],
    'help.autoMode': 'Modo Automático',
    'help.autoMode.desc': 'Viene activado por defecto. Usa sensores (GPS, giro, mic, sesión) para elegir el mundo y la voz homónima automáticamente, evaluando cada 10s.',
    'help.triggers': 'Gatillos de Mundo',
    'help.triggers.items': [
      '<strong>Prioridad exclusiva</strong>: las 13 reglas se evalúan en orden curado (raro/específico primero) y solo la primera verdadera elige el mundo. No hay solape.',
      '<strong>Orden curada</strong>: Lluvia intensa → Palmas → Invertido → Caída libre → Movimiento → Vehículo → Inicio sesión → Silencio → Lluvia → Aparelho apoyado → Noche → Sesión larga → Sin gatillo.',
      '<strong>Destino remapeable</strong>: cada gatillo puede apuntar a cualquier mundo. "Sin gatillo" es el reposo (Half Remembered Dream) y no puede desactivarse.',
      '<strong>Easter eggs reales</strong>: dos palmas disparan el 528491; lluvia muy fuerte en mic, el Bonus Track; 20 min de sesión dan una pasada por Time.',
      '<strong>Umbrales</strong>: ajusta la intensidad de movimiento y los segundos de silencio que disparan el cambio.',
      '<strong>Seed</strong>: destinos elegidos y umbrales se guardan en el Código del Sueño.'
    ],
    'help.kick': 'La Patada (Kick)',
    'help.kick.desc': 'Dispara una fanfarria de metales + BRAAAM grave y desciende a Waiting for a Train (la estación del limbo).',
    'help.sensors': 'Sensores',
    'help.sensors.items': [
      '<strong>Mic</strong>: entrada de audio y detección de silencio.',
      '<strong>Giro</strong>: modula la velocidad y detecta caída libre (Auto-Kick).',
      '<strong>GPS</strong>: sincroniza el nivel con el clima (lluvia/noche/día) y detecta vehículo por velocidad.'
    ],
    'help.synths': 'Sintetizadores',
    'help.synths.items': [
      '<strong>Capas</strong>: pluck (punteo), pulse (golpe en BPM), noise (viento/estación), drift (inestabilidad) y binaural.',
      '<strong>BPM</strong>: mundos con pulso (Mombasa 120, Radical Notion 96, Waiting for a Train 100...) cambian de acorde cada compás.'
    ],
    'help.mechanics': 'Mecánicas del Sueño',
    'help.mechanics.items': [
      '<strong>Ecos del Ambiente</strong>: graba ecos del ambiente y los proyecta (a veces invertidos).',
      '<strong>Patada Automática</strong>: dispara La Patada al detectar caída libre.',
      '<strong>Sonido 3D</strong>: pan estéreo controlado por brújula.',
      '<strong>Timer Lúcido</strong>: descenso progresivo hasta la estación del limbo con despertar al final.',
      '<strong>Privación Sensorial</strong>: tras 15s de silencio con el móvil boca abajo, entra en modo latido.'
    ],
    'help.seed': 'Código del Sueño',
    'help.seed.desc': 'Serializa todo el estado en una cadena. Usa <em>Copiar</em> para compartir y <em>Cargar</em> para restaurar.',
    'help.pwa': 'Instalación (PWA)',
    'help.pwa.desc': 'En iOS/Android: "Añadir a Pantalla de Inicio" para usar como app, con icono y splash del tótem (peonza).',

    'lang.label': 'Idioma',
    'lang.en': 'English (US)',
    'lang.es': 'Español',
    'lang.pt': 'Português (BR)'
  },

  'pt-BR': {
    'app.title': 'PASIV Engine',
    'status.stopped': 'PARADO',
    'status.dreaming': 'SONHANDO',
    'status.sensoryDeprivation': 'PRIVAÇÃO SENSORIAL',

    'btn.startDream': 'Iniciar Sonho',
    'btn.kick': 'O Chute (Piaf + BRAAAM)',
    'btn.autoMode': 'Modo Automático (Sensores)',
    'sub.off': 'OFF',
    'sub.active': 'ATIVO',
    'sub.freefall': 'Queda Livre',

    'sensors.title': 'Sensores (Ligar / Desligar)',
    'btn.mic': 'Mic',
    'btn.motion': 'Giro',
    'btn.gps': 'GPS',
    'sensorStatus.default': 'Toque em um sensor para ligar ou desligar.',
    'sensorStatus.micOn': 'Microfone ligado.',
    'sensorStatus.micOff': 'Microfone desligado.',
    'sensorStatus.motionOn': 'Giroscópio ligado.',
    'sensorStatus.motionOff': 'Giroscópio desligado.',
    'sensorStatus.gpsOn': 'GPS ligado e clima sincronizado.',
    'sensorStatus.gpsOff': 'GPS desligado.',
    'sensorStatus.gpsDenied': 'GPS negado nos Ajustes do iOS.',
    'sensorStatus.gpsNoSupport': 'GPS não suportado.',
    'sensorStatus.micDenied': 'Permissão de microfone negada.',

    'triggers.title': 'Gatilhos de Mundo',
    'triggers.desc': 'O primeiro gatilho verdadeiro escolhe o mundo (prioridade curada, de cima para baixo). Use "desativado" para ignorar um gatilho.',
    'trigger.active': 'gatilho ativo: {label} → {world}',
    'trigger.none': 'gatilho ativo: nenhum',
    'trigger.fallbackNote': '"Sem gatilho" é o mundo de repouso e não pode ser desativado.',
    'trigger.motionThreshold': 'Limiar de movimento',
    'trigger.silenceThreshold': 'Limiar de silêncio',
    'trigger.label.bonusRain': 'Chuva Intensa (Mic)',
    'trigger.label.clap': 'Duas Palmas (Mic)',
    'trigger.label.inverted': 'Aparelho Invertido (Giro)',
    'trigger.label.freefall': 'Queda Livre (O Chute)',
    'trigger.label.motion': 'Movimento (Giro)',
    'trigger.label.vehicle': 'Veículo (GPS)',
    'trigger.label.sessionStart': 'Início da Sessão',
    'trigger.label.silence': 'Silêncio (Mic)',
    'trigger.label.rain': 'Chuva (GPS)',
    'trigger.label.flat': 'Aparelho Apoiado (Giro)',
    'trigger.label.night': 'Noite (GPS)',
    'trigger.label.sessionLong': 'Sessão Longa (Recompensa)',
    'trigger.label.fallback': 'Sem Gatilho',

    // Worlds
    'worlds.title': 'Mundos',

    'voice.title': 'Voz',
    'voice.desc': 'Cada mundo tem sua própria voz; o Modo Automático troca junto.',
    'voice.custom': 'Personalizado',
    'voice.gate': 'Gate',
    'voice.delay': 'Delay',
    'voice.feedback': 'Feedback',
    'voice.reverb': 'Reverb',
    'voice.dryWet': 'Dry/Wet',
    'voice.led.capturing': 'LED: capturando',
    'voice.led.silence': 'LED: silêncio',

    'source.title': 'Fonte Sonora',
    'source.synth': 'Synth',
    'source.mp3': 'MP3',
    'source.youtube': 'YouTube',
    'source.selectMp3': '[Selecionar MP3]',
    'source.noLink': '[sem link]',
    'source.ytPlaceholder': 'Link YouTube',

    'params.speed': 'Velocidade',
    'params.filter': 'Filtro',
    'params.delay': 'Eco (Delay)',
    'params.reverb': 'Reverb',

    'mechanics.title': 'Mecânicas do Sonho',
    'mechanic.memCatcher': 'Ecos do Ambiente',
    'mechanic.memCatcher.on': 'ON (Gravando Ecos)',
    'mechanic.memCatcher.off': 'OFF',
    'mechanic.autoKick': 'Chute Automático (Queda Livre)',
    'mechanic.autoKick.on': 'ON (Sensor G)',
    'mechanic.autoKick.off': 'OFF',
    'mechanic.spatial3d': 'Som 3D (Bússola)',
    'mechanic.spatial3d.on': 'ON (3D Ativo)',
    'mechanic.spatial3d.off': 'OFF (Centro)',
    'mechanic.lucidTimer': 'Timer de Sonho Lúcido',
    'mechanic.lucidTimer.off': 'OFF',
    'mechanic.deprivation': 'Privação Sensorial (Silêncio)',
    'mechanic.deprivation.on': 'VIGIANDO (0/15s)',
    'mechanic.deprivation.off': 'OFF',
    'deprivation.silence': 'SILÊNCIO ({sec}/15s)',
    'deprivation.active': 'ATIVO (Batimento)',

    'seed.title': 'Código do Sonho',
    'seed.desc': 'Serializa todo o estado em uma string. Use Copiar para compartilhar e Carregar para restaurar.',
    'seed.copy': 'Copiar',
    'seed.load': 'Carregar',
    'seed.copied': 'Código copiado para a área de transferência!',
    'seed.copiedFallback': 'Código copiado (fallback).',
    'seed.invalid': 'Formato de Código inválido.',
    'seed.restored': 'Código restaurado com sucesso!',

    'help.title': 'PASIV Engine',
    'help.intro': 'Motor de áudio psicoacústico inspirado nos níveis de sonho de <em>Inception</em>. Crie paisagens sonoras, use sensores do celular e compartilhe configurações via Seed.',
    'help.worlds': 'Mundos',
    'help.worlds.desc': '13 mundos nomeados pelas faixas da OST: Half Remembered Dream, We Built Our Own World, Dream Is Collapsing, Radical Notion, Old Souls, 528491, Mombasa, One Simple Idea, Dream Within a Dream, Waiting for a Train, Paradox, Time e Bonus Track. Cada um ajusta velocidade, filtro, eco e reverb de uma vez.',
    'help.source': 'Fonte Sonora',
    'help.source.items': [
      '<strong>Um tipo por mundo</strong>: abra a linha do mundo (▶) e escolha Synth ou MP3. Toque no nome para ir ao mundo.',
      '<strong>Synth</strong>: 18 sintetizadores — cada mundo tem um preset próprio, com camadas de pluck, pulse (BPM), noise, drift e binaural.',
      '<strong>MP3 inteligente</strong>: ao trocar de mundo a música retoma de um ponto aleatório (mas musical); ao terminar, continua de outro ponto — a faixa inteira circula.',
      '<strong>YouTube</strong>: opção temporariamente indisponível nesta versão.',
      '<strong>Volume</strong>: cada mundo tem seu próprio volume.',
      '<strong>Modo Automático</strong>: usa sensores para escolher o melhor mundo e voz.'
    ],
    'help.autoMode': 'Modo Automático',
    'help.autoMode.desc': 'Vem ligado por padrão. Usa sensores (GPS, giro, mic, sessão) para escolher o melhor mundo e voz homônima automaticamente, avaliando a cada 10s.',
    'help.triggers': 'Gatilhos de Mundo',
    'help.triggers.items': [
      '<strong>Prioridade exclusiva</strong>: as 13 regras são avaliadas em ordem curada (raro/específico primeiro) e só a primeira verdadeira escolhe o mundo. Não há sobreposição.',
      '<strong>Ordem curada</strong>: Chuva intensa → Palmas → Invertido → Queda livre → Movimento → Veículo → Início da sessão → Silêncio → Chuva → Aparelho apoiado → Noite → Sessão longa → Sem gatilho.',
      '<strong>Destino remapeável</strong>: cada gatilho pode apontar para qualquer mundo. "Sem gatilho" é o repouso (Half Remembered Dream) e não pode ser desativado.',
      '<strong>Easter eggs reais</strong>: duas palmas disparam o 528491; chuva muito forte no mic, o Bonus Track; 20 min de sessão rendem uma passagem pelo Time.',
      '<strong>Limiares</strong>: ajuste a intensidade de movimento e os segundos de silêncio que disparam a troca.',
      '<strong>Seed</strong>: destinos escolhidos e limiares são salvos no Código do Sonho.'
    ],
    'help.kick': 'O Chute (Kick)',
    'help.kick.desc': 'Dispara uma fanfarra de metais + BRAAAM grave e desce ao Waiting for a Train (a estação do limbo).',
    'help.sensors': 'Sensores',
    'help.sensors.items': [
      '<strong>Mic</strong>: entrada de áudio e detecção de silêncio.',
      '<strong>Giro</strong>: modula a velocidade e detecta queda livre (Auto-Kick).',
      '<strong>GPS</strong>: sincroniza o nível com o clima (chuva/noite/dia) e detecta veículo pela velocidade.'
    ],
    'help.synths': 'Sintetizadores',
    'help.synths.items': [
      '<strong>Camadas</strong>: pluck (dedilhado), pulse (batida no BPM), noise (vento/estação), drift (instabilidade) e binaural.',
      '<strong>BPM</strong>: mundos com pulso (Mombasa 120, Radical Notion 96, Waiting for a Train 100...) trocam de acorde a cada compasso.'
    ],
    'help.mechanics': 'Mecânicas do Sonho',
    'help.mechanics.items': [
      '<strong>Ecos do Ambiente</strong>: grava ecos do ambiente e os projeta (às vezes invertidos).',
      '<strong>Chute Automático</strong>: dispara O Chute ao detectar queda livre.',
      '<strong>Som 3D</strong>: pan estéreo controlado pela bússola.',
      '<strong>Timer Lúcido</strong>: descida progressiva até a estação do limbo com despertar ao fim.',
      '<strong>Privação Sensorial</strong>: após 15s de silêncio com o celular virado, entra em modo batimento.'
    ],
    'help.seed': 'Código do Sonho',
    'help.seed.desc': 'Serializa todo o estado em uma string. Use <em>Copiar</em> para compartilhar e <em>Carregar</em> para restaurar.',
    'help.pwa': 'Instalação (PWA)',
    'help.pwa.desc': 'No iOS/Android: "Adicionar à Tela de Início" para usar como app, com ícone e splash do totem (pião).',

    'lang.label': 'Idioma',
    'lang.en': 'English (US)',
    'lang.es': 'Español',
    'lang.pt': 'Português (BR)'
  }
};

// Estado atual
let currentLang = 'pt-BR';
const STORAGE_KEY = 'pasiv-lang';

// API pública
export function getLang() { return currentLang; }

export function setLang(lang) {
  if (!translations[lang]) return false;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations();
  updateLangSelector();
  return true;
}

export function t(key, params = {}) {
  const dict = translations[currentLang] || translations['pt-BR'];
  let str = dict[key] || key;
  // Interpolação simples {key}
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return str;
}

function applyTranslations() {
  // Elementos com data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translated;
    } else if (el.tagName === 'OPTION') {
      // options handled separately
    } else {
      el.innerHTML = translated;
    }
  });

  // Atualiza selects especiais (worldSelect, voicePresetSelect, trigger selects)
  updateDynamicSelects();
}

function updateDynamicSelects() {
  // worldSelect
  const worldSel = document.getElementById('worldSelect');
  if (worldSel && window.WORLD_NAMES) {
    const current = worldSel.value;
    worldSel.innerHTML = window.WORLD_NAMES.map((w, i) =>
      `<option value="${i}" ${i == current ? 'selected' : ''}>${w}</option>`
    ).join('');
    worldSel.value = current;
  }

  // voicePresetSelect
  const voiceSel = document.getElementById('voicePresetSelect');
  if (voiceSel && window.sensors?.MIC_PRESETS) {
    const current = voiceSel.value;
    const names = Object.keys(window.sensors.MIC_PRESETS);
    voiceSel.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('')
      + `<option value="custom">${t('voice.custom')}</option>`;
    voiceSel.value = current;
  }

  // trigger selects
  if (window.renderTriggerList) window.renderTriggerList();
}

function updateLangSelector() {
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = currentLang;
}

export function initI18n() {
  // Restaura idioma salvo
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && translations[saved]) currentLang = saved;

  // Cria seletor de idioma se não existir
  createLangSelector();

  // Aplica traduções iniciais
  applyTranslations();
}

function createLangSelector() {
  if (document.getElementById('langSelect')) return;

  const selector = document.createElement('div');
  selector.style.cssText = 'margin-top:8px;';
  selector.innerHTML = `
    <label style="font-size:0.65rem;color:var(--muted);margin-bottom:4px;display:block;">${t('lang.label')}</label>
    <select id="langSelect" onchange="setLang(this.value)" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:6px 8px;font-size:0.7rem;border-radius:6px;width:100%;">
      <option value="en-US">${t('lang.en')}</option>
      <option value="es-ES">${t('lang.es')}</option>
      <option value="pt-BR">${t('lang.pt')}</option>
    </select>
  `;
  // Insere no painel de sensores (ou outro local apropriado)
  const sensorPanel = document.getElementById('sensorPanel');
  if (sensorPanel) {
    sensorPanel.appendChild(selector);
  }
}

// Expor globalmente para uso inline
window.t = t;
window.setLang = setLang;
window.getLang = getLang;
window.initI18n = initI18n;