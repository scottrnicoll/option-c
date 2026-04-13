// Construction Systems — Phaser engine with 3 game options.
// Math: Building, measuring area, and calculating volume.
// Options: stack-to-target, fill-the-floor, box-packer

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function constructionSystemsPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "stack-to-target"
): string {
  const validOptions = ["stack-to-target", "fill-the-floor", "box-packer"]
  const activeOption = validOptions.includes(option) ? option : "stack-to-target"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "stack-to-target": "StackToTargetScene",
    "fill-the-floor": "FillTheFloorScene",
    "box-packer": "BoxPackerScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Build to the target!",
    helpText: optDef?.helpText || "Reach the exact measurement.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared: Round Generation ────────────────────────────────────────────────
function generateStackRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return {
      prompt: r.prompt || "Stack to the target height!",
      target: r.target,
      blocks: r.items.slice(),
      hint: r.hint || null
    };
  }
  let maxBlock, blockCount, targetMin, targetMax;
  if (round < 2)      { maxBlock = 5;  blockCount = 5; targetMin = 8;  targetMax = 15; }
  else if (round < 4) { maxBlock = 8;  blockCount = 6; targetMin = 15; targetMax = 30; }
  else                { maxBlock = 12; blockCount = 7; targetMin = 25; targetMax = 50; }

  const target = Math.floor(Math.random() * (targetMax - targetMin + 1)) + targetMin;
  const blocks = [];
  // Ensure at least one valid combination that sums to target
  let remaining = target;
  const solveCount = Math.min(3, blockCount - 2);
  for (let i = 0; i < solveCount - 1; i++) {
    const v = Math.floor(Math.random() * Math.min(remaining - 1, maxBlock)) + 1;
    blocks.push(v);
    remaining -= v;
  }
  blocks.push(remaining);
  // Add distractors
  while (blocks.length < blockCount) {
    const v = Math.floor(Math.random() * maxBlock) + 1;
    blocks.push(v);
  }
  // Shuffle
  for (let i = blocks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
  }
  return { prompt: "Stack blocks to height " + target + "!", target, blocks, hint: null };
}

function generateFloorRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return {
      prompt: r.prompt || "Fill the floor!",
      targetArea: r.target,
      gridCols: r.items && r.items[0] ? r.items[0] : 6,
      gridRows: r.items && r.items[1] ? r.items[1] : 4,
      hint: r.hint || null
    };
  }
  let gridCols, gridRows, targetArea;
  if (round < 2)      { gridCols = 4; gridRows = 3; targetArea = Math.floor(Math.random() * 4) + 6; }
  else if (round < 4) { gridCols = 5; gridRows = 4; targetArea = Math.floor(Math.random() * 6) + 10; }
  else                { gridCols = 6; gridRows = 5; targetArea = Math.floor(Math.random() * 8) + 16; }
  return { prompt: "Fill exactly " + targetArea + " square units!", targetArea, gridCols, gridRows, hint: null };
}

function generateBoxRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    // For box-packer, target IS the volume, items hold [length, width, height]
    return {
      prompt: r.prompt || "Calculate the volume!",
      length: r.items && r.items[0] ? r.items[0] : 3,
      width: r.items && r.items[1] ? r.items[1] : 2,
      height: r.items && r.items[2] ? r.items[2] : 2,
      volume: r.target,
      hint: r.hint || null
    };
  }
  let maxDim;
  if (round < 2)      { maxDim = 4; }
  else if (round < 4) { maxDim = 6; }
  else                { maxDim = 9; }
  const l = Math.floor(Math.random() * (maxDim - 1)) + 2;
  const w = Math.floor(Math.random() * (maxDim - 1)) + 2;
  const h = Math.floor(Math.random() * (maxDim - 1)) + 2;
  return {
    prompt: "What is the volume of this box?",
    length: l, width: w, height: h,
    volume: l * w * h,
    hint: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Stack to Target — click blocks to add height, reach exact target
// ═══════════════════════════════════════════════════════════════════════════════
class StackToTargetScene extends Phaser.Scene {
  constructor() { super('StackToTargetScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.currentHeight = 0;
    this.selectedBlocks = [];

    this._bg();
    this._ui();
    this._buildTower();
    this._buildCheckButton();
    this.startRound();
  }

  _bg() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _ui() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group();
    this._rh();
    this.dotGroup = this.add.group();
    this._rd();
    this.promptLbl = this.add.text(W / 2, pad, '', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui",
      align: 'center', wordWrap: { width: W - 80 }
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _rh() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(
        this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)
      );
    }
  }

  _rd() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(
        this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)
      );
    }
  }

  _buildTower() {
    const W = this.W, H = this.H;
    // Tower area on the left
    this.towerX = W * 0.25;
    this.towerBaseY = H * 0.78;
    // Ground line
    this.add.rectangle(this.towerX, this.towerBaseY + 2, 120, 4, hexToNum(COL_SECONDARY), 0.6).setDepth(5);
    // Height label
    this.heightLbl = this.add.text(this.towerX, this.towerBaseY + 20, 'Height: 0', {
      fontSize: '16px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    // Target line (will be positioned in startRound)
    this.targetLine = this.add.rectangle(this.towerX, this.towerBaseY, 130, 3, hexToNum(COL_ACCENT), 0.8).setDepth(5);
    this.targetLbl = this.add.text(this.towerX + 70, this.towerBaseY, '', {
      fontSize: '13px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(10);
    // Tower blocks visual group
    this.towerGroup = this.add.group();
  }

  _buildCheckButton() {
    const W = this.W, H = this.H;
    const btn = this.add.rectangle(W * 0.75, H - 50, 160, 44, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W * 0.75, H - 50, 'Check Height', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this.checkHeight());
  }

  startRound() {
    this.currentHeight = 0;
    this.selectedBlocks = [];
    this.heightLbl.setText('Height: 0');
    this.towerGroup.clear(true, true);

    const data = getRound(this.round);
    this.targetHeight = data.target;
    this.promptLbl.setText(data.prompt);
    data.blocks = data.items;

    // Position target line
    const pixelsPerUnit = Math.min(8, (this.towerBaseY - 80) / data.target);
    this.pixelsPerUnit = pixelsPerUnit;
    this.targetLine.setY(this.towerBaseY - data.target * pixelsPerUnit);
    this.targetLbl.setText('Target: ' + data.target);
    this.targetLbl.setY(this.towerBaseY - data.target * pixelsPerUnit);

    this._rd();

    // Remove old block buttons
    if (this.blockButtons) this.blockButtons.forEach(b => b.destroy());
    this.blockButtons = [];

    // Create block buttons on the right side
    const startX = this.W * 0.55;
    const gap = Math.min(65, (this.W * 0.4) / data.blocks.length);
    const cols = Math.min(4, data.blocks.length);
    data.blocks.forEach((val, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * gap;
      const y = this.H * 0.25 + row * 56;
      const blockH = Math.max(20, Math.min(44, val * 5));
      const bg = this.add.rectangle(x, y, 54, blockH, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      const lbl = this.add.text(x, y, String(val), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8);
      let placed = false;
      bg.on('pointerdown', () => {
        if (!placed) {
          placed = true;
          bg.setFillStyle(hexToNum(COL_PRIMARY), 0.6);
          lbl.setColor(COL_PRIMARY);
          this.currentHeight += val;
          this.selectedBlocks.push(val);
        } else {
          placed = false;
          bg.setFillStyle(hexToNum(COL_SECONDARY), 0.4);
          lbl.setColor(COL_TEXT);
          this.currentHeight -= val;
          const idx = this.selectedBlocks.indexOf(val);
          if (idx > -1) this.selectedBlocks.splice(idx, 1);
        }
        this.heightLbl.setText('Height: ' + this.currentHeight);
        this._drawTowerBlocks();
      });
      this.blockButtons.push(bg, lbl);
    });
  }

  _drawTowerBlocks() {
    this.towerGroup.clear(true, true);
    let y = this.towerBaseY;
    this.selectedBlocks.forEach((val, i) => {
      const blockH = val * this.pixelsPerUnit;
      y -= blockH;
      const block = this.add.rectangle(this.towerX, y + blockH / 2, 60, blockH - 2, hexToNum(COL_PRIMARY), 0.7).setDepth(6);
      const lbl = this.add.text(this.towerX, y + blockH / 2, String(val), {
        fontSize: '12px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7);
      this.towerGroup.add(block);
      this.towerGroup.add(lbl);
    });
  }

  checkHeight() {
    if (this.currentHeight === this.targetHeight) {
      // Correct!
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this._burstParticles(this.towerX, this.towerBaseY - this.currentHeight * this.pixelsPerUnit, 16);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      // Wrong
      this.lives--;
      this._rh();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Fill the Floor — click grid tiles to cover exact target area
// ═══════════════════════════════════════════════════════════════════════════════
class FillTheFloorScene extends Phaser.Scene {
  constructor() { super('FillTheFloorScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.filledCount = 0;

    this._bg();
    this._ui();
    this.startRound();
  }

  _bg() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _ui() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group();
    this._rh();
    this.dotGroup = this.add.group();
    this._rd();
    this.promptLbl = this.add.text(W / 2, pad, '', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui",
      align: 'center', wordWrap: { width: W - 80 }
    }).setOrigin(0.5, 0).setDepth(10);
    this.countLbl = this.add.text(W / 2, this.H - 50, '', {
      fontSize: '18px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
  }

  _rh() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(
        this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)
      );
    }
  }

  _rd() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(
        this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)
      );
    }
  }

  startRound() {
    this.filledCount = 0;
    if (this.gridGroup) this.gridGroup.clear(true, true);
    this.gridGroup = this.add.group();
    this.tileStates = [];

    const data = getRound(this.round);
    this.targetArea = data.target;
    this.gridCols = data.items[0] || 6;
    this.gridRows = data.items[1] || 4;
    this.promptLbl.setText(data.prompt);
    this.countLbl.setText('Filled: 0 / ' + data.targetArea);

    this._rd();
    this._drawGrid();
    this._drawCheckButton();
  }

  _drawGrid() {
    const W = this.W, H = this.H;
    const maxTileW = (W * 0.8) / this.gridCols;
    const maxTileH = (H * 0.5) / this.gridRows;
    const tileSize = Math.min(maxTileW, maxTileH, 60);
    const gridW = this.gridCols * tileSize;
    const gridH = this.gridRows * tileSize;
    const startX = (W - gridW) / 2 + tileSize / 2;
    const startY = H * 0.2 + tileSize / 2;

    this.tileStates = [];
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const x = startX + c * tileSize;
        const y = startY + r * tileSize;
        const idx = r * this.gridCols + c;
        this.tileStates.push(false);
        // Border
        const border = this.add.rectangle(x, y, tileSize - 2, tileSize - 2, hexToNum(COL_SECONDARY), 0.15).setDepth(5);
        border.setStrokeStyle(1, hexToNum(COL_SECONDARY), 0.4);
        this.gridGroup.add(border);
        // Fill tile
        const fill = this.add.rectangle(x, y, tileSize - 4, tileSize - 4, hexToNum(COL_PRIMARY), 0).setDepth(6);
        fill.setInteractive({ useHandCursor: true });
        this.gridGroup.add(fill);
        fill.on('pointerdown', () => {
          if (!this.tileStates[idx]) {
            this.tileStates[idx] = true;
            fill.setAlpha(0.7);
            this.filledCount++;
          } else {
            this.tileStates[idx] = false;
            fill.setAlpha(0);
            this.filledCount--;
          }
          this.countLbl.setText('Filled: ' + this.filledCount + ' / ' + this.targetArea);
        });
      }
    }
  }

  _drawCheckButton() {
    if (this.checkBtn) this.checkBtn.destroy();
    if (this.checkBtnLbl) this.checkBtnLbl.destroy();
    const W = this.W, H = this.H;
    this.checkBtn = this.add.rectangle(W / 2, H - 85, 160, 44, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.checkBtnLbl = this.add.text(W / 2, H - 85, 'Check Area', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    this.checkBtn.on('pointerdown', () => this.checkArea());
  }

  checkArea() {
    if (this.filledCount === this.targetArea) {
      // Correct!
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this._burstParticles(this.W / 2, this.H * 0.4, 18);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      // Wrong
      this.lives--;
      this._rh();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Box Packer — 3D box visualization, type the volume
// ═══════════════════════════════════════════════════════════════════════════════
class BoxPackerScene extends Phaser.Scene {
  constructor() { super('BoxPackerScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;

    this._bg();
    this._ui();
    this._buildInput();
    this.startRound();
  }

  _bg() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _ui() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group();
    this._rh();
    this.dotGroup = this.add.group();
    this._rd();
    this.promptLbl = this.add.text(W / 2, pad, '', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui",
      align: 'center', wordWrap: { width: W - 80 }
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _rh() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(
        this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)
      );
    }
  }

  _rd() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(
        this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)
      );
    }
  }

  _buildInput() {
    const W = this.W, H = this.H, centerX = W / 2;
    this.inputText = '';
    this.inputLbl = this.add.text(centerX, H * 0.65, 'Volume: _', {
      fontSize: '24px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    // Number pad
    const padY = H * 0.76;
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5;
      const row = i < 5 ? 0 : 1;
      const x = centerX - 100 + col * 50;
      const y = padY + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, String(i), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => {
        if (this.inputText.length < 4) {
          this.inputText += String(i);
          this.inputLbl.setText('Volume: ' + this.inputText);
        }
      });
    }
    // Clear button
    const clrBtn = this.add.rectangle(centerX + 150, padY + 22, 50, 36, hexToNum(COL_DANGER), 0.4)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(centerX + 150, padY + 22, 'CLR', {
      fontSize: '12px', color: COL_DANGER, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    clrBtn.on('pointerdown', () => { this.inputText = ''; this.inputLbl.setText('Volume: _'); });
    // Submit button
    const subBtn = this.add.rectangle(centerX, padY + 100, 140, 40, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(centerX, padY + 100, 'Check', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    subBtn.on('pointerdown', () => this.checkVolume());
  }

  startRound() {
    this.inputText = '';
    this.inputLbl.setText('Volume: _');
    if (this.boxGroup) this.boxGroup.clear(true, true);
    this.boxGroup = this.add.group();

    const data = getRound(this.round);
    this.targetVolume = data.target;
    this.boxLength = data.items[0] || 3;
    this.boxWidth = data.items[1] || 2;
    this.boxHeight = data.items[2] || 2;
    this.promptLbl.setText(data.prompt);

    this._rd();
    this._draw3DBox();
  }

  _draw3DBox() {
    const W = this.W, H = this.H;
    const centerX = W * 0.45;
    const centerY = H * 0.38;
    const scale = Math.min(28, 180 / Math.max(this.boxLength, this.boxWidth, this.boxHeight));
    const bw = this.boxLength * scale;
    const bh = this.boxHeight * scale;
    const bd = this.boxWidth * scale * 0.5;

    // Front face
    const front = this.add.rectangle(centerX, centerY, bw, bh, hexToNum(COL_PRIMARY), 0.5).setDepth(5);
    front.setStrokeStyle(2, hexToNum(COL_PRIMARY), 1);
    this.boxGroup.add(front);

    // Top face (parallelogram via polygon)
    const topPts = [
      { x: centerX - bw / 2, y: centerY - bh / 2 },
      { x: centerX - bw / 2 + bd, y: centerY - bh / 2 - bd * 0.6 },
      { x: centerX + bw / 2 + bd, y: centerY - bh / 2 - bd * 0.6 },
      { x: centerX + bw / 2, y: centerY - bh / 2 },
    ];
    const topGfx = this.add.graphics().setDepth(6);
    topGfx.fillStyle(hexToNum(COL_ACCENT), 0.3);
    topGfx.lineStyle(2, hexToNum(COL_ACCENT), 0.8);
    topGfx.beginPath();
    topGfx.moveTo(topPts[0].x, topPts[0].y);
    topGfx.lineTo(topPts[1].x, topPts[1].y);
    topGfx.lineTo(topPts[2].x, topPts[2].y);
    topGfx.lineTo(topPts[3].x, topPts[3].y);
    topGfx.closePath();
    topGfx.fillPath();
    topGfx.strokePath();
    this.boxGroup.add(topGfx);

    // Right face (parallelogram via polygon)
    const rightPts = [
      { x: centerX + bw / 2, y: centerY - bh / 2 },
      { x: centerX + bw / 2 + bd, y: centerY - bh / 2 - bd * 0.6 },
      { x: centerX + bw / 2 + bd, y: centerY + bh / 2 - bd * 0.6 },
      { x: centerX + bw / 2, y: centerY + bh / 2 },
    ];
    const rightGfx = this.add.graphics().setDepth(6);
    rightGfx.fillStyle(hexToNum(COL_SECONDARY), 0.2);
    rightGfx.lineStyle(2, hexToNum(COL_SECONDARY), 0.6);
    rightGfx.beginPath();
    rightGfx.moveTo(rightPts[0].x, rightPts[0].y);
    rightGfx.lineTo(rightPts[1].x, rightPts[1].y);
    rightGfx.lineTo(rightPts[2].x, rightPts[2].y);
    rightGfx.lineTo(rightPts[3].x, rightPts[3].y);
    rightGfx.closePath();
    rightGfx.fillPath();
    rightGfx.strokePath();
    this.boxGroup.add(rightGfx);

    // Dimension labels
    // Length (bottom of front face)
    const lengthLbl = this.add.text(centerX, centerY + bh / 2 + 16, 'L = ' + this.boxLength, {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.boxGroup.add(lengthLbl);

    // Height (left of front face)
    const heightLbl = this.add.text(centerX - bw / 2 - 16, centerY, 'H = ' + this.boxHeight, {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.boxGroup.add(heightLbl);

    // Width (top edge going back)
    const widthLbl = this.add.text(centerX + bw / 2 + bd / 2 + 14, centerY - bh / 2 - bd * 0.3, 'W = ' + this.boxWidth, {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(10);
    this.boxGroup.add(widthLbl);

    // Formula hint
    const formulaLbl = this.add.text(centerX, centerY + bh / 2 + 40, this.boxLength + ' × ' + this.boxWidth + ' × ' + this.boxHeight + ' = ?', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.boxGroup.add(formulaLbl);
  }

  checkVolume() {
    const answer = parseInt(this.inputText);
    if (answer === this.targetVolume) {
      // Correct!
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this._burstParticles(this.W * 0.45, this.H * 0.38, 20);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      // Wrong
      this.lives--;
      this._rh();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      this.inputText = '';
      this.inputLbl.setText('Volume: _');
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}
`
