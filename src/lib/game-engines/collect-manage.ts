// Collect & Manage engine
// Items with values appear. Drag them into a bin to hit an exact target sum.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function collectManageEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Collect ${config.itemName} and drop them in the bin. Hit the exact target — not too many, not too few!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>

<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Each round shows a target number. Click ${config.itemName} to collect them. Your total must match the target exactly.</p>
    <h3>Valid moves</h3>
    <p>• Target is 15. Click items worth 8 + 7 = 15 ✅</p>
    <p>• Target is 10. Click a single item worth 10 ✅</p>
    <h3>Invalid moves</h3>
    <p>• Target is 15. Collecting 8 + 9 = 17 (too much!) ❌</p>
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
  <div style="width: 90%; max-width: 500px; text-align: center;">
    <!-- Target display -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 14px; opacity: 0.6;">Collect exactly</div>
      <div id="targetDisplay" style="font-size: 56px; font-weight: 700; color: ${c.accent};"></div>
    </div>
    <!-- Current total -->
    <div style="margin-bottom: 16px; display: flex; justify-content: center; align-items: center; gap: 12px;">
      <span style="font-size: 14px; opacity: 0.6;">You have:</span>
      <span id="currentTotal" style="font-size: 36px; font-weight: 700; color: ${c.primary};">0</span>
    </div>
    <!-- Items grid -->
    <div id="itemGrid" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 20px; min-height: 80px;">
    </div>
    <!-- Collected area -->
    <div style="border-top: 2px dashed ${c.accent}44; padding-top: 12px;">
      <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">Collected ${config.itemName}</div>
      <div id="collected" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; min-height: 50px;">
      </div>
    </div>
    <!-- Check button -->
    <div style="margin-top: 16px;">
      <button onclick="checkCollection()" style="padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
        Done!
      </button>
    </div>
  </div>
</div>

<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
let targetValue = 0;
let collectedValues = [];
let currentTotal = 0;

function createItem(value, inGrid) {
  const el = document.createElement('div');
  const size = inGrid ? 56 : 40;
  el.style.cssText = 'width: '+size+'px; height: '+size+'px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: '+(inGrid?18:14)+'px; font-weight: 700; cursor: pointer; transition: transform 0.15s, opacity 0.15s;';
  el.style.background = inGrid ? '${c.primary}' : '${c.accent}';
  el.style.color = '${config.vibe === "kawaii" ? "#fff" : c.bg}';
  el.textContent = value;
  el.dataset.value = value;

  if (inGrid) {
    el.addEventListener('click', () => collectItem(el, parseInt(el.dataset.value)));
    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.1)'; });
    el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
  } else {
    // Click to return to grid
    el.addEventListener('click', () => returnItem(el, parseInt(el.dataset.value)));
  }
  return el;
}

function collectItem(el, value) {
  collectedValues.push(value);
  currentTotal += value;
  document.getElementById('currentTotal').textContent = currentTotal;
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 150);
  // Add to collected area
  const collected = document.getElementById('collected');
  collected.appendChild(createItem(value, false));
  // Flash color based on proximity to target
  const totalEl = document.getElementById('currentTotal');
  if (currentTotal === targetValue) {
    totalEl.style.color = '${c.accent}';
  } else if (currentTotal > targetValue) {
    totalEl.style.color = '${c.danger}';
  } else {
    totalEl.style.color = '${c.primary}';
  }
}

function returnItem(el, value) {
  const idx = collectedValues.indexOf(value);
  if (idx !== -1) {
    collectedValues.splice(idx, 1);
    currentTotal -= value;
    document.getElementById('currentTotal').textContent = currentTotal;
    el.remove();
    // Add back to grid
    document.getElementById('itemGrid').appendChild(createItem(value, true));
    const totalEl = document.getElementById('currentTotal');
    totalEl.style.color = currentTotal > targetValue ? '${c.danger}' : '${c.primary}';
  }
}

function checkCollection() {
  if (currentTotal === targetValue) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo();
    showScorePopup(rect.left + rect.width/2, rect.top + 50, '+' + (10 * (currentRound + 1)));
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => showVictory('${config.winMessage}'), 500);
    } else {
      setTimeout(startRound, 800);
    }
  } else if (currentTotal > targetValue) {
    screenShake(); resetCombo(); trackFail();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Too many! Remove some.');
  } else {
    screenShake(); resetCombo(); trackFail();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Not enough! Collect more.');
  }
}

function generateRound(round) {
  let maxVal, itemCount;
  if (round < 2) { maxVal = 10; itemCount = 6; }
  else if (round < 4) { maxVal = 20; itemCount = 7; }
  else { maxVal = 30; itemCount = 8; }

  const target = Math.floor(Math.random() * (maxVal - 4)) + 5;
  const items = [];
  // Ensure at least one valid combination
  const a = Math.floor(Math.random() * (target - 1)) + 1;
  items.push(a, target - a);
  // Add distractors
  while (items.length < itemCount) {
    items.push(Math.floor(Math.random() * maxVal) + 1);
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { target, items };
}

function startRound() { resetFails();
  collectedValues = [];
  currentTotal = 0;
  document.getElementById('currentTotal').textContent = '0';
  document.getElementById('currentTotal').style.color = '${c.primary}';
  document.getElementById('collected').innerHTML = '';

  const { target, items } = generateRound(currentRound);
  targetValue = target;
  document.getElementById('targetDisplay').textContent = target;

  const grid = document.getElementById('itemGrid');
  grid.innerHTML = '';
  items.forEach(v => grid.appendChild(createItem(v, true)));

  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}

function startGame() {
  const dotsContainer = document.getElementById('roundDots');
  dotsContainer.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const dot = document.createElement('div');
    dot.className = 'round-dot';
    dotsContainer.appendChild(dot);
  }
  startRound();
}
</script>
`

  return baseTemplate(config, gameContent, variant, 50)
}
