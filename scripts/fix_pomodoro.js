const fs = require('fs');

let c = fs.readFileSync('js/ui/pomodoroUI.js', 'utf8');

// Replace first function
c = c.replace(
  "// Carregar MP3 para Atividade\r\nwindow.loadPomodoroActivityMp3 = function(file) {\r\n  if (!file) return;\r\n  import('../audio.js').then(({ audio }) => {\r\n    const idx = 0; // Atividade = índice 0\r\n    \r\n    audio.loadWorldMp3(idx, file).then(() => {\r\n      state.pomodoro.activityMp3 = file.name;\r\n      document.getElementById('pomodoroActivityMp3Label').textContent = file.name.slice(0, 30);\r\n    });\r\n  });\r\n};\r\n\r\n// Carregar MP3 para Pausa\r\nwindow.loadPomodoroBreakMp3 = function(file) {\r\n  if (!file) return;\r\n  import('../audio.js').then(({ audio }) => {\r\n    const idx = 1; // Descanso = índice 1\r\n    \r\n    audio.loadWorldMp3(idx, file).then(() => {\r\n      state.pomodoro.breakMp3 = file.name;\r\n      document.getElementById('pomodoroBreakMp3Label').textContent = file.name.slice(0, 30);\r\n    });\r\n  });\r\n};",
  "// Carregar MP3 para Atividade\r\nwindow.loadPomodoroActivityMp3 = async function(file) {\r\n  if (!file) return;\r\n  const { audio } = await import('../audio.js');\r\n  const idx = 0; // Atividade = índice 0\r\n  \r\n  await audio.loadWorldMp3(idx, file);\r\n  state.pomodoro.activityMp3 = file.name;\r\n  document.getElementById('pomodoroActivityMp3Label').textContent = file.name.slice(0, 30);\r\n};\r\n\r\n// Carregar MP3 para Pausa\r\nwindow.loadPomodoroBreakMp3 = async function(file) {\r\n  if (!file) return;\r\n  const { audio } = await import('../audio.js');\r\n  const idx = 1; // Descanso = índice 1\r\n  \r\n  await audio.loadWorldMp3(idx, file);\r\n  state.pomodoro.breakMp3 = file.name;\r\n  document.getElementById('pomodoroBreakMp3Label').textContent = file.name.slice(0, 30);\r\n};"
);

fs.writeFileSync('js/ui/pomodoroUI.js', c);
console.log('Done');