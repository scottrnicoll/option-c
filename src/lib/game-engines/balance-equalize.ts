// Balance & Equalize engine
// Player drags tokens onto a two-sided scale to make both sides equal.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function balanceEqualizeEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Drag ${config.itemName} onto the right side of the scale to match the left side. Make both sides equal!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>

<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Each round, the left side of the scale has a value. Drag ${config.itemName} from the bank onto the right side until both sides are equal.</p>
    <h3>Valid moves</h3>
    <p>• If left side = 12, drag a 7 and a 5 to the right (7 + 5 = 12) ✅</p>
    <p>• If left side = 8, drag an 8 to the right ✅</p>
    <h3>Invalid moves</h3>
    <p>• If left side = 12, putting 15 on the right (too much!) ❌</p>
    <p>• Leaving the right side empty ❌</p>
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
  <!-- Scale -->
  <div id="scaleContainer" style="position: relative; width: 500px; height: 320px;">
    <!-- Fulcrum -->
    <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 30px solid transparent; border-right: 30px solid transparent; border-bottom: 40px solid ${c.secondary};"></div>
    <!-- Beam -->
    <div id="beam" style="position: absolute; bottom: 38px; left: 50%; width: 400px; height: 6px; background: ${c.secondary}; transform: translateX(-50%); transition: transform 0.3s; transform-origin: center center; border-radius: 3px;"></div>
    <!-- Left pan -->
    <div id="leftPan" style="position: absolute; bottom: 42px; left: 50px; width: 150px; min-height: 80px; background: ${c.primary}22; border: 2px solid ${c.primary}; border-radius: 12px; display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; align-content: flex-start; justify-content: center;">
      <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: ${c.text}; opacity: 0.6;">LEFT</div>
    </div>
    <!-- Right pan (drop target) -->
    <div id="rightPan" style="position: absolute; bottom: 42px; right: 50px; width: 150px; min-height: 80px; background: ${c.accent}11; border: 2px dashed ${c.accent}; border-radius: 12px; display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; align-content: flex-start; justify-content: center;"
      ondragover="event.preventDefault(); this.style.borderColor='${c.accent}'; this.style.background='${c.accent}22'"
      ondragleave="this.style.borderColor='${c.accent}'; this.style.background='${c.accent}11'"
      ondrop="handleDrop(event)">
      <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: ${c.text}; opacity: 0.6;">DROP HERE</div>
    </div>
    <!-- Totals -->
    <div style="position: absolute; bottom: 130px; left: 75px; text-align: center; width: 100px;">
      <div style="font-size: 28px; font-weight: 700; color: ${c.primary};" id="leftTotal">0</div>
    </div>
    <div style="position: absolute; bottom: 130px; right: 75px; text-align: center; width: 100px;">
      <div style="font-size: 28px; font-weight: 700; color: ${c.accent};" id="rightTotal">0</div>
    </div>
    <!-- Equals sign -->
    <div style="position: absolute; bottom: 150px; left: 50%; transform: translateX(-50%); font-size: 24px; color: ${c.text}; opacity: 0.3;" id="equalsSign">=?</div>
  </div>
</div>

<!-- Token bank -->
<div style="padding: 12px 16px; border-top: 2px solid ${c.primary}22;">
  <div style="font-size: 12px; color: ${c.text}; opacity: 0.5; margin-bottom: 8px; text-align: center;">
    Drag ${config.itemName} to the right side ↑
  </div>
  <div id="tokenBank" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; min-height: 50px;">
  </div>
</div>

<!-- Check button -->
<div style="padding: 8px 16px; text-align: center;">
  <button id="checkBtn" onclick="checkBalance()" style="padding: 10px 32px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
    Check Balance
  </button>
</div>

<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
let leftValue = 0;
let rightValue = 0;
let draggedValue = 0;
let rightTokens = [];

function createToken(value, draggable) {
  const el = document.createElement('div');
  el.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; cursor: ' + (draggable ? 'grab' : 'default') + ';';
  el.style.background = draggable ? '${c.accent}' : '${c.primary}';
  el.style.color = '${config.vibe === "kawaii" ? "#fff" : c.bg}';
  el.textContent = value;
  if (draggable) {
    el.draggable = true;
    el.dataset.value = value;
    el.addEventListener('dragstart', (e) => {
      draggedValue = parseInt(el.dataset.value);
      e.dataTransfer.setData('text/plain', el.dataset.value);
      el.style.opacity = '0.5';
    });
    el.addEventListener('dragend', () => {
      el.style.opacity = '1';
    });
    // Touch support
    el.addEventListener('touchstart', (e) => {
      draggedValue = parseInt(el.dataset.value);
      el.style.opacity = '0.5';
    });
    el.addEventListener('touchend', (e) => {
      el.style.opacity = '1';
      const touch = e.changedTouches[0];
      const dropTarget = document.getElementById('rightPan');
      const rect = dropTarget.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        addToRight(draggedValue);
        el.remove();
      }
    });
  }
  return el;
}

function handleDrop(e) {
  e.preventDefault();
  const val = parseInt(e.dataTransfer.getData('text/plain'));
  if (isNaN(val)) return;
  addToRight(val);
  // Remove from bank
  const bank = document.getElementById('tokenBank');
  const tokens = bank.querySelectorAll('[data-value]');
  for (const t of tokens) {
    if (parseInt(t.dataset.value) === val) {
      t.remove();
      break;
    }
  }
  document.getElementById('rightPan').style.borderColor = '${c.accent}';
  document.getElementById('rightPan').style.background = '${c.accent}11';
}

function addToRight(val) {
  rightTokens.push(val);
  rightValue += val;
  document.getElementById('rightTotal').textContent = rightValue;
  // Add visual token to right pan
  const pan = document.getElementById('rightPan');
  const token = createToken(val, false);
  token.style.background = '${c.accent}';
  token.style.cursor = 'pointer';
  token.title = 'Click to remove';
  token.addEventListener('click', () => {
    const idx = rightTokens.indexOf(val);
    if (idx !== -1) {
      rightTokens.splice(idx, 1);
      rightValue -= val;
      document.getElementById('rightTotal').textContent = rightValue;
      token.remove();
      // Return to bank
      const bank = document.getElementById('tokenBank');
      bank.appendChild(createToken(val, true));
    }
  });
  pan.appendChild(token);
  // Tilt beam
  updateBeam();
}

function updateBeam() {
  const beam = document.getElementById('beam');
  const diff = rightValue - leftValue;
  const tilt = Math.max(-15, Math.min(15, diff * 2));
  beam.style.transform = 'translateX(-50%) rotate(' + tilt + 'deg)';
  const eq = document.getElementById('equalsSign');
  if (rightValue === leftValue && rightValue > 0) {
    eq.textContent = '= ✓';
    eq.style.color = '${c.accent}';
  } else {
    eq.textContent = '=?';
    eq.style.color = '${c.text}';
    eq.style.opacity = '0.3';
  }
}

function checkBalance() {
  if (rightValue === leftValue && rightValue > 0) {
    // Correct!
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo();
    showScorePopup(rect.left + rect.width/2, rect.top + 50, '+' + (10 * (currentRound + 1)));
    // Mark round
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => showVictory('${config.winMessage}'), 500);
    } else {
      setTimeout(startRound, 800);
    }
  } else {
    // Wrong
    screenShake();
    resetCombo();
    if (rightValue > leftValue) {
      showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Too much!');
    } else {
      showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Not enough!');
    }
  }
}

function generateRound(round) {
  // Progressive difficulty
  let maxVal, tokenCount;
  if (round < 2) { maxVal = 10; tokenCount = 4; }
  else if (round < 4) { maxVal = 20; tokenCount = 5; }
  else { maxVal = 30; tokenCount = 6; }

  // Generate target (left side)
  const target = Math.floor(Math.random() * (maxVal - 3)) + 4;

  // Generate tokens that can sum to target (at least one valid combination)
  const tokens = [];
  // Ensure at least one pair that sums to target
  const a = Math.floor(Math.random() * (target - 1)) + 1;
  const b = target - a;
  tokens.push(a, b);
  // Add distractors
  while (tokens.length < tokenCount) {
    tokens.push(Math.floor(Math.random() * maxVal) + 1);
  }
  // Shuffle
  for (let i = tokens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }

  return { target, tokens };
}

function startRound() { resetFails();
  rightValue = 0;
  rightTokens = [];
  document.getElementById('rightTotal').textContent = '0';
  document.getElementById('rightPan').innerHTML = '<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: ${c.text}; opacity: 0.6;">DROP HERE</div>';

  const { target, tokens } = generateRound(currentRound);
  leftValue = target;
  document.getElementById('leftTotal').textContent = ${variant === "challenge" ? "'?'" : "target"};

  // Set left pan
  const leftPan = document.getElementById('leftPan');
  leftPan.innerHTML = '<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: ${c.text}; opacity: 0.6;">LEFT</div>';
  leftPan.appendChild(createToken(target, false));

  // Set bank
  const bank = document.getElementById('tokenBank');
  bank.innerHTML = '';
  tokens.forEach(v => bank.appendChild(createToken(v, true)));

  updateBeam();

  // Update round dots
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => {
    d.classList.remove('current');
    if (i === currentRound) d.classList.add('current');
  });
}

function startGame() {
  // Create round dots
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

  return baseTemplate(config, gameContent, variant, 60)
}
