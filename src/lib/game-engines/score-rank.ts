// Score & Rank engine
// Player drags items into the correct order (ascending/descending).
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function scoreRankEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Drag the ${config.itemName} into the correct order — smallest to largest!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>

<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Each round shows ${config.itemName} with numbers. Drag them into order from smallest (left) to largest (right).</p>
    <h3>Valid moves</h3>
    <p>• Numbers 5, 2, 8 → arrange as 2, 5, 8 ✅</p>
    <p>• Numbers -3, 1, -7 → arrange as -7, -3, 1 ✅</p>
    <h3>Invalid moves</h3>
    <p>• Putting 8 before 2 ❌</p>
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
  <div style="width: 90%; max-width: 600px;">
    <p style="text-align: center; font-size: 14px; opacity: 0.6; margin-bottom: 16px;">
      Drag ${config.itemName} into order: smallest → largest
    </p>
    <!-- Drop zones -->
    <div id="dropZones" style="display: flex; gap: 8px; justify-content: center; margin-bottom: 24px; min-height: 70px;">
    </div>
    <!-- Draggable items -->
    <div id="itemBank" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; min-height: 70px;">
    </div>
    <div style="text-align: center; margin-top: 16px;">
      <button id="checkBtn" onclick="checkOrder()" style="padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
        Check Order
      </button>
    </div>
  </div>
</div>

<div class="game-footer">${config.dare || 'Sort them all!'}</div>

<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
let correctOrder = [];
let itemCount = 0;
let draggedEl = null;

function createItem(value) {
  const el = document.createElement('div');
  el.style.cssText = 'width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; cursor: grab; transition: transform 0.15s;';
  el.style.background = '${c.primary}';
  el.style.color = '${config.vibe === "kawaii" ? "#fff" : c.bg}';
  el.style.border = '2px solid ${c.primary}';
  el.textContent = value;
  el.dataset.value = value;
  el.draggable = true;

  el.addEventListener('dragstart', (e) => {
    draggedEl = el;
    el.style.opacity = '0.5';
    e.dataTransfer.setData('text/plain', value);
  });
  el.addEventListener('dragend', () => {
    el.style.opacity = '1';
    draggedEl = null;
  });
  // Touch support
  let touchStartX = 0, touchStartY = 0;
  el.addEventListener('touchstart', (e) => {
    draggedEl = el;
    const t = e.touches[0];
    touchStartX = t.clientX; touchStartY = t.clientY;
    el.style.opacity = '0.7';
    el.style.zIndex = '100';
  });
  el.addEventListener('touchmove', (e) => { e.preventDefault(); });
  el.addEventListener('touchend', (e) => {
    el.style.opacity = '1';
    el.style.zIndex = '';
    const touch = e.changedTouches[0];
    const zones = document.querySelectorAll('.drop-zone');
    for (const zone of zones) {
      const rect = zone.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        if (!zone.dataset.filled) {
          zone.appendChild(el);
          zone.dataset.filled = 'true';
          zone.style.borderStyle = 'solid';
          zone.style.borderColor = '${c.primary}';
        }
        break;
      }
    }
    draggedEl = null;
  });

  return el;
}

function createDropZone(index) {
  const zone = document.createElement('div');
  zone.className = 'drop-zone';
  zone.style.cssText = 'width: 68px; height: 68px; border: 2px dashed ${c.accent}44; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
  zone.dataset.index = index;

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = '${c.accent}';
    zone.style.background = '${c.accent}11';
  });
  zone.addEventListener('dragleave', () => {
    if (!zone.dataset.filled) {
      zone.style.borderColor = '${c.accent}44';
      zone.style.background = 'transparent';
    }
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedEl && !zone.dataset.filled) {
      zone.appendChild(draggedEl);
      zone.dataset.filled = 'true';
      zone.style.borderStyle = 'solid';
      zone.style.borderColor = '${c.primary}';
      zone.style.background = 'transparent';
    }
  });
  // Click to return item to bank
  zone.addEventListener('click', () => {
    if (zone.dataset.filled && zone.firstElementChild) {
      document.getElementById('itemBank').appendChild(zone.firstElementChild);
      zone.dataset.filled = '';
      zone.style.borderStyle = 'dashed';
      zone.style.borderColor = '${c.accent}44';
    }
  });

  return zone;
}

function checkOrder() {
  const zones = document.querySelectorAll('.drop-zone');
  const placed = [];
  let allFilled = true;
  zones.forEach(z => {
    if (z.firstElementChild) {
      placed.push(parseInt(z.firstElementChild.dataset.value));
    } else {
      allFilled = false;
    }
  });

  if (!allFilled) {
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Place all items first!');
    return;
  }

  // Check if in correct order
  let correct = true;
  for (let i = 0; i < placed.length; i++) {
    if (placed[i] !== correctOrder[i]) { correct = false; break; }
  }

  if (correct) {
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
  } else {
    screenShake();
    resetCombo();
    // Highlight wrong positions
    zones.forEach((z, i) => {
      if (z.firstElementChild && parseInt(z.firstElementChild.dataset.value) !== correctOrder[i]) {
        z.style.borderColor = '${c.danger}';
        setTimeout(() => { z.style.borderColor = '${c.primary}'; }, 600);
      }
    });
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Not quite right!');
  }
}

function generateRound(round) {
  let count, range;
  if (round < 2) { count = 4; range = 20; }
  else if (round < 4) { count = 5; range = 50; }
  else { count = 6; range = 100; }

  // Generate unique random numbers
  const nums = new Set();
  while (nums.size < count) {
    const n = Math.floor(Math.random() * range * 2) - range;
    nums.add(n);
  }
  const values = Array.from(nums);
  return { values, sorted: [...values].sort((a, b) => a - b) };
}

function startRound() { resetFails();
  const { values, sorted } = generateRound(currentRound);
  correctOrder = sorted;
  itemCount = values.length;

  // Create drop zones
  const zonesContainer = document.getElementById('dropZones');
  zonesContainer.innerHTML = '';
  for (let i = 0; i < itemCount; i++) {
    zonesContainer.appendChild(createDropZone(i));
  }

  // Create items (shuffled)
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const bank = document.getElementById('itemBank');
  bank.innerHTML = '';
  shuffled.forEach(v => bank.appendChild(createItem(v)));

  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => {
    d.classList.remove('current');
    if (i === currentRound) d.classList.add('current');
  });
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
