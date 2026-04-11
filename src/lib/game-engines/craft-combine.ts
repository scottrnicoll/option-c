// Craft & Combine engine
// Recipe shows needed amounts. Drag ingredients to combine and match the total.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function craftCombineEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Mix the right amounts of ${config.itemName} to complete each recipe!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>A recipe shows what you need. Click + and - to add the right amount of each ingredient. All amounts must match.</p>
    <h3>Valid moves</h3><p>• Recipe needs 3 red + 5 blue → set red to 3 and blue to 5 ✅</p>
    <h3>Invalid moves</h3><p>• Setting red to 4 when the recipe says 3 ❌</p>
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
  <div style="display: flex; gap: 40px; align-items: flex-start;">
    <!-- Recipe card -->
    <div style="background: ${c.primary}11; border: 2px solid ${c.primary}; border-radius: 16px; padding: 20px; width: 180px;">
      <div style="font-size: 12px; color: ${c.accent}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Recipe</div>
      <div id="recipe" style="space-y: 8px;"></div>
    </div>
    <!-- Mixing area -->
    <div style="text-align: center;">
      <div style="font-size: 14px; opacity: 0.6; margin-bottom: 12px;">Set the right amounts</div>
      <div id="mixers" style="display: flex; flex-direction: column; gap: 12px;"></div>
      <button onclick="checkRecipe()" style="margin-top: 20px; padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
        Mix!
      </button>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
const INGREDIENT_NAMES = ['Red', 'Blue', 'Green', 'Gold', 'Purple'];
const INGREDIENT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7'];
let targetAmounts = [];
let currentAmounts = [];
let ingredientCount = 2;

function createMixer(index) {
  const row = document.createElement('div');
  row.style.cssText = 'display: flex; align-items: center; gap: 12px;';
  const color = INGREDIENT_COLORS[index];
  const dot = document.createElement('div');
  dot.style.cssText = 'width: 20px; height: 20px; border-radius: 50%; background: ' + color + ';';
  const name = document.createElement('span');
  name.style.cssText = 'width: 50px; font-size: 14px; color: ${c.text};';
  name.textContent = INGREDIENT_NAMES[index];
  const minus = document.createElement('button');
  minus.textContent = '−';
  minus.style.cssText = 'width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${c.secondary}; background: transparent; color: ${c.text}; font-size: 20px; cursor: pointer; font-family: inherit;';
  minus.onclick = () => { if (currentAmounts[index] > 0) { currentAmounts[index]--; val.textContent = currentAmounts[index]; } };
  const val = document.createElement('span');
  val.style.cssText = 'width: 40px; text-align: center; font-size: 24px; font-weight: 700; color: ${c.text};';
  val.textContent = '0';
  val.id = 'mixer-' + index;
  const plus = document.createElement('button');
  plus.textContent = '+';
  plus.style.cssText = 'width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${c.primary}; background: ${c.primary}22; color: ${c.text}; font-size: 20px; cursor: pointer; font-family: inherit;';
  plus.onclick = () => { currentAmounts[index]++; val.textContent = currentAmounts[index]; };
  row.appendChild(dot); row.appendChild(name); row.appendChild(minus); row.appendChild(val); row.appendChild(plus);
  return row;
}

function checkRecipe() {
  let allCorrect = true;
  for (let i = 0; i < ingredientCount; i++) {
    if (currentAmounts[i] !== targetAmounts[i]) { allCorrect = false; break; }
  }
  if (allCorrect) {
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
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 500); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Wrong mix! Check each ingredient.');
  }
}

function startRound() { resetFails();
  if (currentRound < 2) { ingredientCount = 2; }
  else if (currentRound < 4) { ingredientCount = 3; }
  else { ingredientCount = 4; }
  const maxAmount = currentRound < 2 ? 6 : currentRound < 4 ? 9 : 12;
  targetAmounts = [];
  currentAmounts = [];
  for (let i = 0; i < ingredientCount; i++) {
    targetAmounts.push(Math.floor(Math.random() * maxAmount) + 1);
    currentAmounts.push(0);
  }
  // Render recipe
  const recipe = document.getElementById('recipe');
  recipe.innerHTML = '';
  for (let i = 0; i < ingredientCount; i++) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';
    const dot = document.createElement('div');
    dot.style.cssText = 'width: 14px; height: 14px; border-radius: 50%; background: ' + INGREDIENT_COLORS[i] + ';';
    const text = document.createElement('span');
    text.style.cssText = 'font-size: 16px; font-weight: 700; color: ${c.text};';
    text.textContent = INGREDIENT_NAMES[i] + ': ' + targetAmounts[i];
    row.appendChild(dot); row.appendChild(text);
    recipe.appendChild(row);
  }
  // Render mixers
  const mixers = document.getElementById('mixers');
  mixers.innerHTML = '';
  for (let i = 0; i < ingredientCount; i++) { mixers.appendChild(createMixer(i)); }
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`

  return baseTemplate(config, gameContent, variant, 50)
}
