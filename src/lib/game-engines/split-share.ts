// Split & Share engine
// A shape/bar is shown. Click to divide it into equal parts matching a target fraction.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function splitShareEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Split the ${config.itemName} into equal parts to match the target fraction!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel"><div class="help-content">
  <h3>How to play</h3><p>Click on the bar to add cut lines. Divide it into equal parts. Then click the parts that should be shaded to match the fraction.</p>
  <h3>Example</h3><p>• For 2/4: cut the bar into 4 equal parts, then shade 2 of them ✅</p>
  <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
</div></div>
<div class="game-header"><div class="game-title">${config.title}</div>
  <div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div>
</div>
<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 500px;">
    <div style="font-size: 14px; opacity: 0.6; margin-bottom: 8px;">Show this fraction</div>
    <div id="fractionDisplay" style="font-size: 48px; font-weight: 700; color: ${c.accent}; margin-bottom: 20px;"></div>
    <!-- Bar to split -->
    <div style="position: relative; margin: 0 auto; margin-bottom: 16px;">
      <div id="bar" style="display: flex; height: 60px; border: 3px solid ${c.primary}; border-radius: 8px; overflow: hidden; cursor: pointer;"></div>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 12px;">
      <span style="font-size: 13px; opacity: 0.6;">Cuts: <strong id="cutCount">0</strong></span>
      <span style="font-size: 13px; opacity: 0.6;">Shaded: <strong id="shadeCount">0</strong></span>
    </div>
    <div style="display: flex; gap: 8px; justify-content: center;">
      <button onclick="addCut()" style="padding: 8px 20px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; cursor: pointer;">+ Add Cut</button>
      <button onclick="removeCut()" style="padding: 8px 20px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; cursor: pointer;">− Remove Cut</button>
      <button onclick="checkFraction()" style="padding: 8px 24px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer;">Check!</button>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, targetNum = 0, targetDen = 0, cuts = 0, shaded = new Set();

function renderBar() {
  const bar = document.getElementById('bar');
  bar.innerHTML = '';
  const parts = cuts + 1;
  for (let i = 0; i < parts; i++) {
    const part = document.createElement('div');
    part.style.cssText = 'flex: 1; height: 100%; border-right: ' + (i < parts - 1 ? '2px dashed ${c.secondary}' : 'none') + '; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s;';
    part.style.background = shaded.has(i) ? '${c.accent}88' : 'transparent';
    part.style.color = shaded.has(i) ? '${config.vibe === "kawaii" ? "#fff" : c.bg}' : '${c.text}44';
    part.textContent = (i + 1);
    part.onclick = () => { if (shaded.has(i)) shaded.delete(i); else shaded.add(i); renderBar(); document.getElementById('shadeCount').textContent = shaded.size; };
    bar.appendChild(part);
  }
  document.getElementById('cutCount').textContent = cuts;
}

function addCut() { if (cuts < 11) { cuts++; shaded.clear(); renderBar(); document.getElementById('shadeCount').textContent = 0; } }
function removeCut() { if (cuts > 0) { cuts--; shaded.clear(); renderBar(); document.getElementById('shadeCount').textContent = 0; } }

function checkFraction() {
  const parts = cuts + 1;
  const shadedCount = shaded.size;
  if (parts === targetDen && shadedCount === targetNum) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea'); const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo(); showScorePopup(rect.left + rect.width/2, rect.top + 50, '+' + (10 * (currentRound + 1)));
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 500); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    if (parts !== targetDen) showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Need ' + targetDen + ' equal parts, you have ' + parts);
    else showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Shade ' + targetNum + ' parts, not ' + shadedCount);
  }
}

function startRound() { resetFails();
  cuts = 0; shaded = new Set();
  const denoms = currentRound < 2 ? [2, 3, 4] : currentRound < 4 ? [3, 4, 5, 6] : [4, 5, 6, 8];
  targetDen = denoms[Math.floor(Math.random() * denoms.length)];
  targetNum = Math.floor(Math.random() * (targetDen - 1)) + 1;
  document.getElementById('fractionDisplay').textContent = targetNum + '/' + targetDen;
  renderBar();
  document.getElementById('shadeCount').textContent = '0';
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`
  return baseTemplate(config, gameContent, variant, 45)
}
