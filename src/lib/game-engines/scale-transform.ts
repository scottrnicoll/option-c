// Scale & Transform engine
// Object at one size. Drag a slider to resize to match the target ratio.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function scaleTransformEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Resize the ${config.itemName} to match the target size. Use the slider to scale!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>

<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>A target outline shows the size you need. Drag the slider to resize the ${config.itemName} until it matches.</p>
    <h3>Valid moves</h3>
    <p>• Target is 2x bigger → slide to 200% ✅</p>
    <p>• Target is half size → slide to 50% ✅</p>
    <h3>Invalid moves</h3>
    <p>• Target is 2x but you set 3x — too big! ❌</p>
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
    <div style="font-size: 14px; opacity: 0.6; margin-bottom: 8px;">Scale the ${config.itemName} to match the outline</div>
    <div style="font-size: 16px; font-weight: 700; color: ${c.accent}; margin-bottom: 16px;">
      Target ratio: <span id="ratioDisplay">?</span>
    </div>
    <!-- Visual area -->
    <div style="position: relative; width: 300px; height: 200px; margin: 0 auto; border: 1px solid ${c.secondary}44; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      <!-- Target outline -->
      <div id="targetShape" style="position: absolute; border: 3px dashed ${c.accent}; border-radius: 8px; opacity: 0.5; transition: all 0.2s;"></div>
      <!-- Player shape -->
      <div id="playerShape" style="position: absolute; background: ${c.primary}44; border: 3px solid ${c.primary}; border-radius: 8px; transition: all 0.1s;"></div>
    </div>
    <!-- Slider -->
    <div style="margin-top: 20px; display: flex; align-items: center; gap: 12px; justify-content: center;">
      <span style="font-size: 12px; opacity: 0.5;">Small</span>
      <input type="range" id="scaleSlider" min="25" max="300" value="100" step="5"
        style="width: 200px; accent-color: ${c.primary};"
        oninput="updateScale(this.value)">
      <span style="font-size: 12px; opacity: 0.5;">Big</span>
    </div>
    <div style="font-size: 24px; font-weight: 700; color: ${c.primary}; margin-top: 8px;">
      <span id="scalePercent">100</span>%
    </div>
    <button onclick="checkScale()" style="margin-top: 12px; padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
      Lock In
    </button>
  </div>
</div>

<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
let targetPercent = 100;
let baseSize = 60;

function updateScale(val) {
  document.getElementById('scalePercent').textContent = val;
  const size = baseSize * (val / 100);
  const player = document.getElementById('playerShape');
  player.style.width = size + 'px';
  player.style.height = size + 'px';
}

function checkScale() {
  const current = parseInt(document.getElementById('scaleSlider').value);
  const diff = Math.abs(current - targetPercent);

  if (diff <= 10) {
    window.gameScore += Math.max(5, 15 - diff) * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo();
    showScorePopup(rect.left + rect.width/2, rect.top + 50, diff === 0 ? 'Perfect!' : 'Close enough!');
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => showVictory('${config.winMessage}'), 500);
    } else {
      setTimeout(startRound, 800);
    }
  } else {
    screenShake(); resetCombo(); trackFail();
    if (current > targetPercent) showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Too big!');
    else showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Too small!');
  }
}

function startRound() { resetFails();
  // Progressive difficulty
  const ratios = currentRound < 2
    ? [50, 100, 150, 200]
    : currentRound < 4
      ? [25, 50, 75, 125, 150, 175, 200, 250]
      : [25, 40, 60, 75, 80, 120, 140, 160, 200, 250, 300];

  targetPercent = ratios[Math.floor(Math.random() * ratios.length)];
  if (targetPercent === 100) targetPercent = 150; // avoid trivial

  document.getElementById('ratioDisplay').textContent = targetPercent + '%';

  // Set target shape
  const targetSize = baseSize * (targetPercent / 100);
  const target = document.getElementById('targetShape');
  target.style.width = targetSize + 'px';
  target.style.height = targetSize + 'px';

  // Reset slider
  document.getElementById('scaleSlider').value = 100;
  updateScale(100);

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

  return baseTemplate(config, gameContent, variant, 45)
}
