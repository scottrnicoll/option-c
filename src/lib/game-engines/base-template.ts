// Base HTML template used by all game engines.
// Provides: game juice (particles, shake, combos, pop-ups),
// win/lose protocol, help button, round management, SVG helpers.

import type { ThemeConfig, GameVariant } from "./engine-types"

export function baseTemplate(config: ThemeConfig, gameContent: string, variant: GameVariant = "classic", timerSeconds: number = 45): string {
  const c = config.colors
  const isLight = config.vibe === "kawaii"
  const fontImport = config.vibe === "kawaii"
    ? "@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');"
    : config.vibe === "c64"
      ? "@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');"
      : "@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');"
  const fontFamily = config.vibe === "kawaii"
    ? "'Quicksand', sans-serif"
    : config.vibe === "c64"
      ? "'VT323', monospace"
      : "'Patrick Hand', cursive"

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title}</title>
<style>
${fontImport}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: ${c.bg};
  color: ${c.text};
  font-family: ${fontFamily};
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  user-select: none;
}

/* Layout */
.game-header {
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid ${isLight ? "#e4e4e7" : "#333"};
}
.game-title { font-size: 20px; font-weight: 700; }
.game-variant-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.game-stats { display: flex; gap: 16px; align-items: center; font-size: 14px; }
.game-area {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.game-footer {
  padding: 8px 16px;
  text-align: center;
  font-size: 13px;
  color: ${isLight ? "#71717a" : "#71717a"};
}

/* Round indicator */
.round-dots {
  display: flex; gap: 4px;
}
.round-dot {
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid ${c.accent};
  background: transparent;
}
.round-dot.done { background: ${c.accent}; }
.round-dot.current { background: ${c.primary}; border-color: ${c.primary}; }

/* Combo counter */
.combo {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px; font-weight: 700;
  color: ${c.accent};
  pointer-events: none;
  opacity: 0;
  transition: all 0.3s ease-out;
}
.combo.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* Score popup */
.score-popup {
  position: absolute;
  font-size: 18px; font-weight: 700;
  color: ${c.accent};
  pointer-events: none;
  animation: float-up 0.8s ease-out forwards;
}
@keyframes float-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-40px); }
}

/* Screen shake */
.shake { animation: shake 0.3s ease-out; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}

/* Particles */
.particle {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: particle-fly 0.6s ease-out forwards;
}
@keyframes particle-fly {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
}

/* Smooth hover for interactive elements */
button { transition: transform 0.15s, opacity 0.15s; }
button:hover:not(:disabled) { transform: scale(1.03); }
button:active:not(:disabled) { transform: scale(0.97); }

/* Draggable items */
[draggable="true"] { cursor: grab; transition: transform 0.15s, box-shadow 0.15s; }
[draggable="true"]:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
[draggable="true"]:active { cursor: grabbing; transform: scale(0.95); }

/* Fade in animation for new elements */
.fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }

/* Victory overlay */
.victory-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; z-index: 100;
}
.victory-title {
  font-size: 36px; font-weight: 700;
  color: ${c.accent};
  animation: bounce-in 0.5s ease-out;
}
.victory-sub { font-size: 16px; color: ${c.text}; opacity: 0.8; }
.victory-btn {
  padding: 12px 32px;
  background: ${c.primary};
  color: ${isLight ? "#fff" : c.bg};
  border: none; border-radius: 8px;
  font-family: ${fontFamily};
  font-size: 16px; font-weight: 700;
  cursor: pointer;
}
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Help button */
.help-btn {
  position: fixed; top: 8px; right: 8px;
  width: 28px; height: 28px;
  background: ${isLight ? "#e4e4e7" : "#333"};
  color: ${c.text};
  border: none; border-radius: 50%;
  font-size: 16px; font-weight: 700;
  cursor: pointer; z-index: 50;
}
.help-panel {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  display: none; align-items: center; justify-content: center;
  z-index: 200;
}
.help-panel.open { display: flex; }
.help-content {
  background: ${c.bg};
  border: 2px solid ${c.primary};
  border-radius: 12px;
  padding: 24px; max-width: 400px; width: 90%;
}
.help-content h3 { font-size: 18px; margin-bottom: 8px; }
.help-content p { font-size: 14px; margin-bottom: 8px; line-height: 1.5; }
.help-close {
  display: block; margin-top: 12px;
  padding: 8px 24px;
  background: ${c.primary};
  color: ${isLight ? "#fff" : c.bg};
  border: none; border-radius: 6px;
  font-family: ${fontFamily};
  font-size: 14px; cursor: pointer;
}

/* How to play intro */
.intro-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center;
  z-index: 150;
}
.intro-box {
  background: ${c.bg};
  border: 2px solid ${c.primary};
  border-radius: 12px;
  padding: 32px; max-width: 420px; width: 90%;
  text-align: center;
}
.intro-box h2 { font-size: 24px; margin-bottom: 8px; }
.intro-box p { font-size: 14px; margin-bottom: 16px; line-height: 1.5; color: ${isLight ? "#4c1d95" : "#a1a1aa"}; }
.intro-start {
  padding: 12px 32px;
  background: ${c.primary};
  color: ${isLight ? "#fff" : c.bg};
  border: none; border-radius: 8px;
  font-family: ${fontFamily};
  font-size: 18px; font-weight: 700;
  cursor: pointer;
}
</style>
</head>
<body>
<!-- Themed background decorations -->
${config.vibe === "kawaii" ? `
<div style="position: fixed; inset: 0; pointer-events: none; z-index: -1; overflow: hidden;">
  <svg width="100%" height="100%" opacity="0.1">
    <circle cx="10%" cy="20%" r="30" fill="${c.primary}"><animate attributeName="cy" values="20%;22%;20%" dur="4s" repeatCount="indefinite"/></circle>
    <circle cx="85%" cy="15%" r="20" fill="${c.secondary}"><animate attributeName="cy" values="15%;17%;15%" dur="3s" repeatCount="indefinite"/></circle>
    <circle cx="70%" cy="80%" r="25" fill="${c.accent}"><animate attributeName="cy" values="80%;82%;80%" dur="5s" repeatCount="indefinite"/></circle>
    <circle cx="20%" cy="75%" r="15" fill="${c.primary}"><animate attributeName="cy" values="75%;77%;75%" dur="3.5s" repeatCount="indefinite"/></circle>
  </svg>
</div>` : config.vibe === "c64" ? `
<div style="position: fixed; inset: 0; pointer-events: none; z-index: -1; border: 12px solid #7878F8;"></div>` : `
<div style="position: fixed; inset: 0; pointer-events: none; z-index: -1; overflow: hidden;">
  <svg width="100%" height="100%" opacity="0.04">
    <line x1="0" y1="30%" x2="100%" y2="30%" stroke="${c.secondary}" stroke-width="1" stroke-dasharray="8,12"/>
    <line x1="0" y1="60%" x2="100%" y2="60%" stroke="${c.secondary}" stroke-width="1" stroke-dasharray="8,12"/>
    <line x1="30%" y1="0" x2="30%" y2="100%" stroke="${c.secondary}" stroke-width="1" stroke-dasharray="8,12"/>
    <line x1="70%" y1="0" x2="70%" y2="100%" stroke="${c.secondary}" stroke-width="1" stroke-dasharray="8,12"/>
  </svg>
</div>`}

<button class="help-btn" onclick="document.getElementById('helpPanel').classList.add('open')">?</button>

<script>
// === GAME PROTOCOL ===
function gameWin() { window.parent.postMessage({type:'game_win'}, '*'); }
function gameLose() { window.parent.postMessage({type:'game_lose'}, '*'); }

// === GAME JUICE ===
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < (count || 8); i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = color || '${c.accent}';
    const angle = (Math.PI * 2 / (count || 8)) * i;
    const dist = 30 + Math.random() * 40;
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

function screenShake() {
  document.querySelector('.game-area')?.classList.add('shake');
  setTimeout(() => document.querySelector('.game-area')?.classList.remove('shake'), 300);
}

function showScorePopup(x, y, text) {
  const el = document.createElement('div');
  el.className = 'score-popup';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

let comboCount = 0;
function addCombo() {
  comboCount++;
  if (comboCount >= 2) {
    const el = document.getElementById('combo');
    if (el) {
      el.textContent = comboCount + 'x!';
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 800);
    }
  }
}
function resetCombo() { comboCount = 0; }

function showVictory(msg) {
  const overlay = document.createElement('div');
  overlay.className = 'victory-overlay';
  const variantLabel = '${variant === "timed" ? "⏱ Timed" : variant === "challenge" ? "💀 Challenge" : ""}';
  overlay.innerHTML = \`
    <div class="victory-title">\${msg || '${config.winMessage}'}</div>
    <div class="victory-sub">Score: \${window.gameScore || 0}\${variantLabel ? ' · ' + variantLabel : ''}</div>
    ${config.dare ? `<div style="margin-top: 8px; font-size: 14px; color: ${c.text}80; font-style: italic;">${config.dare}</div>` : ""}
    ${variant === "classic" ? `
    <div style="margin-top: 16px; display: flex; gap: 8px;">
      <div style="padding: 8px 16px; background: ${c.accent}22; border: 1px solid ${c.accent}44; border-radius: 8px; font-size: 12px; color: ${c.accent};">
        ⏱ Timed mode unlocked!
      </div>
    </div>` : variant === "timed" ? `
    <div style="margin-top: 16px; display: flex; gap: 8px;">
      <div style="padding: 8px 16px; background: #a855f722; border: 1px solid #a855f744; border-radius: 8px; font-size: 12px; color: #a855f7;">
        💀 Challenge mode unlocked!
      </div>
    </div>` : `
    <div style="margin-top: 16px; padding: 8px 16px; background: #fbbf2422; border: 1px solid #fbbf2444; border-radius: 8px; font-size: 12px; color: #fbbf24;">
      🏆 All modes complete!
    </div>`}
  \`;
  document.body.appendChild(overlay);
  spawnParticles(window.innerWidth/2, window.innerHeight/2, '${c.accent}', 20);
  spawnParticles(window.innerWidth/3, window.innerHeight/3, '${c.primary}', 12);
  spawnParticles(window.innerWidth*2/3, window.innerHeight/3, '${c.primary}', 12);
  setTimeout(() => gameWin(), 500);
}

function showDefeat(msg) {
  const overlay = document.createElement('div');
  overlay.className = 'victory-overlay';
  overlay.innerHTML = \`
    <div class="victory-title" style="color: ${c.danger}">\${msg || '${config.loseMessage}'}</div>
    <div class="victory-sub">Try again!</div>
  \`;
  document.body.appendChild(overlay);
  setTimeout(() => gameLose(), 500);
}

window.gameScore = 0;

// === TIMER (for timed variant) ===
let timerSeconds = 0;
let timerInterval = null;
let timerEl = null;
function startTimer(seconds) {
  timerSeconds = seconds;
  timerEl = document.getElementById('timerDisplay');
  if (!timerEl) return;
  timerEl.textContent = timerSeconds;
  timerEl.style.display = 'block';
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerEl) timerEl.textContent = timerSeconds;
    if (timerSeconds <= Math.ceil(seconds * 0.25)) {
      if (timerEl) { timerEl.style.color = '${c.danger}'; timerEl.style.transform = 'scale(1.1)'; }
    }
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      showDefeat('Time\\'s up!');
    }
  }, 1000);
}
function stopTimer() { if (timerInterval) clearInterval(timerInterval); }

// === FAIL TRACKER ===
// Engines can call trackFail() on wrong answers.
// After 3 fails in a round, triggers gameLose + math moment.
let failCount = 0;
const MAX_FAILS = 3;
function trackFail() {
  failCount++;
  if (failCount >= MAX_FAILS) {
    failCount = 0;
    showDefeat('${config.loseMessage}');
  }
}
function resetFails() { failCount = 0; }
</script>

${variant !== "classic" ? `<div style="position: fixed; top: 44px; left: 50%; transform: translateX(-50%); z-index: 40;">
  <span class="game-variant-badge" style="background: ${variant === "timed" ? c.accent + "22; color: " + c.accent : "#a855f722; color: #a855f7"}; border: 1px solid ${variant === "timed" ? c.accent + "44" : "#a855f744"};">
    ${variant === "timed" ? "⏱ TIMED" : "💀 CHALLENGE"}
  </span>
</div>` : ""}
<div id="combo" class="combo"></div>
<div id="timerDisplay" style="display: none; position: fixed; top: 8px; left: 50%; transform: translateX(-50%); font-size: 28px; font-weight: 700; color: ${c.accent}; z-index: 40; transition: all 0.3s;"></div>

${gameContent}

${variant === "timed" ? `
<script>
// TIMED VARIANT — wrap startGame to add countdown
const _originalStartGame = window.startGame || startGame;
window.startGame = startGame = function() {
  _originalStartGame();
  startTimer(${timerSeconds});
};
// Stop timer on victory
const _originalShowVictory = showVictory;
showVictory = function(msg) { stopTimer(); _originalShowVictory(msg); };
</script>
` : ""}

${variant === "challenge" ? `
<script>
// CHALLENGE VARIANT — harder rules applied by each engine
// Flag available for engine code to check
window.challengeMode = true;
</script>
` : ""}

</body>
</html>`
}
