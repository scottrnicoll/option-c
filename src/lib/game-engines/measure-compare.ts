// Measure & Compare engine
// Two objects shown with measurements. Compare and pick the right one.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function measureCompareEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Compare the ${config.itemName} and pick the one that matches the question!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Two items appear with measurements. Read the question and click the correct one.</p>
    <h3>Valid moves</h3><p>• "Which is longer?" → click the one with the bigger measurement ✅</p>
    <h3>Invalid moves</h3><p>• Clicking the shorter one when asked "Which is longer?" ❌</p>
    <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
  </div>
</div>
<div class="game-header">
  <div class="game-title">${config.title}</div>
  <div class="game-stats">
    <span>Score: <strong id="scoreDisplay">0</strong></span>
    <div class="round-dots" id="roundDots"></div>
  </div>
</div>
<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 500px;">
    <div id="question" style="font-size: 18px; font-weight: 700; color: ${c.accent}; margin-bottom: 24px;"></div>
    <div style="display: flex; gap: 24px; justify-content: center;">
      <button id="optA" onclick="pickOption('A')" style="flex: 1; max-width: 200px; padding: 24px 16px; background: ${c.primary}11; border: 3px solid ${c.primary}44; border-radius: 16px; cursor: pointer; transition: all 0.2s; font-family: inherit;">
        <div style="font-size: 14px; color: ${c.text}; opacity: 0.6; margin-bottom: 4px;">Item A</div>
        <div id="valA" style="font-size: 32px; font-weight: 700; color: ${c.primary};"></div>
        <div id="barA" style="height: 8px; background: ${c.primary}; border-radius: 4px; margin-top: 12px; transition: width 0.5s;"></div>
      </button>
      <button id="optB" onclick="pickOption('B')" style="flex: 1; max-width: 200px; padding: 24px 16px; background: ${c.accent}11; border: 3px solid ${c.accent}44; border-radius: 16px; cursor: pointer; transition: all 0.2s; font-family: inherit;">
        <div style="font-size: 14px; color: ${c.text}; opacity: 0.6; margin-bottom: 4px;">Item B</div>
        <div id="valB" style="font-size: 32px; font-weight: 700; color: ${c.accent};"></div>
        <div id="barB" style="height: 8px; background: ${c.accent}; border-radius: 4px; margin-top: 12px; transition: width 0.5s;"></div>
      </button>
    </div>
    <div id="feedback" style="margin-top: 20px; font-size: 14px; min-height: 20px;"></div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, correctOption = '';
const UNITS = ['cm', 'inches', 'kg', 'lbs', 'liters', 'cups', 'meters', 'feet'];
const QUESTIONS = ['Which is bigger?', 'Which is smaller?', 'Which weighs more?', 'Which holds more?', 'Which is longer?', 'Which is shorter?'];

function pickOption(opt) {
  if (opt === correctOption) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const btn = document.getElementById('opt' + opt);
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 10);
    addCombo();
    showScorePopup(rect.left + rect.width/2, rect.top - 10, '+' + (10 * (currentRound + 1)));
    btn.style.borderColor = '${c.accent}';
    btn.style.background = '${c.accent}22';
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 600); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    const btn = document.getElementById('opt' + opt);
    btn.style.borderColor = '${c.danger}';
    setTimeout(() => { btn.style.borderColor = opt === 'A' ? '${c.primary}44' : '${c.accent}44'; }, 500);
    document.getElementById('feedback').style.color = '${c.danger}';
    document.getElementById('feedback').textContent = 'Wrong one! Look at the numbers again.';
    setTimeout(() => { document.getElementById('feedback').textContent = ''; }, 1500);
  }
}

function startRound() { resetFails();
  let maxVal;
  if (currentRound < 2) maxVal = 20;
  else if (currentRound < 4) maxVal = 100;
  else maxVal = 500;
  const valA = Math.floor(Math.random() * maxVal) + 1;
  let valB = Math.floor(Math.random() * maxVal) + 1;
  while (valB === valA) valB = Math.floor(Math.random() * maxVal) + 1;
  const unit = UNITS[Math.floor(Math.random() * UNITS.length)];
  const askBigger = Math.random() < 0.5;
  const qIdx = askBigger ? Math.floor(Math.random() * 3) * 2 : Math.floor(Math.random() * 3) * 2 + 1;
  document.getElementById('question').textContent = QUESTIONS[qIdx % QUESTIONS.length];
  document.getElementById('valA').textContent = valA + ' ' + unit;
  document.getElementById('valB').textContent = valB + ' ' + unit;
  const maxV = Math.max(valA, valB);
  document.getElementById('barA').style.width = Math.round((valA / maxV) * 100) + '%';
  document.getElementById('barB').style.width = Math.round((valB / maxV) * 100) + '%';
  if (askBigger) correctOption = valA > valB ? 'A' : 'B';
  else correctOption = valA < valB ? 'A' : 'B';
  document.getElementById('optA').style.borderColor = '${c.primary}44';
  document.getElementById('optA').style.background = '${c.primary}11';
  document.getElementById('optB').style.borderColor = '${c.accent}44';
  document.getElementById('optB').style.background = '${c.accent}11';
  document.getElementById('feedback').textContent = '';
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`

  return baseTemplate(config, gameContent, variant, 30)
}
