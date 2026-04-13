// Collect & Manage — Phaser engine with 3 game options.
// Math: Add values to hit a target sum.
// Options: free-collect, conveyor-belt, split-the-loot

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function collectManagePhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "free-collect"
): string {
  // Default to free-collect for this mechanic
  const validOptions = ["free-collect", "conveyor-belt", "split-the-loot"]
  const activeOption = validOptions.includes(option) ? option : "free-collect"

  const optDef = getOptionDef(activeOption)

  // Scene name mapping
  const sceneMap: Record<string, string> = {
    "free-collect": "FreeCollectScene",
    "conveyor-belt": "ConveyorBeltScene",
    "split-the-loot": "SplitTheLootScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Click items to collect them!",
    helpText: optDef?.helpText || "Collect items to match the target.",
    gameSceneCode: GAME_SCENES,
  })
}

// ─── Shared round generation (used by all 3 options) ─────────────────────────
const GAME_SCENES = `
// ─── Shared: Round Generation ────────────────────────────────────────────────
function generateRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return {
      prompt: r.prompt || "Collect the target!",
      target: r.target,
      items: r.items.slice(),
      hint: r.hint || null
    };
  }
  let maxVal, itemCount;
  if (round < 2)      { maxVal = 10; itemCount = 6; }
  else if (round < 4) { maxVal = 20; itemCount = 7; }
  else                { maxVal = 30; itemCount = 8; }

  const minTarget = Math.max(5, maxVal - 10);
  const target = Math.floor(Math.random() * (maxVal - minTarget)) + minTarget;
  const items  = [];
  const a = Math.floor(Math.random() * (target - 1)) + 1;
  items.push(a, target - a);

  let tries = 0;
  while (items.length < itemCount && tries < 200) {
    tries++;
    const v = Math.floor(Math.random() * maxVal) + 1;
    if (v !== target) items.push(v);
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { prompt: "Collect exactly", target, items, hint: null };
}

function generateSplitRound(round) {
  // Generate two targets and items that can be split between them
  let maxVal, itemCount;
  if (round < 2)      { maxVal = 8;  itemCount = 5; }
  else if (round < 4) { maxVal = 15; itemCount = 7; }
  else                { maxVal = 22; itemCount = 9; }

  const targetA = Math.floor(Math.random() * maxVal) + 3;
  const targetB = Math.floor(Math.random() * maxVal) + 3;
  const total = targetA + targetB;

  // Generate items that sum to total (targetA + targetB)
  const items = [];
  // Ensure subset for targetA
  let remA = targetA;
  const subsetSizeA = Math.min(2, Math.floor(itemCount / 2));
  for (let i = 0; i < subsetSizeA - 1; i++) {
    const v = Math.floor(Math.random() * (remA - 1)) + 1;
    items.push(v);
    remA -= v;
  }
  items.push(remA);

  // Ensure subset for targetB
  let remB = targetB;
  const subsetSizeB = Math.min(2, Math.floor(itemCount / 2));
  for (let i = 0; i < subsetSizeB - 1; i++) {
    const v = Math.floor(Math.random() * (remB - 1)) + 1;
    items.push(v);
    remB -= v;
  }
  items.push(remB);

  // Fill remaining with values that don't break things
  while (items.length < itemCount) {
    // Add pairs that sum to 0 net effect (one for each bin)
    const v = Math.floor(Math.random() * 5) + 1;
    items.push(v);
    if (items.length < itemCount) items.push(v);
  }

  // Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return { targetA, targetB, items: items.slice(0, itemCount) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Free Collect — click items to hit exact target sum
// ═══════════════════════════════════════════════════════════════════════════════
class FreeCollectScene extends Phaser.Scene {
  constructor() { super('FreeCollectScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.collectedItems = [];
    this.currentTotal = 0;
    this.targetValue = 0;
    this.itemSprites = [];
    this.roundItems = [];

    this._buildBackground();
    this._buildUI();
    this._buildCharacter();
    this._buildDoneButton();
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, H = this.H, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    this.heartsGroup = this.add.group();
    this._redrawHearts();
    this.dotGroup = this.add.group();
    this._redrawDots();

    this.targetLbl = this.add.text(W / 2, pad, 'Collect exactly', {
      fontSize: AI_ROUNDS ? '16px' : '13px',
      color: AI_ROUNDS ? COL_ACCENT : COL_TEXT,
      fontFamily: "'Lexend', system-ui",
      fontStyle: AI_ROUNDS ? 'bold' : 'normal',
      alpha: AI_ROUNDS ? 1 : 0.7,
      align: 'center', wordWrap: { width: W - 120 }
    }).setOrigin(0.5, 0).setDepth(10);

    this.targetNum = this.add.text(W / 2, pad + (AI_ROUNDS ? 40 : 18), '0', {
      fontSize: AI_ROUNDS ? '20px' : '54px',
      color: AI_ROUNDS ? COL_TEXT : COL_ACCENT,
      fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold',
      alpha: AI_ROUNDS ? 0.4 : 1
    }).setOrigin(0.5, 0).setDepth(10);

    if (AI_ROUNDS) this.targetNum.setText('?').setFontSize(36).setAlpha(0.3);

    const totalY = this.targetNum.y + (AI_ROUNDS ? 30 : 68);
    this.add.text(W / 2, totalY, AI_ROUNDS ? 'Your answer:' : 'You have:', {
      fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.6
    }).setOrigin(0.5, 0).setDepth(10);

    this.totalNum = this.add.text(W / 2, totalY + 16, '0', {
      fontSize: '34px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);

    const collY = H - 96;
    this.add.text(pad, collY - 20, 'Collected:', {
      fontSize: '12px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.55
    }).setOrigin(0, 0).setDepth(10);

    const g = this.add.graphics().setDepth(5);
    g.lineStyle(1, hexToNum(COL_ACCENT), 0.3);
    g.lineBetween(pad, collY - 4, W - pad, collY - 4);
    this.collectedZone = { x: pad, y: collY, maxW: W - pad * 2 };
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < MAX_LIVES; i++) {
      const col = i < this.lives ? COL_DANGER : '#444';
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', {
        fontSize: '18px', color: col, fontFamily: 'system-ui'
      }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    const dotW = 12, gap = 6;
    const total = (dotW + gap) * TOTAL_ROUNDS - gap;
    const startX = this.W / 2 - total / 2;
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      let col = i < this.round ? hexToNum(COL_ACCENT) : i === this.round ? hexToNum(COL_PRIMARY) : 0x444444;
      this.dotGroup.add(this.add.circle(startX + i * (dotW + gap), this.H - 18, dotW / 2, col, 1).setDepth(10));
    }
  }

  _buildCharacter() {
    this.character = this.add.image(70, this.H - 80, 'character').setScale(0.7).setDepth(8);
    this.charTween = this.tweens.add({
      targets: this.character, y: this.H - 90,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _buildDoneButton() {
    const bx = this.W - 72, by = this.H - 60;
    const bg = this.add.rectangle(bx, by, 100, 38, hexToNum(COL_PRIMARY), 1)
      .setOrigin(0.5).setDepth(10).setInteractive({ cursor: 'pointer' });
    this.add.text(bx, by, 'Done!', {
      fontSize: '16px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => this._checkCollection());
  }

  startRound() {
    this._clearItems();
    this._clearCollected();
    this.collectedItems = [];
    this.currentTotal = 0;
    this._updateTotal();

    const data = generateRound(this.round);
    this.targetValue = data.target;
    this.roundItems = data.items;
    this.targetLbl.setText(data.prompt || 'Collect exactly');

    if (AI_ROUNDS) {
      this.targetNum.setText('?').setFontSize(36).setAlpha(0.3).setScale(1);
      this.targetLbl.setScale(0.8).setAlpha(0);
      this.tweens.add({ targets: this.targetLbl, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    } else {
      this.targetNum.setText(data.target).setScale(0.4).setAlpha(0);
      this.tweens.add({ targets: this.targetNum, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    }

    this._redrawDots();
    this._spawnItems(data.items);
  }

  _spawnItems(values) {
    const W = this.W, H = this.H;
    const itemArea = { x: 14, y: 180, w: W - 28, h: H - 300 };
    const cols = Math.min(values.length, 4);
    const cellW = itemArea.w / cols;
    const cellH = Math.min(80, itemArea.h / Math.ceil(values.length / cols));

    values.forEach((val, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const tx = itemArea.x + col * cellW + cellW / 2;
      const ty = itemArea.y + row * cellH + cellH / 2;

      const spr = this.add.image(tx, ty - 60, 'item')
        .setScale(0.6).setDepth(6).setAlpha(0).setInteractive({ cursor: 'pointer' });
      const lbl = this.add.text(tx, ty - 20, String(val), {
        fontSize: '15px', fontStyle: 'bold', color: COL_ACCENT,
        fontFamily: "'Lexend', system-ui", stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(7).setAlpha(0);

      spr.on('pointerover', () => this.tweens.add({ targets: spr, scale: 0.72, duration: 100 }));
      spr.on('pointerout', () => this.tweens.add({ targets: spr, scale: 0.6, duration: 100 }));
      spr.on('pointerdown', () => this._collectItem(spr, lbl, val));

      this.tweens.add({ targets: [spr, lbl], alpha: 1, delay: i * 60, duration: 280, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: spr, y: ty, delay: i * 60, duration: 320, ease: 'Back.easeOut', onUpdate: () => lbl.setY(spr.y + 40) });
      this.itemSprites.push({ spr, lbl, val, tx, ty });
    });
  }

  _clearItems() {
    this.itemSprites.forEach(({ spr, lbl }) => { spr.destroy(); lbl.destroy(); });
    this.itemSprites = [];
  }

  _collectItem(spr, lbl, val) {
    const idx = this.itemSprites.findIndex(i => i.spr === spr);
    if (idx === -1) return;
    this.itemSprites.splice(idx, 1);
    spr.disableInteractive();

    const zone = this.collectedZone;
    const slot = this.collectedItems.length;
    const destX = zone.x + 24 + slot * 52, destY = zone.y + 16;

    this.tweens.add({
      targets: spr, x: destX, y: destY, scale: 0.38, duration: 260, ease: 'Cubic.easeOut',
      onComplete: () => {
        spr.setInteractive({ cursor: 'pointer' });
        spr.on('pointerdown', () => this._returnItem(spr, lbl, val));
      }
    });
    this.tweens.add({ targets: lbl, alpha: 0, duration: 160 });

    const cLbl = this.add.text(destX, destY + 22, String(val), {
      fontSize: '12px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(8);

    this.collectedItems.push({ spr, lbl, cLbl, val, destX, destY });
    this.currentTotal += val;
    this._updateTotal();
    this._showScorePop('+' + val);
  }

  _returnItem(spr, lbl, val) {
    const idx = this.collectedItems.findIndex(i => i.spr === spr);
    if (idx === -1) return;
    const { cLbl } = this.collectedItems[idx];
    this.collectedItems.splice(idx, 1);
    cLbl.destroy();
    this._repositionCollected();
    spr.disableInteractive();

    const cols = Math.min(this.roundItems.length, 4);
    const itemArea = { x: 14, y: 180, w: this.W - 28 };
    const cellW = itemArea.w / cols;
    const origSlot = this.itemSprites.length;
    const tx = itemArea.x + (origSlot % cols) * cellW + cellW / 2;
    const ty = 200 + Math.floor(origSlot / cols) * 80;

    this.tweens.add({
      targets: spr, x: tx, y: ty, scale: 0.6, duration: 260, ease: 'Cubic.easeOut',
      onComplete: () => {
        spr.setInteractive({ cursor: 'pointer' });
        spr.removeAllListeners('pointerdown');
        spr.on('pointerdown', () => this._collectItem(spr, lbl, val));
        lbl.setPosition(tx, ty + 40).setAlpha(1);
        this.itemSprites.push({ spr, lbl, val, tx, ty });
      }
    });
    this.currentTotal -= val;
    this._updateTotal();
  }

  _repositionCollected() {
    this.collectedItems.forEach(({ spr, cLbl }, i) => {
      const nx = this.collectedZone.x + 24 + i * 52, ny = this.collectedZone.y + 16;
      this.tweens.add({ targets: spr, x: nx, y: ny, duration: 180 });
      cLbl.setPosition(nx, ny + 22);
    });
  }

  _clearCollected() {
    this.collectedItems.forEach(({ spr, lbl, cLbl }) => { spr.destroy(); lbl.destroy(); cLbl.destroy(); });
    this.collectedItems = [];
  }

  _updateTotal() {
    this.totalNum.setText(String(this.currentTotal));
    if (this.currentTotal === this.targetValue) this.totalNum.setColor(COL_ACCENT);
    else if (this.currentTotal > this.targetValue) this.totalNum.setColor(COL_DANGER);
    else this.totalNum.setColor(COL_PRIMARY);
  }

  _checkCollection() {
    if (this._shaking) return;
    if (this.currentTotal === this.targetValue) {
      const pts = 10 * (this.round + 1);
      gameScore += pts;
      this.scoreLbl.setText('Score: ' + gameScore);
      this._showScorePop('+' + pts);
      this._burstParticles(this.W / 2, this.H / 2, 18);
      this._characterCelebrate();
      this.round++;
      this._redrawDots();
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(700, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(900, () => this.startRound());
      }
    } else {
      const msg = AI_ROUNDS
        ? (this.currentTotal > this.targetValue ? 'Too high! Answer is ' + this.targetValue : 'Too low! Answer is ' + this.targetValue)
        : (this.currentTotal > this.targetValue ? 'Too many!' : 'Not enough!');
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
      this.time.delayedCall(800, () => { window.parent.postMessage({ type: 'game_lose' }, '*'); this.scene.start('LoseScene', { score: gameScore }); });
    } else {
      this.time.delayedCall(400, () => {
        this._clearCollected(); this._clearItems();
        this.collectedItems = []; this.currentTotal = 0; this._updateTotal();
        this._spawnItems(this.roundItems);
      });
    }
  }

  _characterCelebrate() {
    this.charTween.stop();
    this.tweens.add({
      targets: this.character, y: this.H - 130, angle: 15,
      duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.character.setAngle(0);
        this.charTween = this.tweens.add({ targets: this.character, y: this.H - 90, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
        this.charTween = this.tweens.add({ targets: this.character, y: this.H - 90, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Conveyor Belt — items scroll past, grab before they disappear
// ═══════════════════════════════════════════════════════════════════════════════
class ConveyorBeltScene extends Phaser.Scene {
  constructor() { super('ConveyorBeltScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.currentTotal = 0;
    this.targetValue = 0;
    this.beltItems = [];
    this.grabbedItems = [];
    this.spawnTimer = null;
    this.beltSpeed = 1.5;

    this._buildBackground();
    this._buildUI();
    this._buildCharacter();
    this._buildBelt();
    this._buildDoneButton();
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    this.heartsGroup = this.add.group();
    this._redrawHearts();
    this.dotGroup = this.add.group();
    this._redrawDots();

    this.targetLbl = this.add.text(W / 2, pad, '', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold',
      align: 'center', wordWrap: { width: W - 120 }
    }).setOrigin(0.5, 0).setDepth(10);

    this.targetNum = this.add.text(W / 2, pad + 28, '0', {
      fontSize: '48px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);

    this.add.text(W / 2, 100, 'Grabbed:', {
      fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.6
    }).setOrigin(0.5, 0).setDepth(10);

    this.totalNum = this.add.text(W / 2, 118, '0', {
      fontSize: '34px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < MAX_LIVES; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', {
        fontSize: '18px', color: i < this.lives ? COL_DANGER : '#444', fontFamily: 'system-ui'
      }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    const dotW = 12, gap = 6, total = (dotW + gap) * TOTAL_ROUNDS - gap;
    const startX = this.W / 2 - total / 2;
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      let col = i < this.round ? hexToNum(COL_ACCENT) : i === this.round ? hexToNum(COL_PRIMARY) : 0x444444;
      this.dotGroup.add(this.add.circle(startX + i * (dotW + gap), this.H - 18, dotW / 2, col, 1).setDepth(10));
    }
  }

  _buildCharacter() {
    this.character = this.add.image(this.W - 60, this.H - 140, 'character').setScale(0.6).setDepth(8);
    this.charTween = this.tweens.add({
      targets: this.character, y: this.character.y - 8,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _buildBelt() {
    const beltY = this.H - 200;
    // Belt track
    this.add.rectangle(this.W / 2, beltY, this.W - 20, 60, hexToNum(COL_SECONDARY), 0.15).setDepth(2);
    // Belt lines (conveyor marks)
    const g = this.add.graphics().setDepth(3);
    g.lineStyle(1, hexToNum(COL_SECONDARY), 0.3);
    g.lineBetween(10, beltY - 30, this.W - 10, beltY - 30);
    g.lineBetween(10, beltY + 30, this.W - 10, beltY + 30);

    // Arrow indicators showing direction
    for (let x = 50; x < this.W; x += 80) {
      this.add.text(x, beltY, '←', {
        fontSize: '16px', color: COL_SECONDARY, fontFamily: 'system-ui', alpha: 0.2
      }).setOrigin(0.5).setDepth(3);
    }

    this.beltY = beltY;

    // Grabbed tray area
    this.add.rectangle(this.W / 2, this.H - 70, this.W - 40, 50, hexToNum(COL_PRIMARY), 0.1).setDepth(2);
    this.trayY = this.H - 70;
  }

  _buildDoneButton() {
    const bx = this.W - 72, by = this.H - 70;
    const bg = this.add.rectangle(bx, by, 100, 38, hexToNum(COL_PRIMARY), 1)
      .setOrigin(0.5).setDepth(10).setInteractive({ cursor: 'pointer' });
    this.add.text(bx, by, 'Done!', {
      fontSize: '16px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => this._checkCollection());
  }

  startRound() {
    // Clear old belt items
    this.beltItems.forEach(({ spr, lbl }) => { spr.destroy(); lbl.destroy(); });
    this.beltItems = [];
    this.grabbedItems.forEach(({ spr, lbl }) => { spr.destroy(); lbl.destroy(); });
    this.grabbedItems = [];
    this.currentTotal = 0;
    this._updateTotal();

    const data = generateRound(this.round);
    this.targetValue = data.target;
    this.targetLbl.setText(data.prompt || 'Grab exactly');
    this.targetNum.setText(AI_ROUNDS ? '?' : String(data.target));

    if (AI_ROUNDS) {
      this.targetNum.setFontSize(36).setAlpha(0.3);
      this.targetLbl.setScale(0.8).setAlpha(0);
      this.tweens.add({ targets: this.targetLbl, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    } else {
      this.targetNum.setScale(0.4).setAlpha(0);
      this.tweens.add({ targets: this.targetNum, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    }

    this._redrawDots();
    this.beltSpeed = 1.5 + this.round * 0.3;

    // Spawn items staggered onto the belt from the right
    const items = data.items;
    let spawnIdx = 0;
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({
      delay: 600,
      repeat: items.length - 1,
      callback: () => {
        if (spawnIdx < items.length) {
          this._spawnBeltItem(items[spawnIdx]);
          spawnIdx++;
        }
      }
    });
  }

  _spawnBeltItem(val) {
    const startX = this.W + 40;
    const spr = this.add.image(startX, this.beltY, 'item')
      .setScale(0.55).setDepth(6).setInteractive({ cursor: 'pointer' });
    const lbl = this.add.text(startX, this.beltY + 34, String(val), {
      fontSize: '14px', fontStyle: 'bold', color: COL_ACCENT,
      fontFamily: "'Lexend', system-ui", stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(7);

    spr.on('pointerover', () => spr.setScale(0.65));
    spr.on('pointerout', () => spr.setScale(0.55));
    spr.on('pointerdown', () => this._grabItem(spr, lbl, val));

    this.beltItems.push({ spr, lbl, val });
  }

  update() {
    // Move belt items left
    for (let i = this.beltItems.length - 1; i >= 0; i--) {
      const item = this.beltItems[i];
      item.spr.x -= this.beltSpeed;
      item.lbl.x = item.spr.x;

      // Fell off the left edge
      if (item.spr.x < -50) {
        item.spr.destroy();
        item.lbl.destroy();
        this.beltItems.splice(i, 1);
      }
    }
  }

  _grabItem(spr, lbl, val) {
    const idx = this.beltItems.findIndex(i => i.spr === spr);
    if (idx === -1) return;
    this.beltItems.splice(idx, 1);
    spr.disableInteractive();

    const slot = this.grabbedItems.length;
    const destX = 30 + slot * 48, destY = this.trayY;

    this.tweens.add({
      targets: spr, x: destX, y: destY, scale: 0.35,
      duration: 200, ease: 'Cubic.easeOut'
    });
    this.tweens.add({
      targets: lbl, x: destX, y: destY + 22, alpha: 0.8,
      duration: 200, ease: 'Cubic.easeOut',
      onComplete: () => lbl.setFontSize(11)
    });

    this.grabbedItems.push({ spr, lbl, val });
    this.currentTotal += val;
    this._updateTotal();
    this._showScorePop('+' + val);
  }

  _updateTotal() {
    this.totalNum.setText(String(this.currentTotal));
    if (this.currentTotal === this.targetValue) this.totalNum.setColor(COL_ACCENT);
    else if (this.currentTotal > this.targetValue) this.totalNum.setColor(COL_DANGER);
    else this.totalNum.setColor(COL_PRIMARY);
  }

  _checkCollection() {
    if (this._shaking) return;
    if (this.currentTotal === this.targetValue) {
      if (this.spawnTimer) this.spawnTimer.remove();
      const pts = 10 * (this.round + 1);
      gameScore += pts;
      this.scoreLbl.setText('Score: ' + gameScore);
      this._showScorePop('+' + pts);
      this._burstParticles(this.W / 2, this.beltY, 18);
      this.round++;
      this._redrawDots();
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(700, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(900, () => this.startRound());
      }
    } else {
      const msg = this.currentTotal > this.targetValue ? 'Too many!' : 'Not enough!';
      this._onWrongAnswer(msg);
    }
  }

  _onWrongAnswer(msg) {
    this.lives--;
    this._redrawHearts();
    this._screenShake();
    this._showScorePop(msg, COL_DANGER);
    if (this.lives <= 0) {
      if (this.spawnTimer) this.spawnTimer.remove();
      this.time.delayedCall(800, () => { window.parent.postMessage({ type: 'game_lose' }, '*'); this.scene.start('LoseScene', { score: gameScore }); });
    } else {
      this.time.delayedCall(400, () => this.startRound());
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Split the Loot — two bins, each with its own target
// ═══════════════════════════════════════════════════════════════════════════════
class SplitTheLootScene extends Phaser.Scene {
  constructor() { super('SplitTheLootScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.targetA = 0;
    this.targetB = 0;
    this.totalA = 0;
    this.totalB = 0;
    this.itemSprites = [];
    this.binAItems = [];
    this.binBItems = [];

    this._buildBackground();
    this._buildUI();
    this._buildBins();
    this._buildCharacter();
    this._buildDoneButton();
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    this.heartsGroup = this.add.group();
    this._redrawHearts();
    this.dotGroup = this.add.group();
    this._redrawDots();

    this.add.text(W / 2, pad, 'Split the loot into two bins!', {
      fontSize: '15px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < MAX_LIVES; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', {
        fontSize: '18px', color: i < this.lives ? COL_DANGER : '#444', fontFamily: 'system-ui'
      }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    const dotW = 12, gap = 6, total = (dotW + gap) * TOTAL_ROUNDS - gap;
    const startX = this.W / 2 - total / 2;
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      let col = i < this.round ? hexToNum(COL_ACCENT) : i === this.round ? hexToNum(COL_PRIMARY) : 0x444444;
      this.dotGroup.add(this.add.circle(startX + i * (dotW + gap), this.H - 18, dotW / 2, col, 1).setDepth(10));
    }
  }

  _buildBins() {
    const W = this.W, H = this.H;
    const binW = W * 0.38, binH = 120;
    const binY = H - 100;

    // Bin A (left)
    this.binARec = this.add.rectangle(W * 0.25, binY, binW, binH, hexToNum(COL_PRIMARY), 0.15)
      .setDepth(2).setStrokeStyle(2, hexToNum(COL_PRIMARY), 0.6);
    this.binALabel = this.add.text(W * 0.25, binY - binH / 2 - 16, 'Bin A: target 0', {
      fontSize: '13px', color: COL_PRIMARY, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.binATotalLbl = this.add.text(W * 0.25, binY + 10, '0', {
      fontSize: '28px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);

    // Bin B (right)
    this.binBRec = this.add.rectangle(W * 0.75, binY, binW, binH, hexToNum(COL_SECONDARY), 0.15)
      .setDepth(2).setStrokeStyle(2, hexToNum(COL_SECONDARY), 0.6);
    this.binBLabel = this.add.text(W * 0.75, binY - binH / 2 - 16, 'Bin B: target 0', {
      fontSize: '13px', color: COL_SECONDARY, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.binBTotalLbl = this.add.text(W * 0.75, binY + 10, '0', {
      fontSize: '28px', color: COL_SECONDARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);

    this.binY = binY;
    this.binW = binW;
    this.binH = binH;
  }

  _buildCharacter() {
    this.character = this.add.image(this.W / 2, this.H - 100, 'character').setScale(0.5).setDepth(8).setAlpha(0.6);
  }

  _buildDoneButton() {
    const bx = this.W / 2, by = this.H - 30;
    const bg = this.add.rectangle(bx, by, 120, 34, hexToNum(COL_ACCENT), 1)
      .setOrigin(0.5).setDepth(10).setInteractive({ cursor: 'pointer' });
    this.add.text(bx, by, 'Check Split!', {
      fontSize: '14px', color: '#000', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => this._checkSplit());
  }

  startRound() {
    // Clear old items
    this.itemSprites.forEach(({ spr, lbl }) => { spr.destroy(); lbl.destroy(); });
    this.itemSprites = [];
    this.binAItems = [];
    this.binBItems = [];
    this.totalA = 0;
    this.totalB = 0;

    const data = generateSplitRound(this.round);
    this.targetA = data.targetA;
    this.targetB = data.targetB;

    this.binALabel.setText('Bin A: target ' + this.targetA);
    this.binBLabel.setText('Bin B: target ' + this.targetB);
    this._updateBinTotals();
    this._redrawDots();

    // Spawn draggable items in center area
    const items = data.items;
    const cols = Math.min(items.length, 5);
    const startX = this.W / 2 - (cols - 1) * 55 / 2;
    const startY = 80;

    items.forEach((val, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * 55;
      const y = startY + row * 70;

      const spr = this.add.image(x, y, 'item')
        .setScale(0.5).setDepth(6).setInteractive({ cursor: 'pointer', draggable: true });
      const lbl = this.add.text(x, y + 30, String(val), {
        fontSize: '13px', fontStyle: 'bold', color: COL_ACCENT,
        fontFamily: "'Lexend', system-ui", stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(7);

      spr._val = val;
      spr._lbl = lbl;
      spr._origX = x;
      spr._origY = y;
      spr._inBin = null;

      this.input.setDraggable(spr);
      this.itemSprites.push({ spr, lbl, val });
    });

    // Drag events
    this.input.on('drag', (pointer, obj, dragX, dragY) => {
      obj.x = dragX;
      obj.y = dragY;
      if (obj._lbl) obj._lbl.setPosition(dragX, dragY + 30);
    });

    this.input.on('dragend', (pointer, obj) => {
      const W = this.W;
      // Check if dropped in bin A or bin B
      if (obj.x < W * 0.5 && obj.y > this.binY - this.binH / 2) {
        this._dropInBin(obj, 'A');
      } else if (obj.x >= W * 0.5 && obj.y > this.binY - this.binH / 2) {
        this._dropInBin(obj, 'B');
      } else {
        // Return to center if was in a bin
        if (obj._inBin) this._removeFromBin(obj);
        this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, duration: 200 });
        this.tweens.add({ targets: obj._lbl, x: obj._origX, y: obj._origY + 30, duration: 200 });
      }
    });
  }

  _dropInBin(spr, bin) {
    // Remove from old bin if switching
    if (spr._inBin) this._removeFromBin(spr);

    if (bin === 'A') {
      this.binAItems.push(spr);
      this.totalA += spr._val;
      const slot = this.binAItems.length - 1;
      const tx = this.W * 0.25 - this.binW / 2 + 20 + (slot % 4) * 40;
      const ty = this.binY - 20 + Math.floor(slot / 4) * 30;
      this.tweens.add({ targets: spr, x: tx, y: ty, scale: 0.35, duration: 200 });
      this.tweens.add({ targets: spr._lbl, x: tx, y: ty + 22, duration: 200 });
    } else {
      this.binBItems.push(spr);
      this.totalB += spr._val;
      const slot = this.binBItems.length - 1;
      const tx = this.W * 0.75 - this.binW / 2 + 20 + (slot % 4) * 40;
      const ty = this.binY - 20 + Math.floor(slot / 4) * 30;
      this.tweens.add({ targets: spr, x: tx, y: ty, scale: 0.35, duration: 200 });
      this.tweens.add({ targets: spr._lbl, x: tx, y: ty + 22, duration: 200 });
    }
    spr._inBin = bin;
    this._updateBinTotals();
  }

  _removeFromBin(spr) {
    if (spr._inBin === 'A') {
      const idx = this.binAItems.indexOf(spr);
      if (idx !== -1) { this.binAItems.splice(idx, 1); this.totalA -= spr._val; }
    } else if (spr._inBin === 'B') {
      const idx = this.binBItems.indexOf(spr);
      if (idx !== -1) { this.binBItems.splice(idx, 1); this.totalB -= spr._val; }
    }
    spr._inBin = null;
    spr.setScale(0.5);
    this._updateBinTotals();
  }

  _updateBinTotals() {
    this.binATotalLbl.setText(String(this.totalA));
    this.binATotalLbl.setColor(this.totalA === this.targetA ? COL_ACCENT : this.totalA > this.targetA ? COL_DANGER : COL_PRIMARY);

    this.binBTotalLbl.setText(String(this.totalB));
    this.binBTotalLbl.setColor(this.totalB === this.targetB ? COL_ACCENT : this.totalB > this.targetB ? COL_DANGER : COL_SECONDARY);

    // Highlight bins when targets hit
    this.binARec.setStrokeStyle(2, this.totalA === this.targetA ? hexToNum(COL_ACCENT) : hexToNum(COL_PRIMARY), 0.6);
    this.binBRec.setStrokeStyle(2, this.totalB === this.targetB ? hexToNum(COL_ACCENT) : hexToNum(COL_SECONDARY), 0.6);
  }

  _checkSplit() {
    if (this._shaking) return;
    if (this.totalA === this.targetA && this.totalB === this.targetB) {
      const pts = 10 * (this.round + 1);
      gameScore += pts;
      this.scoreLbl.setText('Score: ' + gameScore);
      this._showScorePop('+' + pts);
      this._burstParticles(this.W * 0.25, this.binY, 12);
      this._burstParticles(this.W * 0.75, this.binY, 12);
      this.round++;
      this._redrawDots();
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(700, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(900, () => this.startRound());
      }
    } else {
      let msg = '';
      if (this.totalA !== this.targetA) msg += 'Bin A: need ' + this.targetA + ', got ' + this.totalA + '. ';
      if (this.totalB !== this.targetB) msg += 'Bin B: need ' + this.targetB + ', got ' + this.totalB + '.';
      this._onWrongAnswer(msg);
    }
  }

  _onWrongAnswer(msg) {
    this.lives--;
    this._redrawHearts();
    this._screenShake();
    this._showScorePop(msg || 'Not right!', COL_DANGER);
    if (this.lives <= 0) {
      this.time.delayedCall(800, () => { window.parent.postMessage({ type: 'game_lose' }, '*'); this.scene.start('LoseScene', { score: gameScore }); });
    }
    // Don't reset — let them keep trying with remaining lives
  }
}
`
