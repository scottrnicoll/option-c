// Grow & Compound engine
// Start with a number. Each round choose how to reinvest. Reach the target.
// 5 rounds of investment decisions.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function growCompoundEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Grow your ${config.itemName} as fast as you can! Pick the best multiplier each round to reach the target.</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>You start with a small number. Each round, pick a multiplier (×2, ×3, etc.) to grow. Reach the target number!</p>
    <h3>Valid moves</h3><p>• Start with 2, pick ×3 = 6, then ×2 = 12 ✅</p>
    <h3>Warning</h3><p>• If you overshoot the target, you lose! ❌</p>
    <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
  </div>
</div>
<div class="game-header">
  <div class="game-title">${config.title}</div>
  <div class="game-stats">
    <span>Round: <strong id="roundDisplay">1</strong>/8</span>
  </div>
</div>
<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 400px;">
    <!-- Target -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; opacity: 0.6;">Reach this target</div>
      <div id="target" style="font-size: 32px; font-weight: 700; color: ${c.accent};"></div>
    </div>
    <!-- Current value (big) -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 14px; opacity: 0.6;">Your ${config.itemName}</div>
      <div id="currentVal" style="font-size: 64px; font-weight: 700; color: ${c.primary}; transition: all 0.3s;"></div>
    </div>
    <!-- Progress bar -->
    <div style="width: 100%; height: 12px; background: ${c.secondary}22; border-radius: 6px; margin-bottom: 20px; overflow: hidden;">
      <div id="progressBar" style="height: 100%; background: ${c.accent}; border-radius: 6px; transition: width 0.5s; width: 0;"></div>
    </div>
    <!-- Multiplier choices -->
    <div style="font-size: 14px; opacity: 0.6; margin-bottom: 8px;">Pick your multiplier</div>
    <div id="multipliers" style="display: flex; gap: 12px; justify-content: center;"></div>
    <!-- History -->
    <div id="history" style="margin-top: 20px; font-size: 12px; color: ${c.text}80; min-height: 20px;"></div>
  </div>
</div>
<script>
let currentVal = 0, targetVal = 0, roundNum = 0;
const MAX_ROUNDS = 8;
let historyStr = '';

function pickMultiplier(mult) {
  const newVal = currentVal * mult;
  historyStr += currentVal + ' × ' + mult + ' = ' + newVal + '\\n';
  currentVal = newVal;
  roundNum++;
  document.getElementById('currentVal').textContent = currentVal;
  document.getElementById('roundDisplay').textContent = roundNum;
  document.getElementById('history').textContent = historyStr.split('\\n').slice(-3).join(' → ');
  // Update progress bar
  const pct = Math.min(100, (currentVal / targetVal) * 100);
  document.getElementById('progressBar').style.width = pct + '%';

  if (currentVal === targetVal) {
    // Win!
    window.gameScore = (MAX_ROUNDS - roundNum + 1) * 20;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 16);
    showScorePopup(rect.left + rect.width/2, rect.top + 50, 'Done in ' + roundNum + ' rounds!');
    setTimeout(() => showVictory('${config.winMessage}'), 600);
  } else if (currentVal > targetVal) {
    // Overshoot!
    screenShake();
    document.getElementById('currentVal').style.color = '${c.danger}';
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Too much! You overshot by ' + (currentVal - targetVal));
    setTimeout(() => showDefeat('${config.loseMessage}'), 800);
  } else if (roundNum >= MAX_ROUNDS) {
    // Out of rounds
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Out of rounds! Needed ' + (targetVal - currentVal) + ' more.');
    setTimeout(() => showDefeat('${config.loseMessage}'), 800);
  } else {
    // Continue — generate new multipliers
    generateMultipliers();
  }
}

function generateMultipliers() {
  const choices = document.getElementById('multipliers');
  choices.innerHTML = '';
  // Always offer ×2, and then 1-2 other options
  const mults = [2];
  if (currentVal * 3 <= targetVal * 1.5) mults.push(3);
  if (currentVal * 4 <= targetVal * 1.5) mults.push(4);
  if (currentVal * 5 <= targetVal * 1.5) mults.push(5);
  // Keep max 4 options
  const shown = mults.slice(0, 4);
  shown.forEach(m => {
    const btn = document.createElement('button');
    btn.textContent = '×' + m;
    btn.style.cssText = 'width: 64px; height: 64px; border-radius: 50%; font-size: 22px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 3px solid ${c.primary}; background: ${c.primary}22; color: ${c.text}; font-family: inherit;';
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.background = '${c.primary}44';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.background = '${c.primary}22';
    });
    btn.onclick = () => pickMultiplier(m);
    // Show preview
    const preview = document.createElement('div');
    preview.style.cssText = 'font-size: 10px; color: ${c.text}80; margin-top: 2px;';
    preview.textContent = '= ' + (currentVal * m);
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
    wrapper.appendChild(btn);
    wrapper.appendChild(preview);
    choices.appendChild(wrapper);
  });
}

function startGame() {
  // Pick a target that's achievable through multiplication
  const base = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
  const steps = Math.floor(Math.random() * 3) + 3; // 3-5 multiplications
  let target = base;
  for (let i = 0; i < steps; i++) {
    target *= [2, 3, 2, 4, 2][Math.floor(Math.random() * 5)];
  }
  currentVal = base;
  targetVal = target;
  roundNum = 0;
  historyStr = '';
  document.getElementById('currentVal').textContent = currentVal;
  document.getElementById('currentVal').style.color = '${c.primary}';
  document.getElementById('target').textContent = targetVal;
  document.getElementById('roundDisplay').textContent = '1';
  document.getElementById('history').textContent = '';
  document.getElementById('progressBar').style.width = Math.round((currentVal / targetVal) * 100) + '%';
  generateMultipliers();
}
</script>`

  return baseTemplate(config, gameContent, variant, 60)
}
