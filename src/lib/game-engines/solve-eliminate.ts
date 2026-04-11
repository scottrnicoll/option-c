// Solve & Eliminate engine
// Grid of possibilities. Use clues to eliminate wrong answers and find the correct one.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function solveEliminateEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Use the clues to eliminate wrong answers. Find the hidden ${config.itemName}!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Numbers appear in a grid. Read each clue and click numbers that DON'T match the clue to eliminate them. The last one standing is your answer!</p>
    <h3>Example</h3><p>• Clue: "It's even" → eliminate all odd numbers ✅</p>
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
    <!-- Clue -->
    <div style="background: ${c.accent}11; border: 2px solid ${c.accent}44; border-radius: 12px; padding: 12px 20px; margin-bottom: 20px;">
      <div style="font-size: 12px; color: ${c.accent}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Clue</div>
      <div id="clue" style="font-size: 18px; font-weight: 700; color: ${c.text};"></div>
    </div>
    <div style="font-size: 13px; opacity: 0.5; margin-bottom: 12px;">Click numbers that DON'T match the clue to eliminate them</div>
    <!-- Grid -->
    <div id="grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 300px; margin: 0 auto;"></div>
    <div style="margin-top: 16px;">
      <button onclick="submitAnswer()" style="padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
        That's my answer!
      </button>
      <div style="font-size: 11px; opacity: 0.4; margin-top: 4px;">Click when only the answer remains</div>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, answer = 0, eliminated = new Set(), gridNums = [];

function createCell(value) {
  const el = document.createElement('button');
  el.style.cssText = 'width: 60px; height: 60px; border-radius: 12px; font-size: 20px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 2px solid ${c.primary}44; background: ${c.primary}11; color: ${c.text}; font-family: inherit;';
  el.textContent = value;
  el.dataset.value = value;
  el.onclick = () => eliminateCell(el, parseInt(value));
  return el;
}

function eliminateCell(el, value) {
  if (value === answer) {
    // Wrong elimination — that's the answer!
    el.style.borderColor = '${c.danger}';
    el.style.background = '${c.danger}22';
    screenShake();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, "Don't eliminate that one!");
    setTimeout(() => { el.style.borderColor = '${c.primary}44'; el.style.background = '${c.primary}11'; }, 600);
    return;
  }
  eliminated.add(value);
  el.style.opacity = '0.2';
  el.style.borderColor = '${c.secondary}22';
  el.style.cursor = 'default';
  el.onclick = null;
  spawnParticles(el.getBoundingClientRect().left + 30, el.getBoundingClientRect().top + 30, '${c.secondary}', 4);
}

function submitAnswer() {
  const remaining = gridNums.filter(n => !eliminated.has(n));
  if (remaining.length === 1 && remaining[0] === answer) {
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
  } else if (remaining.length > 1) {
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Eliminate more! ' + remaining.length + ' left.');
  } else {
    screenShake(); resetCombo();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'The answer was ' + answer);
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showDefeat('${config.loseMessage}'), 500); }
    else { setTimeout(startRound, 800); }
  }
}

function generateRound(round) {
  const count = round < 2 ? 8 : round < 4 ? 12 : 16;
  const max = round < 2 ? 20 : round < 4 ? 50 : 100;
  const nums = new Set();
  // Generate answer first
  const ans = Math.floor(Math.random() * max) + 1;
  nums.add(ans);
  while (nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
  // Generate clue about the answer
  const clues = [];
  if (ans % 2 === 0) clues.push('It is an even number');
  else clues.push('It is an odd number');
  if (ans > max / 2) clues.push('It is greater than ' + Math.floor(max / 2));
  else clues.push('It is less than ' + Math.ceil(max / 2));
  if (ans % 5 === 0) clues.push('It is a multiple of 5');
  if (ans < 10) clues.push('It is a single digit number');
  else clues.push('It has ' + String(ans).length + ' digits');
  const clue = clues[Math.floor(Math.random() * clues.length)];
  return { nums: Array.from(nums), answer: ans, clue };
}

function startRound() {
  eliminated = new Set();
  const data = generateRound(currentRound);
  gridNums = data.nums;
  answer = data.answer;
  document.getElementById('clue').textContent = data.clue;
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  // Shuffle
  const shuffled = [...data.nums];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  grid.style.gridTemplateColumns = 'repeat(' + Math.ceil(Math.sqrt(shuffled.length)) + ', 1fr)';
  shuffled.forEach(n => grid.appendChild(createCell(n)));
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`

  return baseTemplate(config, gameContent, variant, 60)
}
