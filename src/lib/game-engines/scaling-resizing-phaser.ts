// Scale & Transform — Phaser engine with 3 game options.
// Math: Ratios, proportions, percent, scaling, similarity.
// Options: resize-tool, recipe-scaler, map-distance

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function scalingResizingPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "resize-tool"
): string {
  const validOptions = ["resize-tool", "recipe-scaler", "map-distance"]
  const activeOption = validOptions.includes(option) ? option : "resize-tool"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "resize-tool": "ResizeToolScene",
    "recipe-scaler": "RecipeScalerScene",
    "map-distance": "MapDistanceScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Scale it up!",
    helpText: optDef?.helpText || "Use ratios to resize.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared ──────────────────────────────────────────────────────────────────
function generateResizeRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt, original: r.items[0] || 4, scaleFactor: r.target / (r.items[0] || 4), target: r.target, hint: r.hint };
  }
  const originals = round < 2 ? [2, 3, 4] : round < 4 ? [3, 4, 5, 6] : [4, 5, 6, 8];
  const factors = round < 2 ? [2, 3] : round < 4 ? [2, 3, 4] : [2, 3, 4, 5];
  const original = originals[Math.floor(Math.random() * originals.length)];
  const factor = factors[Math.floor(Math.random() * factors.length)];
  return { prompt: 'Scale ' + original + ' by ' + factor + 'x', original, scaleFactor: factor, target: original * factor, hint: null };
}

function generateRecipeScaleRound(round) {
  const baseServings = 4;
  const targetServings = round < 2 ? [8, 2] : round < 4 ? [6, 12, 2] : [8, 12, 16, 3];
  const target = targetServings[Math.floor(Math.random() * targetServings.length)];
  const ingredientCount = round < 2 ? 2 : round < 4 ? 3 : 4;
  const ingredients = [];
  const names = [ITEM_NAME, 'Sugar', 'Flour', 'Butter', 'Eggs'];
  for (let i = 0; i < ingredientCount; i++) {
    const base = Math.floor(Math.random() * 6) + 1;
    ingredients.push({ name: names[i % names.length], base, scaled: base * target / baseServings });
  }
  return { baseServings, targetServings: target, ingredients };
}

function generateMapRound(round) {
  const scales = round < 2 ? [2, 5] : round < 4 ? [5, 10] : [10, 20, 25];
  const scale = scales[Math.floor(Math.random() * scales.length)];
  const mapDist = Math.floor(Math.random() * 8) + 2;
  return { scale, mapDist, realDist: mapDist * scale, unit: 'km' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Resize Tool — drag slider to resize to target ratio
// ═══════════════════════════════════════════════════════════════════════════════
class ResizeToolScene extends Phaser.Scene {
  constructor() { super('ResizeToolScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this._buildBackground();
    this._buildUI();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4);
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.48);
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
    this.promptLbl = this.add.text(W / 2, pad, '', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", align: 'center'
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10));
    }
  }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = getRound(this.round);
    this.targetSize = data.target;
    this.currentSize = data.items[0] || 4;
    this.promptLbl.setText(data.prompt);
    this._redrawDots();
    const W = this.W, H = this.H;
    // Original shape
    const origSize = Math.min(40, W * 0.08);
    this.roundGroup.add(this.add.rectangle(W * 0.25, H * 0.4, origSize, origSize, hexToNum(COL_SECONDARY), 0.5).setStrokeStyle(2, hexToNum(COL_TEXT), 0.5).setDepth(5));
    this.roundGroup.add(this.add.text(W * 0.25, H * 0.4 + origSize / 2 + 15, 'Original: ' + data.items[0], {
      fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6));
    // Target shape (ghost)
    const targetPx = origSize * (data.target / (data.items[0] || 1));
    this.roundGroup.add(this.add.rectangle(W * 0.65, H * 0.4, targetPx, targetPx, 0x000000, 0).setStrokeStyle(2, hexToNum(COL_ACCENT), 0.4).setDepth(5));
    this.roundGroup.add(this.add.text(W * 0.65, H * 0.4 + targetPx / 2 + 15, 'Target: ?', {
      fontSize: '13px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6));
    // Player resizable shape
    this.playerRect = this.add.rectangle(W * 0.65, H * 0.4, origSize, origSize, hexToNum(COL_PRIMARY), 0.4).setDepth(6);
    this.roundGroup.add(this.playerRect);
    // Slider
    const sliderY = H * 0.7;
    const sliderW = W * 0.6;
    const sliderLeft = (W - sliderW) / 2;
    this.roundGroup.add(this.add.rectangle(W / 2, sliderY, sliderW, 4, hexToNum(COL_SECONDARY), 0.5).setDepth(6));
    // Size label
    this.sizeLbl = this.add.text(W / 2, sliderY - 25, String(data.items[0]), {
      fontSize: '22px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(7);
    this.roundGroup.add(this.sizeLbl);
    // Handle
    const handle = this.add.circle(sliderLeft, sliderY, 14, hexToNum(COL_ACCENT))
      .setInteractive({ draggable: true, useHandCursor: true }).setDepth(8);
    const maxSliderVal = data.items[0] * 6;
    handle.on('drag', (pointer, dragX) => {
      const x = Math.max(sliderLeft, Math.min(sliderLeft + sliderW, dragX));
      handle.x = x;
      const frac = (x - sliderLeft) / sliderW;
      this.currentSize = Math.round(data.items[0] + frac * (maxSliderVal - data.items[0]));
      this.sizeLbl.setText(String(this.currentSize));
      const scale = this.currentSize / data.items[0];
      this.playerRect.setSize(origSize * scale, origSize * scale);
    });
    this.roundGroup.add(handle);
    // Check button
    const btn = this.add.rectangle(W / 2, H * 0.85, 140, 42, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.85, 'Lock size', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this._check());
    this.roundGroup.add(btn);
  }

  _check() {
    if (this.currentSize === this.targetSize) {
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      this.lives--;
      this._redrawHearts();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Recipe Scaler — scale a recipe to different servings
// ═══════════════════════════════════════════════════════════════════════════════
class RecipeScalerScene extends Phaser.Scene {
  constructor() { super('RecipeScalerScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this._buildBackground();
    this._buildUI();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4);
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.48);
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
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10));
    }
  }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = generateRecipeScaleRound(this.round);
    this.recipeData = data;
    this.playerAmounts = data.ingredients.map(() => 0);
    this._redrawDots();
    const W = this.W, H = this.H;
    // Header
    this.roundGroup.add(this.add.text(W / 2, 40, 'Recipe for ' + data.baseServings + ' servings → Scale to ' + data.targetServings, {
      fontSize: '15px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    // Ingredients
    this.playerLbls = [];
    const startY = H * 0.2;
    const rowH = 55;
    data.ingredients.forEach((ing, i) => {
      const y = startY + i * rowH;
      // Original amount
      this.roundGroup.add(this.add.text(W * 0.1, y, ing.name + ': ' + ing.base + ' (for ' + data.baseServings + ')', {
        fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
      }).setOrigin(0, 0.5).setDepth(6));
      // Player input
      const lbl = this.add.text(W * 0.72, y, '0', {
        fontSize: '22px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7);
      this.playerLbls.push(lbl);
      this.roundGroup.add(lbl);
      // +/- buttons
      const minus = this.add.text(W * 0.58, y, '−', {
        fontSize: '24px', color: COL_DANGER, fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7).setInteractive({ useHandCursor: true });
      minus.on('pointerdown', () => {
        if (this.playerAmounts[i] > 0) { this.playerAmounts[i]--; lbl.setText(String(this.playerAmounts[i])); }
      });
      this.roundGroup.add(minus);
      const plus = this.add.text(W * 0.86, y, '+', {
        fontSize: '24px', color: COL_ACCENT, fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7).setInteractive({ useHandCursor: true });
      plus.on('pointerdown', () => {
        this.playerAmounts[i]++;
        lbl.setText(String(this.playerAmounts[i]));
      });
      this.roundGroup.add(plus);
    });
    // Check
    const btn = this.add.rectangle(W / 2, H * 0.85, 140, 42, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.85, 'Check recipe', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this._check());
    this.roundGroup.add(btn);
  }

  _check() {
    const correct = this.recipeData.ingredients.every((ing, i) => this.playerAmounts[i] === ing.scaled);
    if (correct) {
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      this.lives--;
      this._redrawHearts();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Map Distance — use map scale to find real distances
// ═══════════════════════════════════════════════════════════════════════════════
class MapDistanceScene extends Phaser.Scene {
  constructor() { super('MapDistanceScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this._buildBackground();
    this._buildUI();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4);
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.48);
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
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10));
    }
  }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = generateMapRound(this.round);
    this.correctDist = data.realDist;
    this._redrawDots();
    const W = this.W, H = this.H;
    // Map visual
    this.roundGroup.add(this.add.rectangle(W / 2, H * 0.3, W * 0.6, H * 0.25, hexToNum(COL_SECONDARY), 0.15).setStrokeStyle(2, hexToNum(COL_TEXT), 0.3).setDepth(5));
    // Two dots on map
    const dotAx = W * 0.3, dotBx = W * 0.3 + data.mapDist * 20;
    const dotY = H * 0.3;
    this.roundGroup.add(this.add.circle(dotAx, dotY, 6, hexToNum(COL_ACCENT)).setDepth(6));
    this.roundGroup.add(this.add.circle(dotBx, dotY, 6, hexToNum(COL_DANGER)).setDepth(6));
    // Distance line
    this.roundGroup.add(this.add.rectangle((dotAx + dotBx) / 2, dotY + 15, dotBx - dotAx, 2, hexToNum(COL_TEXT), 0.5).setDepth(6));
    this.roundGroup.add(this.add.text((dotAx + dotBx) / 2, dotY + 25, data.mapDist + ' cm on map', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6));
    // Scale legend
    this.roundGroup.add(this.add.text(W / 2, H * 0.5, 'Scale: 1 cm = ' + data.scale + ' ' + data.unit, {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    this.roundGroup.add(this.add.text(W / 2, H * 0.56, 'What is the real distance?', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6));
    // Number input
    this.inputText = '';
    this.inputLbl = this.add.text(W / 2, H * 0.64, '_ ' + data.unit, {
      fontSize: '28px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.roundGroup.add(this.inputLbl);
    // Number pad
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5;
      const row = i < 5 ? 0 : 1;
      const x = W / 2 - 100 + col * 50;
      const y = H * 0.74 + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, String(i), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => {
        if (this.inputText.length < 4) { this.inputText += String(i); this.inputLbl.setText(this.inputText + ' ' + data.unit); }
      });
      this.roundGroup.add(btn);
    }
    // Submit
    const sub = this.add.rectangle(W / 2, H * 0.74 + 100, 120, 38, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.74 + 100, 'Check', {
      fontSize: '14px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown', () => this._check());
    this.roundGroup.add(sub);
  }

  _check() {
    const answer = parseInt(this.inputText);
    if (answer === this.correctDist) {
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      this.lives--;
      this._redrawHearts();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      this.inputText = '';
      this.inputLbl.setText('_ km');
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}
`
