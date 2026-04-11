// <!-- coreVerb: collect-manage-phaser -->
// Phaser 3.90 Collect & Manage engine.
// Items with numeric values appear as sprites. Click to collect, hit exact target sum.
// 5 rounds, progressive difficulty. 3 variants: classic, timed, challenge.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { resolveSpriteUrl } from "../sprite-library"

export function collectManagePhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  variant: GameVariant = "classic"
): string {
  const c = config.colors

  const characterUrl = config.characterSprite
    ? resolveSpriteUrl("characters", config.characterSprite)
    : resolveSpriteUrl("characters", "wizard")

  const itemUrl = config.itemSprite
    ? resolveSpriteUrl("items", config.itemSprite)
    : resolveSpriteUrl("items", "gem")

  const bgUrl = config.backgroundImage
    ? resolveSpriteUrl("backgrounds", config.backgroundImage)
    : resolveSpriteUrl("backgrounds", "cave")

  const TOTAL_ROUNDS = 5
  const TIMER_SECONDS = variant === "timed" ? 45 : 0
  const IS_TIMED = variant === "timed"
  const IS_CHALLENGE = variant === "challenge"
  const LIVES = 3

  // Escape colours for safe embedding
  const bg = c.bg
  const primary = c.primary
  const secondary = c.secondary
  const accent = c.accent
  const danger = c.danger
  const textColor = c.text

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: ${bg}; font-family: system-ui, sans-serif; }
  #game-container { width: 100%; height: 100%; }

  /* Tutorial overlay */
  #tutorial {
    position: fixed; inset: 0; background: rgba(0,0,0,0.82);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; font-family: system-ui, sans-serif;
  }
  #tutorial.hidden { display: none; }
  .tut-box {
    background: ${bg}; border: 3px solid ${primary};
    border-radius: 16px; padding: 28px 32px; max-width: 380px; width: 90%;
    color: ${textColor};
  }
  .tut-box h2 { font-size: 20px; margin-bottom: 12px; color: ${accent}; }
  .tut-box p { font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
  .tut-box .tut-btn {
    margin-top: 16px; padding: 10px 28px;
    background: ${primary}; color: #fff; border: none;
    border-radius: 8px; font-size: 15px; font-weight: 700;
    cursor: pointer; width: 100%;
  }
  .tut-btn:hover { opacity: 0.85; }

  /* Help button */
  #help-btn {
    position: fixed; top: 12px; right: 12px;
    width: 36px; height: 36px; border-radius: 50%;
    background: ${primary}; color: #fff;
    border: none; font-size: 18px; font-weight: 700;
    cursor: pointer; z-index: 900; line-height: 36px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  #help-btn:hover { opacity: 0.85; }
</style>
</head>
<body>

<!-- Tutorial overlay -->
<div id="tutorial">
  <div class="tut-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in <strong>${config.worldName}</strong>.</p>
    <p>Each round shows a <strong>target number</strong>. Click ${config.itemName} to collect them.</p>
    <p>Your collected total must <strong>match the target exactly</strong> — not too many, not too few!</p>
    ${IS_TIMED ? `<p>⏱ <strong>Timed mode:</strong> you have ${TIMER_SECONDS} seconds per round!</p>` : ""}
    ${IS_CHALLENGE ? `<p>🔍 <strong>Challenge mode:</strong> item values are hidden — hover to reveal!</p>` : ""}
    <p>3 wrong answers = game over. Good luck!</p>
    <button class="tut-btn" onclick="startGame()">Let's go!</button>
  </div>
</div>

<!-- Help button (always visible after game starts) -->
<button id="help-btn" style="display:none" onclick="showHelp()">?</button>

<div id="game-container"></div>

<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"><\/script>
<script>
// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS   = ${TOTAL_ROUNDS};
const IS_TIMED       = ${IS_TIMED};
const IS_CHALLENGE   = ${IS_CHALLENGE};
const TIMER_SECS     = ${TIMER_SECONDS};
const MAX_LIVES      = ${LIVES};
const CHARACTER_URL  = "${characterUrl}";
const ITEM_URL       = "${itemUrl}";
const BG_URL         = "${bgUrl}";
const COL_BG         = "${bg}";
const COL_PRIMARY    = "${primary}";
const COL_SECONDARY  = "${secondary}";
const COL_ACCENT     = "${accent}";
const COL_DANGER     = "${danger}";
const COL_TEXT       = "${textColor}";
const WIN_MSG        = ${JSON.stringify(config.winMessage)};
const LOSE_MSG       = ${JSON.stringify(config.loseMessage)};
const ITEM_NAME      = ${JSON.stringify(config.itemName)};
const CHARACTER_NAME = ${JSON.stringify(config.character)};
const WORLD_NAME     = ${JSON.stringify(config.worldName)};

// ─── Utility ──────────────────────────────────────────────────────────────────
function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

function generateRound(round) {
  let maxVal, itemCount;
  if (round < 2)      { maxVal = 10; itemCount = 6; }
  else if (round < 4) { maxVal = 20; itemCount = 7; }
  else                { maxVal = 30; itemCount = 8; }

  const minTarget = Math.max(5, maxVal - 10);
  const target = Math.floor(Math.random() * (maxVal - minTarget)) + minTarget;
  const items  = [];

  // Guarantee at least one valid pair
  const a = Math.floor(Math.random() * (target - 1)) + 1;
  items.push(a, target - a);

  // Distractors (avoid accidental solutions that are trivially easy)
  let tries = 0;
  while (items.length < itemCount && tries < 200) {
    tries++;
    const v = Math.floor(Math.random() * maxVal) + 1;
    if (v !== target) items.push(v);
  }

  // Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { target, items };
}

// ─── State ────────────────────────────────────────────────────────────────────
let gameScore  = 0;
let gameStarted = false;

// ─── BootScene ────────────────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Loading bar
    const barBg = this.add.rectangle(W / 2, H / 2, 300, 18, 0x333333, 1).setOrigin(0.5);
    const bar   = this.add.rectangle(W / 2 - 149, H / 2, 2, 14, hexToNum(COL_ACCENT), 1).setOrigin(0, 0.5);
    const label = this.add.text(W / 2, H / 2 - 24, 'Loading...', {
      fontSize: '14px', color: COL_TEXT, fontFamily: 'system-ui'
    }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      bar.width = Math.max(2, v * 298);
    });

    // Load assets as SVG textures
    this.load.svg('character', CHARACTER_URL, { width: 120, height: 120 });
    this.load.svg('item',      ITEM_URL,      { width: 64,  height: 64  });
    this.load.svg('bg',        BG_URL,        { width: 800, height: 600 });
  }

  create() {
    this.scene.start('GameScene');
  }
}

// ─── GameScene ────────────────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;

    this.round          = 0;
    this.lives          = MAX_LIVES;
    this.collectedItems = [];   // { sprite, valueTxt, value }
    this.currentTotal   = 0;
    this.targetValue    = 0;
    this.itemSprites    = [];
    this.roundItems     = [];
    this.timerVal       = TIMER_SECS;
    this.timerActive    = false;
    this.timerEvent     = null;
    this.shaking        = false;

    this._buildBackground();
    this._buildUI();
    this._buildCharacter();
    this._buildDoneButton();

    this.startRound();
  }

  // ── Background ──────────────────────────────────────────────────────────────
  _buildBackground() {
    const W = this.W, H = this.H;

    // Full-canvas bg image
    const bg = this.add.image(W / 2, H / 2, 'bg');
    const scaleX = W / bg.width;
    const scaleY = H / bg.height;
    bg.setScale(Math.max(scaleX, scaleY));

    // Semi-transparent overlay for readability
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.48);
  }

  // ── UI Chrome ───────────────────────────────────────────────────────────────
  _buildUI() {
    const W = this.W, H = this.H;
    const pad = 14;

    // Score (top-right)
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: 'system-ui', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    // Lives hearts (top-left)
    this.heartsGroup = this.add.group();
    this._redrawHearts();

    // Round dots (top-centre)
    this.dotGroup = this.add.group();
    this._redrawDots();

    // Target display (upper centre)
    this.targetLbl = this.add.text(W / 2, pad, 'Collect exactly', {
      fontSize: '13px', color: COL_TEXT, fontFamily: 'system-ui', alpha: 0.7
    }).setOrigin(0.5, 0).setDepth(10);

    this.targetNum = this.add.text(W / 2, pad + 18, '0', {
      fontSize: '54px', color: COL_ACCENT, fontFamily: 'system-ui', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);

    // Current total
    const totalY = this.targetNum.y + 68;
    this.add.text(W / 2, totalY, 'You have:', {
      fontSize: '13px', color: COL_TEXT, fontFamily: 'system-ui', alpha: 0.6
    }).setOrigin(0.5, 0).setDepth(10);

    this.totalNum = this.add.text(W / 2, totalY + 16, '0', {
      fontSize: '34px', color: COL_PRIMARY, fontFamily: 'system-ui', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);

    // Collected zone (horizontal strip above done button)
    const collY = H - 96;
    this.add.text(pad, collY - 20, 'Collected:', {
      fontSize: '12px', color: COL_TEXT, fontFamily: 'system-ui', alpha: 0.55
    }).setOrigin(0, 0).setDepth(10);

    // Dashed separator line
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(1, hexToNum(COL_ACCENT), 0.3);
    g.lineBetween(pad, collY - 4, W - pad, collY - 4);

    this.collectedZone = { x: pad, y: collY, maxW: W - pad * 2 };

    // Timer bar (only for timed)
    if (IS_TIMED) {
      this.timerBarBg = this.add.rectangle(W / 2, H - 14, W - 32, 8, 0x333333, 1)
        .setOrigin(0.5, 0.5).setDepth(10);
      this.timerBar = this.add.rectangle(W / 2 - (W - 32) / 2, H - 14, W - 32, 8, hexToNum(COL_ACCENT), 1)
        .setOrigin(0, 0.5).setDepth(10);
      this.timerTxt = this.add.text(W / 2, H - 26, TIMER_SECS + 's', {
        fontSize: '12px', color: COL_TEXT, fontFamily: 'system-ui'
      }).setOrigin(0.5, 0.5).setDepth(10);
    }
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < MAX_LIVES; i++) {
      const col = i < this.lives ? COL_DANGER : '#444444';
      const h = this.add.text(14 + i * 22, 14, '♥', {
        fontSize: '18px', color: col, fontFamily: 'system-ui'
      }).setDepth(10);
      this.heartsGroup.add(h);
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    const dotW = 12, gap = 6;
    const total = (dotW + gap) * TOTAL_ROUNDS - gap;
    const startX = this.W / 2 - total / 2;
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      let col;
      if (i < this.round)       col = hexToNum(COL_ACCENT);
      else if (i === this.round) col = hexToNum(COL_PRIMARY);
      else                       col = 0x444444;
      const dot = this.add.circle(startX + i * (dotW + gap), this.H - 18, dotW / 2, col, 1).setDepth(10);
      this.dotGroup.add(dot);
    }
  }

  // ── Character ───────────────────────────────────────────────────────────────
  _buildCharacter() {
    this.character = this.add.image(70, this.H - 80, 'character')
      .setScale(0.7).setDepth(8);

    // Idle bobbing tween
    this.charTween = this.tweens.add({
      targets: this.character,
      y: this.H - 90,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ── Done button ─────────────────────────────────────────────────────────────
  _buildDoneButton() {
    const W = this.W, H = this.H;
    const bx = W - 72, by = H - 60;

    const bg = this.add.rectangle(bx, by, 100, 38, hexToNum(COL_PRIMARY), 1)
      .setOrigin(0.5).setDepth(10).setInteractive({ cursor: 'pointer' });

    const txt = this.add.text(bx, by, 'Done!', {
      fontSize: '16px', color: '#fff', fontFamily: 'system-ui', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    bg.on('pointerover',  () => bg.setAlpha(0.8));
    bg.on('pointerout',   () => bg.setAlpha(1.0));
    bg.on('pointerdown',  () => this._checkCollection());
  }

  // ── Round Logic ─────────────────────────────────────────────────────────────
  startRound() {
    this._clearItems();
    this._clearCollected();

    this.collectedItems = [];
    this.currentTotal   = 0;
    this._updateTotal();

    const data = generateRound(this.round);
    this.targetValue = data.target;
    this.roundItems  = data.items;

    // Animate in target number
    this.targetNum.setText(data.target).setScale(0.4).setAlpha(0);
    this.tweens.add({
      targets: this.targetNum, scale: 1, alpha: 1,
      duration: 350, ease: 'Back.easeOut'
    });

    this._redrawDots();
    this._spawnItems(data.items);

    if (IS_TIMED) {
      this.timerVal = TIMER_SECS;
      this.timerActive = true;
      if (this.timerEvent) this.timerEvent.remove();
      this.timerEvent = this.time.addEvent({
        delay: 1000, loop: true, callback: this._tickTimer, callbackScope: this
      });
      this._updateTimerBar();
    }
  }

  _tickTimer() {
    if (!this.timerActive) return;
    this.timerVal--;
    this._updateTimerBar();
    if (this.timerVal <= 0) {
      this.timerActive = false;
      this.timerEvent.remove();
      this._onWrongAnswer('Time\'s up!');
    }
  }

  _updateTimerBar() {
    if (!IS_TIMED) return;
    const pct = Math.max(0, this.timerVal / TIMER_SECS);
    const fullW = this.W - 32;
    this.timerBar.width = Math.max(0, pct * fullW);
    const col = pct > 0.5 ? COL_ACCENT : (pct > 0.25 ? '#ffaa00' : COL_DANGER);
    this.timerBar.fillColor = hexToNum(col);
    this.timerTxt.setText(this.timerVal + 's');
  }

  // ── Spawn Items ─────────────────────────────────────────────────────────────
  _spawnItems(values) {
    const W = this.W, H = this.H;
    const itemArea = { x: 14, y: 180, w: W - 28, h: H - 300 };
    const cols = Math.min(values.length, 4);
    const rows = Math.ceil(values.length / cols);
    const cellW = itemArea.w / cols;
    const cellH = Math.min(80, itemArea.h / rows);

    values.forEach((val, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = itemArea.x + col * cellW + cellW / 2;
      const ty = itemArea.y + row * cellH + cellH / 2;

      // Sprite
      const spr = this.add.image(tx, ty - 60, 'item')
        .setScale(0.6).setDepth(6).setAlpha(0)
        .setInteractive({ cursor: 'pointer' });

      // Value label
      let displayVal = IS_CHALLENGE ? '?' : String(val);
      const lbl = this.add.text(tx, ty - 20, displayVal, {
        fontSize: '15px', fontStyle: 'bold', color: COL_ACCENT,
        fontFamily: 'system-ui',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(7).setAlpha(0);

      // Challenge mode: reveal on hover
      if (IS_CHALLENGE) {
        spr.on('pointerover', () => lbl.setText(String(val)));
        spr.on('pointerout',  () => lbl.setText('?'));
      }

      // Hover glow
      spr.on('pointerover', () => {
        this.tweens.add({ targets: spr, scale: 0.72, duration: 100 });
      });
      spr.on('pointerout', () => {
        this.tweens.add({ targets: spr, scale: 0.6, duration: 100 });
      });

      // Click to collect
      spr.on('pointerdown', () => this._collectItem(spr, lbl, val));

      // Drop-in animation (staggered)
      this.tweens.add({
        targets: [spr, lbl], alpha: 1,
        delay: i * 60, duration: 280, ease: 'Cubic.easeOut'
      });
      this.tweens.add({
        targets: spr, y: ty,
        delay: i * 60, duration: 320, ease: 'Back.easeOut',
        onUpdate: () => lbl.setY(spr.y + 40)
      });

      this.itemSprites.push({ spr, lbl, val, tx, ty });
    });
  }

  _clearItems() {
    this.itemSprites.forEach(({ spr, lbl }) => { spr.destroy(); lbl.destroy(); });
    this.itemSprites = [];
  }

  // ── Collect / Return ────────────────────────────────────────────────────────
  _collectItem(spr, lbl, val) {
    // Remove from itemSprites list
    const idx = this.itemSprites.findIndex(i => i.spr === spr);
    if (idx === -1) return;
    this.itemSprites.splice(idx, 1);

    spr.disableInteractive();

    // Fly to collected zone
    const zone = this.collectedZone;
    const slot = this.collectedItems.length;
    const destX = zone.x + 24 + slot * 52;
    const destY = zone.y + 16;

    this.tweens.add({
      targets: spr,
      x: destX, y: destY, scale: 0.38,
      duration: 260, ease: 'Cubic.easeOut',
      onComplete: () => {
        spr.setInteractive({ cursor: 'pointer' });
        spr.on('pointerdown', () => this._returnItem(spr, lbl, val));
      }
    });
    this.tweens.add({ targets: lbl, alpha: 0, duration: 160 });

    // Mini label in collected zone
    const cLbl = this.add.text(destX, destY + 22, String(val), {
      fontSize: '12px', color: COL_ACCENT, fontFamily: 'system-ui', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(8);

    this.collectedItems.push({ spr, lbl, cLbl, val, destX, destY });

    this.currentTotal += val;
    this._updateTotal();
  }

  _returnItem(spr, lbl, val) {
    const idx = this.collectedItems.findIndex(i => i.spr === spr);
    if (idx === -1) return;
    const { cLbl, destX, destY } = this.collectedItems[idx];
    this.collectedItems.splice(idx, 1);
    cLbl.destroy();

    // Reposition remaining collected labels
    this._repositionCollected();

    spr.disableInteractive();

    // Find original grid position
    const origSlot = this.itemSprites.length;
    const cols = Math.min(this.roundItems.length, 4);
    const col = origSlot % cols;
    const row = Math.floor(origSlot / cols);
    const itemArea = { x: 14, y: 180, w: this.W - 28 };
    const cellW = itemArea.w / cols;
    const tx = itemArea.x + col * cellW + cellW / 2;
    const ty = 200 + row * 80;

    this.tweens.add({
      targets: spr, x: tx, y: ty, scale: 0.6,
      duration: 260, ease: 'Cubic.easeOut',
      onComplete: () => {
        spr.setInteractive({ cursor: 'pointer' });
        spr.removeAllListeners('pointerdown');
        spr.on('pointerdown', () => this._collectItem(spr, lbl, val));
        lbl.setPosition(tx, ty + 40).setAlpha(1);
        if (IS_CHALLENGE) lbl.setText('?');
        this.itemSprites.push({ spr, lbl, val, tx, ty });
      }
    });

    this.currentTotal -= val;
    this._updateTotal();
  }

  _repositionCollected() {
    this.collectedItems.forEach(({ spr, cLbl }, i) => {
      const zone = this.collectedZone;
      const nx = zone.x + 24 + i * 52;
      const ny = zone.y + 16;
      this.tweens.add({ targets: spr, x: nx, y: ny, duration: 180 });
      cLbl.setPosition(nx, ny + 22);
    });
  }

  _clearCollected() {
    this.collectedItems.forEach(({ spr, lbl, cLbl }) => {
      spr.destroy(); lbl.destroy(); cLbl.destroy();
    });
    this.collectedItems = [];
  }

  _updateTotal() {
    this.totalNum.setText(String(this.currentTotal));
    if (this.currentTotal === this.targetValue) {
      this.totalNum.setColor(COL_ACCENT);
    } else if (this.currentTotal > this.targetValue) {
      this.totalNum.setColor(COL_DANGER);
    } else {
      this.totalNum.setColor(COL_PRIMARY);
    }
  }

  // ── Check / Win / Lose ──────────────────────────────────────────────────────
  _checkCollection() {
    if (this.shaking) return;

    if (this.currentTotal === this.targetValue) {
      // Correct!
      if (IS_TIMED) { this.timerActive = false; this.timerEvent && this.timerEvent.remove(); }

      const pts = 10 * (this.round + 1);
      gameScore += pts;
      this.scoreLbl.setText('Score: ' + gameScore);

      this._showScorePop('+' + pts);
      this._burstParticles(this.W / 2, this.H / 2, 18);
      this._characterCelebrate();

      const prevRound = this.round;
      this.round++;
      this._redrawDots();

      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(700, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(900, () => this.startRound());
      }

    } else {
      const msg = this.currentTotal > this.targetValue ? 'Too many! Remove some.' : 'Not enough!';
      this._onWrongAnswer(msg);
    }
  }

  _onWrongAnswer(msg) {
    this.lives--;
    this._redrawHearts();
    this._screenShake();
    this._characterFlinch();
    this._showScorePop(msg, COL_DANGER);

    if (this.lives <= 0) {
      if (IS_TIMED) { this.timerActive = false; this.timerEvent && this.timerEvent.remove(); }
      this.time.delayedCall(800, () => this._gameLose());
    } else {
      // Reset collected items back to grid for retry
      this.time.delayedCall(400, () => {
        this._clearCollected();
        this._clearItems();
        this.collectedItems = [];
        this.currentTotal = 0;
        this._updateTotal();
        this._spawnItems(this.roundItems);
        if (IS_TIMED) {
          this.timerVal = TIMER_SECS;
          this.timerActive = true;
          if (this.timerEvent) this.timerEvent.remove();
          this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true, callback: this._tickTimer, callbackScope: this
          });
          this._updateTimerBar();
        }
      });
    }
  }

  _gameLose() {
    window.parent.postMessage({ type: 'game_lose' }, '*');
    this.scene.start('LoseScene', { score: gameScore });
  }

  // ── Effects ─────────────────────────────────────────────────────────────────
  _screenShake() {
    if (this.shaking) return;
    this.shaking = true;
    this.cameras.main.shake(380, 0.012);
    this.time.delayedCall(420, () => { this.shaking = false; });
  }

  _characterCelebrate() {
    this.charTween.stop();
    this.tweens.add({
      targets: this.character,
      y: this.H - 130, angle: 15,
      duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.character.setAngle(0);
        this.charTween = this.tweens.add({
          targets: this.character, y: this.H - 90,
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    });
  }

  _characterFlinch() {
    this.charTween.stop();
    this.tweens.add({
      targets: this.character, angle: -20, x: 50,
      duration: 120, yoyo: true, repeat: 1,
      onComplete: () => {
        this.character.setAngle(0).setX(70);
        this.charTween = this.tweens.add({
          targets: this.character, y: this.H - 90,
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    });
  }

  _burstParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const dist  = 60 + Math.random() * 80;
      const dot   = this.add.circle(x, y, 5 + Math.random() * 6, hexToNum(COL_ACCENT), 1).setDepth(20);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.2,
        duration: 550 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => dot.destroy()
      });
    }
    // Also a few with COL_PRIMARY
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 30 + Math.random() * 60;
      const dot   = this.add.circle(x, y, 3 + Math.random() * 4, hexToNum(COL_PRIMARY), 1).setDepth(20);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.1,
        duration: 400 + Math.random() * 300,
        ease: 'Cubic.easeOut',
        onComplete: () => dot.destroy()
      });
    }
  }

  _showScorePop(txt, col) {
    const color = col || COL_ACCENT;
    const pop = this.add.text(this.W / 2, this.H / 2 - 40, txt, {
      fontSize: '22px', fontStyle: 'bold', color: color,
      fontFamily: 'system-ui', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets: pop, alpha: 1, y: this.H / 2 - 80,
      duration: 300, ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: pop, alpha: 0, y: this.H / 2 - 110,
          delay: 600, duration: 300,
          onComplete: () => pop.destroy()
        });
      }
    });
  }
}

// ─── VictoryScene ─────────────────────────────────────────────────────────────
class VictoryScene extends Phaser.Scene {
  constructor() { super('VictoryScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;

    // Reuse bg image (already loaded)
    const bg = this.add.image(W / 2, H / 2, 'bg');
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);

    // Character big
    this.add.image(W / 2, H / 2 - 40, 'character').setScale(1.1).setDepth(5);

    // Win text
    this.add.text(W / 2, H / 2 + 80, WIN_MSG, {
      fontSize: '22px', color: '#fff', fontFamily: 'system-ui', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W - 60 }
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, H / 2 + 120, 'Score: ' + (data.score || 0), {
      fontSize: '18px', color: this._hexCol(), fontFamily: 'system-ui'
    }).setOrigin(0.5).setDepth(6);

    // Fireworks loop
    this._fireworkLoop(W, H);

    // Post win message after 2s
    this.time.delayedCall(2000, () => {
      window.parent.postMessage({ type: 'game_win' }, '*');
    });
  }

  _hexCol() { return COL_ACCENT; }

  _fireworkLoop(W, H) {
    const burst = () => {
      const x = 60 + Math.random() * (W - 120);
      const y = 60 + Math.random() * (H / 2);
      const colours = [hexToNum(COL_ACCENT), hexToNum(COL_PRIMARY), 0xffffff, hexToNum(COL_SECONDARY)];
      const col = colours[Math.floor(Math.random() * colours.length)];
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i;
        const dist  = 40 + Math.random() * 70;
        const dot   = this.add.circle(x, y, 4 + Math.random() * 4, col, 1).setDepth(10);
        this.tweens.add({
          targets: dot,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          alpha: 0, scale: 0.1,
          duration: 600 + Math.random() * 400,
          ease: 'Cubic.easeOut',
          onComplete: () => dot.destroy()
        });
      }
    };
    burst();
    this.time.addEvent({ delay: 500, loop: true, callback: burst });
  }
}

// ─── LoseScene ────────────────────────────────────────────────────────────────
class LoseScene extends Phaser.Scene {
  constructor() { super('LoseScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;

    const bg = this.add.image(W / 2, H / 2, 'bg');
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

    this.add.image(W / 2, H / 2 - 50, 'character').setScale(0.9).setDepth(5).setTint(0x888888);

    this.add.text(W / 2, H / 2 + 50, LOSE_MSG, {
      fontSize: '20px', color: COL_DANGER, fontFamily: 'system-ui', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W - 60 }
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, H / 2 + 90, 'Score: ' + (data.score || 0), {
      fontSize: '16px', color: '#aaa', fontFamily: 'system-ui'
    }).setOrigin(0.5).setDepth(6);
  }
}

// ─── Phaser config ────────────────────────────────────────────────────────────
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: COL_BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, GameScene, VictoryScene, LoseScene],
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
let _game = null;

function startGame() {
  document.getElementById('tutorial').classList.add('hidden');
  document.getElementById('help-btn').style.display = 'block';
  _game = new Phaser.Game(phaserConfig);
}

function showHelp() {
  document.getElementById('tutorial').classList.remove('hidden');
}
<\/script>
</body>
</html>`
}
