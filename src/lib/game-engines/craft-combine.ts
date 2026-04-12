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

  // VARIANT B: Potion Lab — combine ingredients with multiplied factors
  if (variant === "variantB") {
    const vB = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title} — Potion Lab</h2>
    <p>You are a <strong>${config.character}</strong> in the <strong>${config.worldName}</strong>.</p>
    <p>The cauldron needs a specific power level! Each ingredient has a base power,
    but the cauldron MULTIPLIES it. Choose wisely — one wrong ingredient and the
    potion explodes!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Brew! →</button>
  </div>
</div>

<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>The cauldron has a multiplier (×2, ×3, etc.). Each ingredient has a base value.
    When you drop it in, it gets multiplied. Your total must match the target exactly.</p>
    <h3>Example</h3>
    <p>• Cauldron multiplier: ×3</p>
    <p>• You drop in a "4" ingredient → it becomes 12</p>
    <p>• Target is 21? Drop in 4 (=12) and 3 (=9). Total: 12+9 = 21 ✅</p>
    <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
  </div>
</div>

<div class="game-header">
  <div class="game-title">${config.title} — Potion Lab</div>
  <div class="game-stats">
    <span>Score: <strong id="scoreDisplay">0</strong></span>
    <div class="round-dots" id="roundDots"></div>
  </div>
</div>

<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 450px;">
    <!-- Target power -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; opacity: 0.6;">Target potion power</div>
      <div id="targetPower" style="font-size: 52px; font-weight: 700; color: ${c.accent};"></div>
    </div>

    <!-- Cauldron info -->
    <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 20px;">
      <div style="background: ${c.primary}11; border: 2px solid ${c.primary}44; border-radius: 12px; padding: 12px 20px;">
        <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase;">Cauldron multiplier</div>
        <div id="multiplier" style="font-size: 28px; font-weight: 700; color: ${c.primary};"></div>
      </div>
      <div style="background: ${c.accent}11; border: 2px solid ${c.accent}44; border-radius: 12px; padding: 12px 20px;">
        <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase;">Current brew</div>
        <div id="currentBrew" style="font-size: 28px; font-weight: 700; color: ${c.accent};">0</div>
      </div>
    </div>

    <!-- Ingredients -->
    <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">Click ingredients to add to the cauldron</div>
    <div id="ingredients" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px;"></div>

    <!-- Added ingredients display -->
    <div style="font-size: 12px; opacity: 0.5; margin-bottom: 4px;">In the cauldron (click to remove)</div>
    <div id="cauldron" style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; min-height: 40px; margin-bottom: 16px;"></div>

    <!-- Buttons -->
    <div style="display: flex; gap: 8px; justify-content: center;">
      <button onclick="clearCauldron()" style="padding: 10px 20px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; font-size: 14px; cursor: pointer;">
        Empty cauldron
      </button>
      <button onclick="brewPotion()" style="padding: 10px 28px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
        Brew! 🧪
      </button>
    </div>
  </div>
</div>

<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
let targetPower = 0;
let mult = 2;
let brewTotal = 0;
let addedIngredients = [];

function createIngredient(baseValue) {
  const el = document.createElement('button');
  el.style.cssText = 'width: 56px; height: 56px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; border: 2px solid ${c.primary}; background: ${c.primary}22; color: ${c.text}; font-family: inherit;';
  el.innerHTML = '<span style="font-size: 18px; font-weight: 700;">' + baseValue + '</span><span style="font-size: 9px; opacity: 0.5;">×' + mult + '=' + (baseValue * mult) + '</span>';
  el.dataset.base = baseValue;
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.1)'; el.style.borderColor = '${c.accent}'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; el.style.borderColor = '${c.primary}'; });
  el.addEventListener('click', () => addIngredient(baseValue, el));
  return el;
}

function addIngredient(baseValue, sourceEl) {
  const multiplied = baseValue * mult;
  addedIngredients.push({ base: baseValue, multiplied });
  brewTotal += multiplied;
  document.getElementById('currentBrew').textContent = brewTotal;

  // Animate the source
  sourceEl.style.opacity = '0.3';
  sourceEl.style.pointerEvents = 'none';

  // Add to cauldron display
  const chip = document.createElement('button');
  chip.style.cssText = 'padding: 4px 10px; border-radius: 16px; background: ${c.accent}44; border: 1px solid ${c.accent}; color: ${c.text}; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s;';
  chip.textContent = baseValue + '×' + mult + '=' + multiplied;
  chip.title = 'Click to remove';
  chip.addEventListener('click', () => {
    const idx = addedIngredients.findIndex(a => a.base === baseValue && a.multiplied === multiplied);
    if (idx !== -1) {
      addedIngredients.splice(idx, 1);
      brewTotal -= multiplied;
      document.getElementById('currentBrew').textContent = brewTotal;
      chip.remove();
      sourceEl.style.opacity = '1';
      sourceEl.style.pointerEvents = 'auto';
    }
  });
  document.getElementById('cauldron').appendChild(chip);

  // Visual feedback
  spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '${c.primary}', 4);
}

function clearCauldron() {
  addedIngredients = [];
  brewTotal = 0;
  document.getElementById('currentBrew').textContent = '0';
  document.getElementById('cauldron').innerHTML = '';
  // Re-enable all ingredients
  document.querySelectorAll('#ingredients button').forEach(el => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });
}

function brewPotion() {
  if (brewTotal === targetPower) {
    // Success! The potion brews perfectly
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '${c.accent}', 16);
    addCombo();
    showScorePopup(rect.left + rect.width / 2, rect.top + 50, '+' + (10 * (currentRound + 1)));

    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;

    if (currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => showVictory('${config.winMessage}'), 500);
    } else {
      setTimeout(startRound, 800);
    }
  } else {
    // Wrong! The potion fizzles
    screenShake();
    resetCombo();
    trackFail();
    if (brewTotal > targetPower) {
      showScorePopup(window.innerWidth / 2, window.innerHeight / 2, 'Too powerful! Remove some ingredients.');
    } else {
      showScorePopup(window.innerWidth / 2, window.innerHeight / 2, 'Not enough power! Add more.');
    }
  }
}

function startRound() {
  resetFails();
  addedIngredients = [];
  brewTotal = 0;
  document.getElementById('currentBrew').textContent = '0';
  document.getElementById('cauldron').innerHTML = '';

  // Progressive difficulty
  if (currentRound < 2) {
    mult = 2;
  } else if (currentRound < 4) {
    mult = 3;
  } else {
    mult = [4, 5][Math.floor(Math.random() * 2)];
  }
  document.getElementById('multiplier').textContent = '×' + mult;

  // Generate ingredients and target
  const ingredientCount = currentRound < 2 ? 5 : currentRound < 4 ? 6 : 7;
  const maxBase = currentRound < 2 ? 6 : currentRound < 4 ? 8 : 10;
  const bases = [];
  for (let i = 0; i < ingredientCount; i++) {
    bases.push(Math.floor(Math.random() * maxBase) + 1);
  }

  // Pick 2-3 ingredients that form the target
  const pickCount = currentRound < 3 ? 2 : 3;
  const picked = bases.slice(0, pickCount);
  targetPower = picked.reduce((sum, b) => sum + b * mult, 0);

  document.getElementById('targetPower').textContent = targetPower;

  // Render ingredients
  const container = document.getElementById('ingredients');
  container.innerHTML = '';
  // Shuffle
  const shuffled = [...bases];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  shuffled.forEach(b => container.appendChild(createIngredient(b)));

  // Update round dots
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
    return baseTemplate(config, vB, variant, 50)
  }

  // VARIANT C: Assembly Line — items come in groups, combine to hit target
  if (variant === "variantC") {
    const vC = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title} — Assembly Line</h2>
    <p>You are a <strong>${config.character}</strong> running an assembly line in <strong>${config.worldName}</strong>.</p>
    <p>${config.itemName} arrive in groups. Combine the right groups to fill each order exactly!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Start the line! →</button>
  </div>
</div>

<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>An order comes in: "Need 18 items." Groups of items arrive on the line
    (group of 5, group of 7, group of 3...). Click the right groups that
    add up to exactly 18.</p>
    <h3>Watch out</h3>
    <p>Once you pass a group, it's gone forever! Grab the right ones as they arrive.</p>
    <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
  </div>
</div>

<div class="game-header">
  <div class="game-title">${config.title} — Assembly</div>
  <div class="game-stats">
    <span>Score: <strong id="scoreDisplay">0</strong></span>
    <div class="round-dots" id="roundDots"></div>
  </div>
</div>

<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 450px;">
    <!-- Order display -->
    <div style="background: ${c.accent}11; border: 2px solid ${c.accent}44; border-radius: 16px; padding: 16px; margin-bottom: 16px;">
      <div style="font-size: 12px; color: ${c.accent}; text-transform: uppercase; letter-spacing: 1px;">Order</div>
      <div style="font-size: 18px; color: ${c.text}; margin-top: 4px;">Need exactly <strong id="orderAmount" style="font-size: 28px; color: ${c.accent};"></strong> ${config.itemName}</div>
    </div>

    <!-- Current count -->
    <div style="margin-bottom: 16px;">
      <span style="font-size: 14px; opacity: 0.6;">Collected: </span>
      <strong id="collected" style="font-size: 28px; color: ${c.primary};">0</strong>
    </div>

    <!-- Arriving groups -->
    <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">Groups arriving — click to grab!</div>
    <div id="lineArea" style="position: relative; height: 80px; border: 2px solid ${c.secondary}33; border-radius: 12px; overflow: hidden; margin-bottom: 16px;"></div>

    <!-- Grabbed groups -->
    <div style="font-size: 12px; opacity: 0.5; margin-bottom: 4px;">Your groups</div>
    <div id="grabbed" style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; min-height: 36px; margin-bottom: 16px;"></div>

    <button onclick="submitOrder()" style="padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
      Fill order! 📦
    </button>
  </div>
</div>

<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0;
let orderAmount = 0;
let collectedTotal = 0;
let grabbedGroups = [];
let lineInterval = null;

function spawnGroup() {
  const maxGroup = currentRound < 2 ? 6 : currentRound < 4 ? 10 : 15;
  const groupSize = Math.floor(Math.random() * maxGroup) + 1;

  const el = document.createElement('div');
  el.style.cssText = 'position: absolute; right: -70px; top: 50%; transform: translateY(-50%); padding: 8px 16px; background: ' + '${c.primary}' + '; border-radius: 12px; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; gap: 6px;';
  el.innerHTML = '<span style="font-size: 20px; font-weight: 700; color: ' + '${config.vibe === "kawaii" ? "#fff" : c.bg}' + ';">' + groupSize + '</span><span style="font-size: 11px; color: ' + '${config.vibe === "kawaii" ? "#fff" : c.bg}' + '80;">items</span>';

  el.addEventListener('click', () => {
    grabbedGroups.push(groupSize);
    collectedTotal += groupSize;
    document.getElementById('collected').textContent = collectedTotal;

    // Add chip to grabbed area
    const chip = document.createElement('span');
    chip.style.cssText = 'padding: 4px 10px; border-radius: 12px; background: ' + '${c.accent}' + '44; border: 1px solid ' + '${c.accent}' + '; font-size: 13px; font-weight: 700; color: ' + '${c.text}' + ';';
    chip.textContent = groupSize;
    document.getElementById('grabbed').appendChild(chip);

    el.style.opacity = '0';
    setTimeout(() => el.remove(), 150);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '${c.accent}', 4);

    // Update color based on proximity
    const display = document.getElementById('collected');
    if (collectedTotal === orderAmount) display.style.color = '${c.accent}';
    else if (collectedTotal > orderAmount) display.style.color = '${c.danger}';
    else display.style.color = '${c.primary}';
  });

  document.getElementById('lineArea').appendChild(el);

  let pos = -70;
  const moveInt = setInterval(() => {
    pos += 1.5;
    el.style.right = 'auto';
    el.style.left = pos + 'px';
    if (pos > 480) {
      clearInterval(moveInt);
      el.remove();
    }
  }, 30);
}

function submitOrder() {
  if (collectedTotal === orderAmount) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '${c.accent}', 16);
    addCombo();
    showScorePopup(rect.left + rect.width / 2, rect.top + 50, 'Order filled! +' + (10 * (currentRound + 1)));

    clearInterval(lineInterval);
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
    trackFail();
    if (collectedTotal > orderAmount) {
      showScorePopup(window.innerWidth / 2, window.innerHeight / 2, 'Too many! You have ' + collectedTotal + ', need ' + orderAmount);
    } else {
      showScorePopup(window.innerWidth / 2, window.innerHeight / 2, 'Not enough! You have ' + collectedTotal + ', need ' + orderAmount);
    }
  }
}

function startRound() {
  resetFails();
  collectedTotal = 0;
  grabbedGroups = [];
  document.getElementById('collected').textContent = '0';
  document.getElementById('collected').style.color = '${c.primary}';
  document.getElementById('grabbed').innerHTML = '';
  document.getElementById('lineArea').innerHTML = '';

  if (lineInterval) clearInterval(lineInterval);

  // Generate target
  const maxOrder = currentRound < 2 ? 15 : currentRound < 4 ? 30 : 50;
  orderAmount = Math.floor(Math.random() * (maxOrder - 5)) + 6;
  document.getElementById('orderAmount').textContent = orderAmount;

  // Start the conveyor
  const spawnRate = currentRound < 2 ? 2000 : currentRound < 4 ? 1500 : 1200;
  lineInterval = setInterval(spawnGroup, spawnRate);
  // Spawn first one immediately
  spawnGroup();

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
    return baseTemplate(config, vC, variant, 50)
  }

  return baseTemplate(config, gameContent, variant, 50)
}
