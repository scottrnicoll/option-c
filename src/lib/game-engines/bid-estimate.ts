// Bid & Estimate engine
// Items shown with clues. Estimate the value. Bid. See if you're close enough.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function bidEstimateEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Estimate the value of each ${config.itemName} and place your bid. Get within 20% to win!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>An item appears with clues about its value. Type your estimate and bid. If you're within 20% of the real value, you win the round.</p>
    <h3>Valid bids</h3><p>• Real value is 50. Bidding 45 (within 20%) ✅</p>
    <h3>Invalid bids</h3><p>• Real value is 50. Bidding 30 (too far off) ❌</p>
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
  <div style="text-align: center; width: 90%; max-width: 400px;">
    <!-- Item display -->
    <div style="background: ${c.primary}11; border: 2px solid ${c.primary}; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
      <div style="font-size: 40px; margin-bottom: 8px;" id="itemIcon">🎁</div>
      <div id="clue1" style="font-size: 16px; color: ${c.text}; margin-bottom: 4px;"></div>
      <div id="clue2" style="font-size: 14px; color: ${c.text}; opacity: 0.7;"></div>
    </div>
    <!-- Bid input -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; opacity: 0.6; margin-bottom: 8px;">Your estimate</div>
      <input type="number" id="bidInput" style="width: 160px; text-align: center; font-size: 32px; font-weight: 700; background: ${c.bg}; color: ${c.text}; border: 3px solid ${c.primary}; border-radius: 12px; padding: 8px; font-family: inherit; outline: none;" placeholder="?">
    </div>
    <button onclick="placeBid()" style="padding: 12px 40px; background: ${c.accent}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 18px; font-weight: 700; cursor: pointer;">
      Bid!
    </button>
    <div id="result" style="margin-top: 16px; font-size: 16px; min-height: 24px;"></div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, realValue = 0;
const ICONS = ['💎', '🏺', '⚗️', '🗝️', '🎭'];

function placeBid() {
  const bid = parseInt(document.getElementById('bidInput').value);
  if (isNaN(bid) || bid <= 0) { showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Enter a number!'); return; }
  const diff = Math.abs(bid - realValue);
  const pct = diff / realValue;
  const result = document.getElementById('result');
  if (pct <= 0.2) {
    const points = Math.round((1 - pct) * 20) * (currentRound + 1);
    window.gameScore += points;
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo();
    result.style.color = '${c.accent}';
    result.textContent = pct === 0 ? 'Perfect! It was ' + realValue : 'Close! It was ' + realValue + '. You were ' + Math.round(pct * 100) + '% off.';
    showScorePopup(rect.left + rect.width/2, rect.top + 50, '+' + points);
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 800); }
    else { setTimeout(startRound, 1200); }
  } else {
    screenShake(); resetCombo();
    result.style.color = '${c.danger}';
    result.textContent = 'Too far! It was ' + realValue + '. You were ' + Math.round(pct * 100) + '% off.';
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].className = 'round-dot';
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showDefeat('${config.loseMessage}'), 800); }
    else { setTimeout(startRound, 1200); }
  }
}

function generateClues(value, round) {
  const lower = Math.floor(value * 0.6 / 10) * 10;
  const upper = Math.ceil(value * 1.4 / 10) * 10;
  const near = Math.round(value / 10) * 10;
  const clues = [
    'Worth between ' + lower + ' and ' + upper,
    'Closer to ' + near + ' than to ' + (near + (value > near ? -20 : 20)),
    'More than ' + (value - Math.floor(Math.random() * 15) - 5),
    'Less than ' + (value + Math.floor(Math.random() * 15) + 5),
    'Round it to the nearest 10: ' + near,
  ];
  return { clue1: clues[Math.floor(Math.random() * 3)], clue2: clues[3 + Math.floor(Math.random() * 2)] };
}

function startRound() {
  let maxVal;
  if (currentRound < 2) maxVal = 50;
  else if (currentRound < 4) maxVal = 200;
  else maxVal = 500;
  realValue = Math.floor(Math.random() * (maxVal - 10)) + 10;
  const { clue1, clue2 } = generateClues(realValue, currentRound);
  document.getElementById('clue1').textContent = clue1;
  document.getElementById('clue2').textContent = clue2;
  document.getElementById('itemIcon').textContent = ICONS[currentRound % ICONS.length];
  document.getElementById('bidInput').value = '';
  document.getElementById('result').textContent = '';
  document.getElementById('bidInput').focus();
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
document.addEventListener('keydown', (e) => { if (e.key === 'Enter') placeBid(); });
</script>`

  return baseTemplate(config, gameContent, variant, 40)
}
